import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

/**
 * POST /api/lofat/nl-search — Natural language driver search.
 */
export async function POST(request: Request) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 25000);

	try {
		const { query, drivers } = await request.json();

		const compact = drivers.map((d: Record<string, unknown>) => ({
			driverId: d.driverId,
			name: d.name,
			zone: d.zone,
			fraudScore: d.fraudScore,
			primaryFraudPattern: d.primaryFraudPattern,
			status: d.status,
		}));

		const prompt = `Fraud detection search engine. Return matching driverIds from this dataset.

Query: "${query}"

Drivers (${compact.length}):
${JSON.stringify(compact, null, 0)}

Pattern mappings: "order dodger"/"roster avoidance"=ROSTER_AVOIDANCE, "GPS spoofing"/"spoofer"=GPS_SPOOFING, "ghost delivery"/"ghost"=GHOST_DELIVERY, "phantom route"/"teleport"=PHANTOM_ROUTE, "cluster fraud"/"coordinated"=CLUSTER_FRAUD

Zone mappings: "Seattle"=Seattle-North/Seattle-South, "Chicago"=Chicago-Loop/Chicago-North, "LA"/"Los Angeles"=LA-Westside/LA-Valley

Return ONLY valid JSON. No prose, no markdown, no backticks.
["DRV-10141","DRV-10145"]`;

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
		const match = text.match(/\[[\s\S]*\]/);
		const driverIds: string[] = match ? JSON.parse(match[0]) : [];

		return Response.json({ driverIds });
	} catch (error) {
		console.error(`API error in ${import.meta.url}:`, error);
		clearTimeout(timeout);
		if ((error as Error).name === 'AbortError') {
			return Response.json({ error: 'Request timed out — try a shorter query', driverIds: [] }, { status: 408 });
		}
		return Response.json({ error: 'Search failed', driverIds: [] }, { status: 500 });
	}
}
