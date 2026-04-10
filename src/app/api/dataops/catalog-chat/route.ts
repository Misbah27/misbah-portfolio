import Anthropic from '@anthropic-ai/sdk';
import catalogData from '@/data/dataops/catalog.json';
import { rateLimitResponse } from '@/lib/rate-limit';

const client = new Anthropic();

interface ChatMessage {
	role: 'user' | 'assistant';
	content: string;
}

interface ChatRequest {
	message: string;
	history: ChatMessage[];
}

interface CatalogEntry {
	datasetId: string;
	name: string;
	industryTag: string;
	description: string;
	classification: string;
	piiColumns: unknown[];
	qualityScore: number;
	tags: string[];
	schema?: unknown[];
	[key: string]: unknown;
}

// Build compact catalog context at module load — no full schemas
const compactCatalog = (catalogData as CatalogEntry[]).map((d) => ({
	datasetId: d.datasetId,
	name: d.name,
	industryTag: d.industryTag,
	description: d.description,
	classification: d.classification,
	piiColumnCount: d.piiColumns?.length ?? 0,
	qualityScore: d.qualityScore,
	tags: d.tags,
}));

const SYSTEM_PROMPT = `DataVault, an expert data catalog assistant. Help users discover and evaluate datasets.

Catalog (${compactCatalog.length} datasets, schema details omitted — ask if needed):
${JSON.stringify(compactCatalog, null, 0)}

Rules:
- Reference specific dataset names and datasetIds (ds-001 through ds-012).
- Include relevant datasetIds in the datasetCards array.
- Be concise. If asked about columns/schema not shown, say "I have summary info — ask about a specific dataset for details."

Return ONLY valid JSON. No prose, no markdown, no backticks.
{"text":"your answer","datasetCards":["ds-001"]}`;

export async function POST(request: Request) {
	const limited = rateLimitResponse(request);
	if (limited) return limited;
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 25000);

	try {
		const body = (await request.json()) as ChatRequest;
		const { message, history = [] } = body;

		if (!message) {
			clearTimeout(timeout);
			return Response.json({ error: 'Message is required' }, { status: 400 });
		}

		const messages: Anthropic.MessageParam[] = [
			...history.map((m) => ({
				role: m.role as 'user' | 'assistant',
				content: m.content,
			})),
			{ role: 'user', content: message },
		];

		const response = await client.messages.create(
			{
				model: 'claude-sonnet-4-20250514',
				max_tokens: 1000,
				system: SYSTEM_PROMPT,
				messages,
			},
			{ signal: controller.signal }
		);
		clearTimeout(timeout);

		const raw = response.content[0].type === 'text' ? response.content[0].text : '';

		let parsed: { text: string; datasetCards: string[] };
		try {
			parsed = JSON.parse(raw);
		} catch {
			parsed = { text: raw, datasetCards: [] };
		}

		return Response.json(parsed);
	} catch (error) {
		console.error(`API error in ${import.meta.url}:`, error);
		clearTimeout(timeout);
		if ((error as Error).name === 'AbortError') {
			return Response.json(
				{ text: 'Request timed out — try a shorter query', datasetCards: [] },
				{ status: 408 }
			);
		}
		return Response.json(
			{ text: 'Service temporarily unavailable. Please try again.', datasetCards: [] },
			{ status: 500 }
		);
	}
}
