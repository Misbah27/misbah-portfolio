import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

/**
 * POST /api/inboundiq/nl-filter
 * Converts a natural language query into a filtered list of matching ISA/VRID strings.
 */
export async function POST(request: Request) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 25000);

	try {
		const { query, yardTrucks } = await request.json();

		const compact = yardTrucks.map((t: Record<string, unknown>) => ({
			isaVrid: t.isaVrid,
			dmStatus: t.dmStatus,
			arrivalStatus: t.arrivalStatus,
			dwellHours: t.dwellHours,
			apptType: t.apptType,
			lowInstockPct: t.lowInstockPct,
			units: t.units,
			rank: t.rank,
		}));

		const prompt = `Yard queue filter engine. Return matching isaVrid values from this data.

Yard trucks:
${JSON.stringify(compact, null, 0)}

Query: "${query}"

Field reference:
- apptType: HOT|SPD|CARP|AMZL
- lowInstockPct: 0-80 (higher = more critical)
- dwellHours: decimal hours
- arrivalStatus: ON_TIME|LATE|DELAYED|EARLY
- "instock below X%" → lowInstockPct < X
- "dwelling over Xh" → dwellHours > X

Return ONLY valid JSON. No prose, no markdown, no backticks.
Return a JSON array of matching isaVrid strings: ["VRID1","VRID2"]
If no matches, return []`;

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
		const cleaned = text.trim().replace(/```json\n?/g, '').replace(/```/g, '').trim();
		const matchingVrids: string[] = JSON.parse(cleaned);

		return Response.json({ result: matchingVrids });
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
