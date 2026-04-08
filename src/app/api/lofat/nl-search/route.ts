import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

/**
 * POST /api/lofat/nl-search — Natural language driver search.
 * Returns JSON array of matching driverIds.
 */
export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { query, drivers } = body;

		const driverSummaries = drivers.map((d: Record<string, unknown>) => ({
			driverId: d.driverId,
			name: d.name,
			zone: d.zone,
			status: d.status,
			fraudScore: d.fraudScore,
			primaryFraudPattern: d.primaryFraudPattern,
			vehicleType: d.vehicleType,
			lastFlaggedDate: d.lastFlaggedDate,
			customerComplaintRate: d.customerComplaintRate,
			onTimeRate: d.onTimeRate,
			deliveriesCompleted: d.deliveriesCompleted,
			deliveriesAttempted: d.deliveriesAttempted,
		}));

		const prompt = `You are a fraud detection search engine. Given the user query and the driver dataset below, return ONLY a JSON array of matching driverIds. No prose, no explanation — just the JSON array.

USER QUERY: "${query}"

DRIVERS:
${JSON.stringify(driverSummaries, null, 1)}

Pattern name mappings:
- "order dodger" / "roster avoidance" = ROSTER_AVOIDANCE
- "GPS spoofing" / "spoofer" = GPS_SPOOFING
- "ghost delivery" / "ghost" = GHOST_DELIVERY
- "phantom route" / "teleport" = PHANTOM_ROUTE
- "cluster fraud" / "coordinated" = CLUSTER_FRAUD

Zone mappings:
- "Seattle" = Seattle-North or Seattle-South
- "Chicago" = Chicago-Loop or Chicago-North
- "LA" / "Los Angeles" = LA-Westside or LA-Valley

Return ONLY a valid JSON array of driverId strings. Example: ["DRV-10141","DRV-10145"]`;

		const response = await client.messages.create({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 1000,
			messages: [{ role: 'user', content: prompt }],
		});

		const text = response.content[0].type === 'text' ? response.content[0].text : '[]';
		const match = text.match(/\[[\s\S]*\]/);
		const driverIds: string[] = match ? JSON.parse(match[0]) : [];

		return Response.json({ driverIds });
	} catch (error) {
		return Response.json({ error: 'Search failed', driverIds: [] }, { status: 500 });
	}
}
