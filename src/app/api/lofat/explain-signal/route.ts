import Anthropic from '@anthropic-ai/sdk';
import { rateLimitResponse } from '@/lib/rate-limit';

const client = new Anthropic();

/**
 * POST /api/lofat/explain-signal — Plain English explanation of a fraud signal.
 */
export async function POST(request: Request) {
	const limited = rateLimitResponse(request);
	if (limited) return limited;
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 25000);

	try {
		const { signalType, signalDescription, fraudPattern } = await request.json();

		const prompt = `Explain this fraud detection signal for a non-technical operations manager.

Signal: ${signalType} — ${signalDescription}
Pattern context: ${fraudPattern}

What it means, why it's suspicious, and what legitimate behavior looks like instead. Reply in 3 sentences maximum.`;

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
			return Response.json({ error: 'Request timed out — try a shorter query' }, { status: 408 });
		}
		return Response.json({ error: 'Signal explanation failed' }, { status: 500 });
	}
}
