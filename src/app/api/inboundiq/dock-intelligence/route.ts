import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const cache = new Map<string, { result: string; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * POST /api/inboundiq/dock-intelligence
 * Generates actionable dock operations recommendations based on current yard and dock state.
 */
export async function POST(request: Request) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 25000);

	try {
		const { yardQueue, dockedTrucks, fcId, totalDoors, forceRefresh } = await request.json();

		const cacheKey = JSON.stringify({ fcId });
		const cached = cache.get(cacheKey);

		if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
			clearTimeout(timeout);
			return Response.json({ result: cached.result, cached: true });
		}

		const occupied = dockedTrucks.length;
		const available = totalDoors - occupied;

		const compactYard = yardQueue
			.slice(0, 30)
			.map((t: Record<string, unknown>) => ({
				isaVrid: t.isaVrid,
				rank: t.rank,
				apptType: t.apptType,
				lowInstockPct: t.lowInstockPct,
				dwellHours: t.dwellHours,
				units: t.units,
			}));

		const compactDocked = dockedTrucks.map((t: Record<string, unknown>) => ({
			door: t.dockDoor,
			unloadingEta: t.unloadingEta,
			apptType: t.apptType,
		}));

		const prompt = `FC dock operations advisor for ${fcId}.

State: ${totalDoors} doors, ${occupied} occupied, ${available} available, ${yardQueue.length} trucks in yard.

Top yard trucks (by priority):
${JSON.stringify(compactYard.slice(0, 5), null, 0)}

Docked trucks:
${JSON.stringify(compactDocked, null, 0)}

Give 2-3 specific, actionable recommendations for the next 30 minutes. Name truck ISA/VRIDs and door numbers. 1-2 sentences each. Numbered list.`;

		const response = await client.messages.create(
			{
				model: 'claude-sonnet-4-20250514',
				max_tokens: 1000,
				messages: [{ role: 'user', content: prompt }],
			},
			{ signal: controller.signal }
		);
		clearTimeout(timeout);

		const llmResult = response.content[0].type === 'text' ? response.content[0].text : '';
		cache.set(cacheKey, { result: llmResult, timestamp: Date.now() });

		return Response.json({ result: llmResult, cached: false });
	} catch (error) {
		clearTimeout(timeout);
		if ((error as Error).name === 'AbortError') {
			return Response.json(
				{ error: 'Request timed out — try a shorter query' },
				{ status: 408 }
			);
		}
		return Response.json({ error: 'LLM request failed' }, { status: 500 });
	}
}
