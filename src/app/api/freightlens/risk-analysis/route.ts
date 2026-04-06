import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

/**
 * POST /api/freightlens/risk-analysis
 * Analyzes rolling 21-day freight data for over-scheduling risks.
 * Returns top 3 risks with FC, date range, severity, and recommended action.
 */
export async function POST(request: Request) {
	try {
		const { rollingData, selectedFCs } = await request.json();

		const prompt = `You are a freight capacity analyst for Amazon fulfillment centers. Analyze the following Rolling 21-day scheduling data and identify the top 3 over-scheduling risks.

Data (FC → daily entries with bmPortal, vendorScheduled, saBlocked, saScheduled, saUnitsLeft, totalUnitsLeft, utilizationPct):
${JSON.stringify(rollingData, null, 0)}

Selected FCs to analyze: ${JSON.stringify(selectedFCs)}

For each risk, identify:
- fc: the FC ID
- dateRange: a human-readable date range (e.g. "Mar 19 - Mar 21")
- severity: "HIGH" if utilization > 100% or totalUnitsLeft = 0 for 2+ consecutive days, "MEDIUM" otherwise
- description: 1 sentence describing the risk
- recommendedAction: 1 sentence with a specific operational recommendation

Return ONLY valid JSON in this exact format (no markdown, no backticks):
[
  {"fc":"SEA1","dateRange":"Mar 19 - Mar 21","severity":"HIGH","description":"...","recommendedAction":"..."},
  {"fc":"PDX2","dateRange":"Mar 25","severity":"MEDIUM","description":"...","recommendedAction":"..."},
  {"fc":"ORD2","dateRange":"Mar 22 - Mar 24","severity":"HIGH","description":"...","recommendedAction":"..."}
]

Return exactly 3 risks sorted by severity (HIGH first). If fewer than 3 real risks exist, include lower-severity observations.`;

		const response = await client.messages.create({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 1000,
			messages: [{ role: 'user', content: prompt }],
		});

		const text = response.content[0].type === 'text' ? response.content[0].text : '[]';
		const cleaned = text.trim().replace(/```json\n?/g, '').replace(/```/g, '').trim();
		const risks = JSON.parse(cleaned);

		return Response.json({ result: risks });
	} catch (error) {
		return Response.json({ error: 'LLM request failed' }, { status: 500 });
	}
}
