import Anthropic from '@anthropic-ai/sdk';
import { rateLimitResponse } from '@/lib/rate-limit';

const client = new Anthropic();

/**
 * POST /api/nova/nl-filter
 * Natural language delay query — returns filtered vehicle IDs + explanation.
 */
export async function POST(request: Request) {
	const limited = rateLimitResponse(request);
	if (limited) return limited;
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 25000);

	try {
		const { query, vehicles } = await request.json();

		const compact = vehicles.slice(0, 100).map((v: Record<string, unknown>) => ({
			vrid: v.vrid,
			lane: v.lane,
			delayHours: v.delayHours,
			eddToday: v.eddToday,
			zone: v.zone,
			scac: v.scac,
			reasonCodedBy: v.reasonCodedBy,
		}));

		const prompt = `Delay alert filter engine for a logistics NOC. Return matching vehicles.

Vehicles (${vehicles.length} total, showing ${compact.length}):
${JSON.stringify(compact, null, 0)}

Query: "${query}"

Fields: vrid, lane (e.g. "SEA1→PDX2"), zone (North|South|East|West|C&E), scac (UPSN|FXFE|ODFL|SAIA|RDWY), reasonCodedBy (AMAZON_TOC|CARRIER|WEATHER), delayHours (float), eddToday (int 0-50)

Return ONLY valid JSON. No prose, no markdown, no backticks.
{"matchingVrids":["VRID1","VRID2"],"explanation":"1-2 sentences on what matched."}`;

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
