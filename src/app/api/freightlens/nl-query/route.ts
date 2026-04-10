import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

interface MetricEntry {
	plannedCapacity: number;
	totalScheduledQty: number;
	ncnsPct: number;
	vendorReceipts: number;
	endBacklog: number;
	maxNyr: number;
	palletCount: number;
	hotPos: number;
	dsAllocationPct: number;
	nsAllocationPct: number;
	[key: string]: unknown;
}

/**
 * POST /api/freightlens/nl-query
 * Converts a natural language metric query into highlighted FCs and an explanation.
 */
export async function POST(request: Request) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 25000);

	try {
		const { query, metricsData, selectedFc } = await request.json();

		// Flatten to per-FC averages instead of full nested data
		const flatMetrics = Object.entries(metricsData as Record<string, MetricEntry[]>).map(([fcId, entries]) => {
			const avg = (key: string) => Math.round(entries.reduce((s, e) => s + Number(e[key] || 0), 0) / entries.length);
			return {
				fcId,
				avgPlannedCapacity: avg('plannedCapacity'),
				avgScheduledQty: avg('totalScheduledQty'),
				avgNcnsPct: avg('ncnsPct'),
				avgEndBacklog: avg('endBacklog'),
				avgPalletCount: avg('palletCount'),
				hotPos: entries.reduce((s, e) => s + (e.hotPos || 0), 0),
				avgDsAllocation: avg('dsAllocationPct'),
				avgNsAllocation: avg('nsAllocationPct'),
			};
		});

		const prompt = `Freight analytics query engine. Match FCs to this query using the metric data.

FC Metrics (averages over 21-day window):
${JSON.stringify(flatMetrics, null, 0)}

Currently viewing: ${selectedFc}
Available FCs: SEA1, PDX2, LAX3, ORD2, JFK4, DFW3, ATL1, BOS2

Query: "${query}"

Rules:
- "over capacity" = avgScheduledQty > avgPlannedCapacity
- "high NCNS" = avgNcnsPct > 15%
- "backlog" = avgEndBacklog

Return ONLY valid JSON. No prose, no markdown, no backticks.
{"highlightedFCs":["SEA1"],"explanation":"2-3 sentences explaining the match."}`;

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
			highlightedFCs: result.highlightedFCs || [],
			explanation: result.explanation || '',
		});
	} catch (error) {
		clearTimeout(timeout);
		if ((error as Error).name === 'AbortError') {
			return Response.json({ error: 'Request timed out — try a shorter query' }, { status: 408 });
		}
		return Response.json({ error: 'LLM request failed' }, { status: 500 });
	}
}
