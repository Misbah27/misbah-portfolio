import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

interface RollingEntry {
	utilizationPct: number;
	totalUnitsLeft: number;
	[key: string]: unknown;
}

/**
 * POST /api/freightlens/forecast-summary
 * Returns an AI-generated capacity forecast summary for the rolling 21-day view.
 */
export async function POST(request: Request) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 25000);

	try {
		const { rollingData, selectedFCs } = await request.json();

		// Aggregate stats instead of raw rows
		const allEntries: { fcId: string; utilizationPct: number; totalUnitsLeft: number }[] = [];
		for (const [fcId, entries] of Object.entries(rollingData as Record<string, RollingEntry[]>)) {
			for (const e of entries) {
				allEntries.push({ fcId, utilizationPct: e.utilizationPct, totalUnitsLeft: e.totalUnitsLeft });
			}
		}

		const totalFcDays = allEntries.length;
		const overScheduled = allEntries.filter((e) => e.utilizationPct > 100).length;
		const noCapacity = allEntries.filter((e) => e.totalUnitsLeft === 0).length;
		const avgUtil = Math.round(allEntries.reduce((s, e) => s + e.utilizationPct, 0) / totalFcDays);
		const overPct = Math.round((overScheduled / totalFcDays) * 100);

		// Per-FC risk scores
		const fcRisks = Object.entries(rollingData as Record<string, RollingEntry[]>).map(([fcId, entries]) => ({
			fcId,
			avgUtil: Math.round(entries.reduce((s, e) => s + e.utilizationPct, 0) / entries.length),
			overDays: entries.filter((e) => e.utilizationPct > 100).length,
		}));

		const prompt = `Senior freight capacity analyst. Produce a capacity intelligence summary from these aggregates.

Network stats (21-day window, ${(selectedFCs as string[]).length} FCs):
- Total FC-days: ${totalFcDays}
- Over-scheduled FC-days: ${overScheduled} (${overPct}%)
- Zero-capacity FC-days: ${noCapacity}
- Avg utilization: ${avgUtil}%

Per-FC risk: ${JSON.stringify(fcRisks, null, 0)}

Return ONLY valid JSON. No prose, no markdown, no backticks.
{"health":"HEALTHY|AT_RISK|CRITICAL","topConcern":"1 sentence","recommendation":"1 sentence"}

Health: HEALTHY if <10% over-scheduled, AT_RISK if 10-30%, CRITICAL if >30%.`;

		const response = await client.messages.create(
			{
				model: 'claude-sonnet-4-20250514',
				max_tokens: 1000,
				messages: [{ role: 'user', content: prompt }],
			},
			{ signal: controller.signal }
		);
		clearTimeout(timeout);

		const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
		const cleaned = text.trim().replace(/```json\n?/g, '').replace(/```/g, '').trim();
		const result = JSON.parse(cleaned);

		return Response.json({
			health: result.health || 'HEALTHY',
			topConcern: result.topConcern || '',
			recommendation: result.recommendation || '',
		});
	} catch (error) {
		console.error(`API error in ${import.meta.url}:`, error);
		clearTimeout(timeout);
		if ((error as Error).name === 'AbortError') {
			return Response.json({ error: 'Request timed out — try a shorter query' }, { status: 408 });
		}
		const msg = error instanceof Error ? error.message : 'LLM request failed'; return Response.json({ error: msg }, { status: 500 });
	}
}
