import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

/**
 * POST /api/nova/nl-filter
 * Natural language delay query — returns filtered vehicle IDs + explanation.
 */
export async function POST(request: Request) {
	try {
		const { query, vehicles } = await request.json();

		const prompt = `You are a delay alert filter engine for a logistics NOC. Given the following vehicle delay data and a natural language query, return matching vehicles.

Vehicle data (${vehicles.length} records):
${JSON.stringify(vehicles.slice(0, 60), null, 0)}

Query: "${query}"

Available fields per vehicle:
- vrid: vehicle ID (string)
- lane: origin→destination (e.g. "SEA1→PDX2")
- destination: city name
- zone: North|South|East|West|C&E
- scac: carrier code (UPSN|FXFE|ODFL|SAIA|RDWY)
- reasonCodedBy: AMAZON_TOC|CARRIER|WEATHER
- delayHours: float (0.00 = no delay, >0 = delayed)
- eddToday: expected deliveries today (integer 0-50)
- eddTomorrow: expected deliveries tomorrow (integer 0-50)

Return ONLY a JSON object (no markdown, no backticks):
{
  "matchingVrids": ["VRID1", "VRID2"],
  "explanation": "brief explanation of what was matched and why"
}`;

		const response = await client.messages.create({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 1000,
			messages: [{ role: 'user', content: prompt }],
		});

		const text = response.content[0].type === 'text' ? response.content[0].text : '';
		const cleaned = text.trim().replace(/```json\n?/g, '').replace(/```/g, '').trim();
		const result = JSON.parse(cleaned);

		return Response.json({ result });
	} catch (error) {
		return Response.json({ error: 'LLM request failed' }, { status: 500 });
	}
}
