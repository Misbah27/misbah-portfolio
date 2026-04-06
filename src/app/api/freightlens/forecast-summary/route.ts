import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

/**
 * POST /api/freightlens/forecast-summary
 * Returns an AI-generated capacity forecast summary for the rolling 21-day view.
 */
export async function POST(request: Request) {
	try {
		const { rollingData, selectedFCs } = await request.json();

		const prompt = `You are a senior freight capacity analyst. Analyze the following Rolling 21-day scheduling data and produce a brief capacity intelligence summary.

Data (FC → daily entries with bmPortal, vendorScheduled, saBlocked, saScheduled, saUnitsLeft, totalUnitsLeft, utilizationPct):
${JSON.stringify(rollingData, null, 0)}

Selected FCs: ${JSON.stringify(selectedFCs)}

Evaluate overall network health based on:
- How many FC-days have utilizationPct > 100% (over-scheduled)
- How many FC-days have totalUnitsLeft = 0 (no remaining capacity)
- Trends: is utilization increasing or decreasing over the 21-day window
- Which FCs are most at risk

Return ONLY valid JSON (no markdown, no backticks):
{"health":"HEALTHY|AT_RISK|CRITICAL","topConcern":"1 sentence describing the biggest concern across the network","recommendation":"1 sentence with a specific operational recommendation"}

Health classification:
- HEALTHY: <10% of FC-days are over-scheduled
- AT_RISK: 10-30% of FC-days are over-scheduled
- CRITICAL: >30% of FC-days are over-scheduled`;

		const response = await client.messages.create({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 1000,
			messages: [{ role: 'user', content: prompt }],
		});

		const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
		const cleaned = text.trim().replace(/```json\n?/g, '').replace(/```/g, '').trim();
		const result = JSON.parse(cleaned);

		return Response.json({
			health: result.health || 'HEALTHY',
			topConcern: result.topConcern || '',
			recommendation: result.recommendation || '',
		});
	} catch (error) {
		return Response.json({ error: 'LLM request failed' }, { status: 500 });
	}
}
