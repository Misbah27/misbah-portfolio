import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

interface ColumnInput {
	name: string;
	piiType: string;
	inferredType: string;
}

interface SuggestionOutput {
	column: string;
	rule: 'FORMAT_PRESERVE' | 'HASH' | 'NULLIFY' | 'GENERALIZE' | 'KEEP';
	reasoning: string;
}

interface RequestBody {
	columns: ColumnInput[];
	industryTag: string;
}

export async function POST(request: Request) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 25000);

	try {
		const body = (await request.json()) as RequestBody;
		const { columns, industryTag } = body;

		if (!columns || columns.length === 0) {
			clearTimeout(timeout);
			return Response.json({ error: 'Columns are required' }, { status: 400 });
		}

		// Cap at 20 columns
		const cappedColumns = columns.slice(0, 20);

		const prompt = `Data privacy engineer for ${industryTag} data. Suggest obfuscation rules for each PII column.

Columns: ${JSON.stringify(cappedColumns, null, 0)}

Rules: FORMAT_PRESERVE (same format, best for emails/phones/SSNs/names/addresses/IDs), HASH (one-way, for internal IDs), NULLIFY (replace with null, sparingly), GENERALIZE (broader category, for quasi-identifiers), KEEP (non-PII only).

Return ONLY valid JSON. No prose, no markdown, no backticks.
{"suggestions":[{"column":"name","rule":"FORMAT_PRESERVE","reasoning":"1 sentence"}]}`;

		const response = await client.messages.create(
			{
				model: 'claude-sonnet-4-20250514',
				max_tokens: 1000,
				messages: [{ role: 'user', content: prompt }],
			},
			{ signal: controller.signal }
		);
		clearTimeout(timeout);

		const raw = response.content[0].type === 'text' ? response.content[0].text : '';

		let parsed: { suggestions: SuggestionOutput[] };
		try {
			parsed = JSON.parse(raw) as { suggestions: SuggestionOutput[] };
		} catch {
			parsed = {
				suggestions: cappedColumns.map((c) => ({
					column: c.name,
					rule: 'KEEP' as const,
					reasoning: 'LLM response could not be parsed — defaulting to KEEP.',
				})),
			};
		}

		return Response.json(parsed);
	} catch (error) {
		clearTimeout(timeout);
		if ((error as Error).name === 'AbortError') {
			return Response.json(
				{ error: 'Request timed out', suggestions: [] },
				{ status: 408 }
			);
		}
		return Response.json({
			suggestions: [],
			error: 'Service temporarily unavailable',
		}, { status: 500 });
	}
}
