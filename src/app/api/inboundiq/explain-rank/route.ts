import Anthropic from '@anthropic-ai/sdk';
import { rateLimitResponse } from '@/lib/rate-limit';

const client = new Anthropic();

/**
 * POST /api/inboundiq/explain-rank
 * Explains why a specific truck holds its current rank in the yard queue.
 */
export async function POST(request: Request) {
	const limited = rateLimitResponse(request);
	if (limited) return limited;
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 25000);

	try {
		const { truck } = await request.json();

		const prompt = `FC yard operations advisor. Truck ranked #${truck.rank} in ${truck.fcId} yard queue.

Ranking factors and this truck's values:
- lowInstockPct=${truck.lowInstockPct}% (shelf criticality, weight 0.35)
- apptType=${truck.apptType} (HOT=100/SPD=75/CARP=50/AMZL=40, weight 0.25)
- dwellHours=${truck.dwellHours}h (yard wait time, weight 0.20)
- stowTimeRemaining=${truck.stowTimeRemaining} (stow deadline urgency, weight 0.12)
- arrivalStatus=${truck.arrivalStatus} (weight 0.08)
- units=${truck.units}

Explain trade-offs for this rank position. Write for an FC ops manager. Reply in 3 sentences maximum.`;

		const response = await client.messages.create(
			{
				model: 'claude-sonnet-4-20250514',
				max_tokens: 1000,
				messages: [{ role: 'user', content: prompt }],
			},
			{ signal: controller.signal }
		);
		clearTimeout(timeout);

		return Response.json({
			result: response.content[0].type === 'text' ? response.content[0].text : '',
		});
	} catch (error) {
		console.error(`API error in ${import.meta.url}:`, error);
		clearTimeout(timeout);
		if ((error as Error).name === 'AbortError') {
			return Response.json(
				{ error: 'Request timed out — try a shorter query' },
				{ status: 408 }
			);
		}
		const msg = error instanceof Error ? error.message : 'LLM request failed'; return Response.json({ error: msg }, { status: 500 });
	}
}
