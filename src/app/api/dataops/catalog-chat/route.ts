import Anthropic from '@anthropic-ai/sdk';
import catalogData from '@/data/dataops/catalog.json';

const client = new Anthropic();

interface ChatMessage {
	role: 'user' | 'assistant';
	content: string;
}

interface ChatRequest {
	message: string;
	history: ChatMessage[];
}

interface ChatResponse {
	text: string;
	datasetCards: string[];
}

const SYSTEM_PROMPT = `You are DataVault, an expert data catalog assistant. You help users discover, understand, and evaluate datasets in the enterprise data catalog.

Here is the complete catalog of datasets:
${JSON.stringify(catalogData, null, 2)}

RULES:
- Answer questions about datasets, their schemas, quality, PII, lineage, and regulatory compliance.
- Reference specific dataset names and datasetIds (ds-001 through ds-012) when relevant.
- When datasets match the user's query, include their datasetIds in the datasetCards array.
- Be concise but thorough. Use plain language accessible to data engineers and analysts.
- If asked about something not in the catalog, say so clearly.

You MUST return ONLY valid JSON with this exact structure, no prose, no markdown:
{"text": "your answer here", "datasetCards": ["ds-001", "ds-005"]}

The datasetCards array should contain datasetIds of datasets you reference or recommend. Include it even if empty.`;

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as ChatRequest;
		const { message, history = [] } = body;

		if (!message) {
			return Response.json({ error: 'Message is required' }, { status: 400 });
		}

		const messages: Anthropic.MessageParam[] = [
			...history.map((m) => ({
				role: m.role as 'user' | 'assistant',
				content: m.content,
			})),
			{ role: 'user', content: message },
		];

		const response = await client.messages.create({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 1000,
			system: SYSTEM_PROMPT,
			messages,
		});

		const raw = response.content[0].type === 'text' ? response.content[0].text : '';

		let parsed: ChatResponse;

		try {
			parsed = JSON.parse(raw) as ChatResponse;
		} catch {
			parsed = { text: raw, datasetCards: [] };
		}

		return Response.json(parsed);
	} catch (error) {
		console.error('Catalog chat error:', error);
		return Response.json(
			{ text: 'I apologize, but I encountered an error processing your request. Please try again.', datasetCards: [] },
			{ status: 500 }
		);
	}
}
