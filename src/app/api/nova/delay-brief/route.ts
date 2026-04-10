import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const cache = new Map<string, { result: string; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * POST /api/nova/delay-brief
 * Generates an AI-powered delay intelligence brief from current vehicle data.
 */
export async function POST(request: Request) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 25000);

	try {
		const { vehicles, forceRefresh } = await request.json();

		const cacheKey = 'delay-brief-global';
		const cached = cache.get(cacheKey);

		if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
			clearTimeout(timeout);
			return Response.json({ result: JSON.parse(cached.result), cached: true });
		}

		const delayed = vehicles
			.filter((v: { delayHours: number }) => v.delayHours > 0)
			.slice(0, 50)
			.map((v: Record<string, unknown>) => ({
				vrid: v.vrid,
				lane: v.lane,
				delayHours: v.delayHours,
				eddToday: v.eddToday,
				zone: v.zone,
			}));

		const totalVehicles = vehicles.length;
		const totalDelayed = vehicles.filter((v: { delayHours: number }) => v.delayHours > 0).length;

		const prompt = `Logistics intelligence analyst for an FC network NOC. Analyze delayed vehicles and produce a brief.

Delayed vehicles (${totalDelayed} of ${totalVehicles} total, showing top 50):
${JSON.stringify(delayed, null, 0)}

Return ONLY valid JSON. No prose, no markdown, no backticks.
{"criticalCorridor":"ORIGIN→DEST lane with highest impact","criticalCorridorImpact":"1 sentence why","topDelayReason":"most common pattern","delayedCount":${totalDelayed},"avgDelayHours":"1 decimal","nocActions":["action 1 with vehicle IDs","action 2 with lanes","action 3"]}`;

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

		cache.set(cacheKey, { result: JSON.stringify(result), timestamp: Date.now() });

		return Response.json({ result, cached: false });
	} catch (error) {
		console.error(`API error in ${import.meta.url}:`, error);
		clearTimeout(timeout);
		if ((error as Error).name === 'AbortError') {
			return Response.json({ error: 'Request timed out — try a shorter query' }, { status: 408 });
		}
		const msg = error instanceof Error ? error.message : 'LLM request failed'; return Response.json({ error: msg }, { status: 500 });
	}
}
