import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

/**
 * POST /api/nova/rescue-recommend
 * Returns AI recommendation for a specific rescue lane.
 */
export async function POST(request: Request) {
	try {
		const { odPair, delayHours, eddCount, vehicleSize, haulType } = await request.json();

		const prompt = `You are a logistics rescue planning AI. Analyze this delayed shipment and recommend the optimal action.

Lane: ${odPair}
Delay Hours: ${delayHours}
EDD Package Count: ${eddCount}
Vehicle Size: ${vehicleSize}
Haul Type: ${haulType}

Decision framework:
- RESCUE: dispatch a replacement vehicle if delay >6hrs AND eddCount >50 AND packages are time-critical
- DROP: cancel the rescue if delay <2hrs OR eddCount <10 OR the shipment can be absorbed by next scheduled run
- MERGE: combine with another shipment on the same corridor if vehicle has spare capacity and delay is moderate (2-6hrs)

Return ONLY a JSON object (no markdown, no backticks):
{
  "recommendation": "RESCUE" | "DROP" | "MERGE",
  "confidence": 75,
  "reasoning": "2-3 sentence explanation referencing the specific lane, delay hours, and package count"
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
