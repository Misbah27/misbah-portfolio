import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

/**
 * POST /api/freightlens/nl-query
 * Converts a natural language metric query into highlighted FCs and an explanation.
 */
export async function POST(request: Request) {
	try {
		const { query, metricsData, selectedFc } = await request.json();

		const prompt = `You are a freight analytics query engine for Amazon FCs. Given FC metric data and a natural language question, identify which FCs match the query.

FC Metrics Data (FC → daily entries with plannedCapacity, totalScheduledQty, ncnsPct, vendorReceipts, endBacklog, maxNyr, backlogSafetyBacklog, palletCount, hotPos, dsAllocationPct, nsAllocationPct):
${JSON.stringify(metricsData, null, 0)}

Currently viewing FC: ${selectedFc}
Available FCs: SEA1, PDX2, LAX3, ORD2, JFK4, DFW3, ATL1, BOS2

Query: "${query}"

Rules:
- "over capacity" means totalScheduledQty > plannedCapacity
- "high NCNS" means ncnsPct > 15%
- "next week" means the later dates in the data
- "backlog" refers to endBacklog or backlogSafetyBacklog
- Consider trends across dates, not just single data points

Return ONLY valid JSON (no markdown, no backticks):
{"highlightedFCs":["SEA1","ORD2"],"explanation":"2-3 sentence explanation of what was found and why these FCs were highlighted."}`;

		const response = await client.messages.create({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 1000,
			messages: [{ role: 'user', content: prompt }],
		});

		const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
		const cleaned = text.trim().replace(/```json\n?/g, '').replace(/```/g, '').trim();
		const result = JSON.parse(cleaned);

		return Response.json({
			highlightedFCs: result.highlightedFCs || [],
			explanation: result.explanation || '',
		});
	} catch (error) {
		return Response.json({ error: 'LLM request failed' }, { status: 500 });
	}
}
