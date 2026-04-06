import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

/**
 * POST /api/nova/delay-brief
 * Generates an AI-powered delay intelligence brief from current vehicle data.
 */
export async function POST(request: Request) {
	try {
		const { vehicles } = await request.json();

		const delayed = vehicles.filter((v: { delayHours: number }) => v.delayHours > 0);

		const prompt = `You are a logistics intelligence analyst for a fulfillment center network operations center (NOC). Analyze the following delayed vehicle data and produce a brief intelligence report.

Delayed vehicles (${delayed.length} of ${vehicles.length} total):
${JSON.stringify(delayed.slice(0, 40), null, 0)}

Return ONLY a JSON object (no markdown, no backticks) with this exact structure:
{
  "criticalCorridor": "ORIGIN→DESTINATION (e.g. SEA1→PDX2) - the lane with the highest combined delayHours × eddToday impact",
  "criticalCorridorImpact": "brief explanation of why this corridor is most critical",
  "topDelayReason": "the most common reasonCodedBy value and what it means operationally",
  "delayedCount": ${delayed.length},
  "avgDelayHours": "average delay hours rounded to 1 decimal",
  "nocActions": [
    "specific action 1 referencing actual vehicle IDs or lanes from the data",
    "specific action 2 referencing actual vehicle IDs or lanes from the data",
    "specific action 3 referencing actual vehicle IDs or lanes from the data"
  ]
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
