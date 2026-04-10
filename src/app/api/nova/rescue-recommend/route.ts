import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

/**
 * POST /api/nova/rescue-recommend
 * Returns AI recommendation for a specific rescue lane.
 */
export async function POST(request: Request) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 25000);

	try {
		const { odPair, delayHours, eddCount, vehicleSize, haulType } = await request.json();

		const prompt = `Logistics rescue planning AI. Recommend optimal action for this delayed shipment.

Lane: ${odPair} | Delay: ${delayHours}h | EDD Packages: ${eddCount} | Vehicle: ${vehicleSize} | Haul: ${haulType}

Decision framework:
- RESCUE: delay >6hrs AND eddCount >50 AND time-critical
- DROP: delay <2hrs OR eddCount <10 OR absorbable by next run
- MERGE: moderate delay (2-6hrs), spare capacity on same corridor

Return ONLY valid JSON. No prose, no markdown, no backticks.
{"recommendation":"RESCUE|DROP|MERGE","confidence":75,"reasoning":"2-3 sentences referencing lane, delay, packages."}`;

		const response = await client.messages.create(
			{
				model: 'claude-sonnet-4-20250514',
				max_tokens: 1000,
				messages: [{ role: 'user', content: prompt }],
			},
			{ signal: controller.signal }
		);
		clearTimeout(timeout);

		const text = response.content[0].type === 'text' ? response.content[0].text : '';
		const cleaned = text.trim().replace(/```json\n?/g, '').replace(/```/g, '').trim();
		const result = JSON.parse(cleaned);

		return Response.json({ result });
	} catch (error) {
		console.error(`API error in ${import.meta.url}:`, error);
		clearTimeout(timeout);
		if ((error as Error).name === 'AbortError') {
			return Response.json({ error: 'Request timed out — try a shorter query' }, { status: 408 });
		}
		const msg = error instanceof Error ? error.message : 'LLM request failed'; return Response.json({ error: msg }, { status: 500 });
	}
}
