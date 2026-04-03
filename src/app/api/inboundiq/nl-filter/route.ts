import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

/**
 * POST /api/inboundiq/nl-filter
 * Converts a natural language query into a filtered list of matching ISA/VRID strings.
 */
export async function POST(request: Request) {
	try {
		const { query, yardTrucks } = await request.json();

		const prompt = `You are a yard queue filter engine. Given the following yard trucks as JSON and a natural language query, return ONLY a JSON array of matching isaVrid strings. No explanation, no prose — just a valid JSON array.

Yard trucks:
${JSON.stringify(yardTrucks, null, 0)}

Query: "${query}"

Rules:
- apptType values: HOT, SPD, CARP, AMZL
- lowInstockPct is 0-80 (higher = more critical)
- dwellHours is in hours (decimal)
- arrivalStatus: ON_TIME, LATE, DELAYED, EARLY
- If the query mentions "instock below X%", match lowInstockPct < X
- If the query mentions "dwelling over Xh", match dwellHours > X
- Return all matching isaVrid values as a JSON string array
- If no trucks match, return an empty array []

Return ONLY a JSON array like ["VRID1","VRID2"]. No markdown, no backticks, no explanation.`;

		const response = await client.messages.create({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 1000,
			messages: [{ role: 'user', content: prompt }],
		});

		const text = response.content[0].type === 'text' ? response.content[0].text : '[]';

		// Parse the JSON array from the response
		const cleaned = text.trim().replace(/```json\n?/g, '').replace(/```/g, '').trim();
		const matchingVrids: string[] = JSON.parse(cleaned);

		return Response.json({ result: matchingVrids });
	} catch (error) {
		return Response.json({ error: 'LLM request failed' }, { status: 500 });
	}
}
