import Anthropic from '@anthropic-ai/sdk';
import { rateLimitResponse } from '@/lib/rate-limit';

const client = new Anthropic();

interface RollingEntry {
	utilizationPct: number;
	totalUnitsLeft: number;
	[key: string]: unknown;
}

/**
 * POST /api/freightlens/risk-analysis
 * Analyzes rolling 21-day freight data for over-scheduling risks.
 */
export async function POST(request: Request) {
	const limited = rateLimitResponse(request);
	if (limited) return limited;
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 25000);

	try {
		const { rollingData, selectedFCs } = await request.json();

		// Build per-FC summary instead of sending raw data
		const fcSummaries = Object.entries(rollingData as Record<string, RollingEntry[]>).map(([fcId, entries]) => {
			const daysOverCapacity = entries.filter((e) => e.utilizationPct > 100).length;
			const maxOverSchedulePct = Math.max(...entries.map((e) => e.utilizationPct));
			const avgUtilization = Math.round(entries.reduce((s, e) => s + e.utilizationPct, 0) / entries.length);
			const daysNoCapacity = entries.filter((e) => e.totalUnitsLeft === 0).length;
			return { fcId, daysOverCapacity, maxOverSchedulePct, avgUtilization, daysNoCapacity, totalDays: entries.length };
		});

		const prompt = `Freight capacity analyst. Analyze these FC scheduling summaries over a 21-day rolling window and identify the top 3 over-scheduling risks.

FC Summaries:
${JSON.stringify(fcSummaries, null, 0)}

Selected FCs: ${JSON.stringify(selectedFCs)}

Return ONLY valid JSON. No prose, no markdown, no backticks.
Return exactly 3 risks sorted by severity (HIGH first):
[{"fc":"SEA1","dateRange":"Mar 19 - Mar 21","severity":"HIGH","description":"1 sentence","recommendedAction":"1 sentence"}]

Severity: HIGH if daysOverCapacity >= 2 or daysNoCapacity >= 2, MEDIUM otherwise.`;

		const response = await client.messages.create(
			{
				model: 'claude-sonnet-4-20250514',
				max_tokens: 1000,
				messages: [{ role: 'user', content: prompt }],
			},
			{ signal: controller.signal }
		);
		clearTimeout(timeout);

		const text = response.content[0].type === 'text' ? response.content[0].text : '[]';
		const cleaned = text.trim().replace(/```json\n?/g, '').replace(/```/g, '').trim();
		const risks = JSON.parse(cleaned);

		return Response.json({ result: risks });
	} catch (error) {
		console.error(`API error in ${import.meta.url}:`, error);
		clearTimeout(timeout);
		if ((error as Error).name === 'AbortError') {
			return Response.json({ error: 'Request timed out — try a shorter query' }, { status: 408 });
		}
		const msg = error instanceof Error ? error.message : 'LLM request failed'; return Response.json({ error: msg }, { status: 500 });
	}
}
