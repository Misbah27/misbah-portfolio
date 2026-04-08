import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

/**
 * POST /api/lofat/explain-signal — Plain English explanation of a fraud signal.
 */
export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { signalType, signalDescription, fraudPattern } = body;

		const prompt = `Explain this fraud detection signal in plain English for a non-technical operations manager. In 2-3 sentences: what does it mean, why is it suspicious, and what legitimate behavior would look like instead.

SIGNAL TYPE: ${signalType}
SIGNAL DESCRIPTION: ${signalDescription}
FRAUD PATTERN CONTEXT: ${fraudPattern}

Keep it clear and concise. No technical jargon. No bullet points — write in flowing prose.`;

		const response = await client.messages.create({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 1000,
			messages: [{ role: 'user', content: prompt }],
		});

		return Response.json({
			result: response.content[0].type === 'text' ? response.content[0].text : '',
		});
	} catch (error) {
		return Response.json({ error: 'Signal explanation failed' }, { status: 500 });
	}
}
