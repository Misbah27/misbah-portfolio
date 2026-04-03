import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

/**
 * POST /api/inboundiq/explain-rank
 * Explains why a specific truck holds its current rank in the yard queue.
 */
export async function POST(request: Request) {
	try {
		const { truck } = await request.json();

		const prompt = `You are an FC yard operations advisor. This truck is ranked #${truck.rank} in the ${truck.fcId} yard queue.

Explain in 3-4 plain English sentences why it holds this position, referencing its specific values:
- lowInstockPct = ${truck.lowInstockPct}% (FC shelf criticality — higher means FC shelves urgently need this cargo, weight: 0.35)
- apptType = ${truck.apptType} (appointment priority — HOT=100, SPD=75, CARP=50, AMZL=40, weight: 0.25)
- dwellHours = ${truck.dwellHours}h (time waiting in yard, weight: 0.20)
- stowTimeRemaining = ${truck.stowTimeRemaining} (urgency to stow before deadline, weight: 0.12)
- arrivalStatus = ${truck.arrivalStatus} (ON_TIME/EARLY/LATE/DELAYED, weight: 0.08)
- units = ${truck.units} (cargo volume)

Explain the trade-offs — why this truck ranks above or below its neighbours. Write for an FC operations manager, not an engineer. Be concise and specific.`;

		const response = await client.messages.create({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 1000,
			messages: [{ role: 'user', content: prompt }],
		});

		return Response.json({
			result: response.content[0].type === 'text' ? response.content[0].text : '',
		});
	} catch (error) {
		return Response.json({ error: 'LLM request failed' }, { status: 500 });
	}
}
