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
	try {
		const body = (await request.json()) as RequestBody;
		const { columns, industryTag } = body;

		if (!columns || columns.length === 0) {
			return Response.json({ error: 'Columns are required' }, { status: 400 });
		}

		const prompt = `You are a data privacy engineer specializing in ${industryTag} data. For each PII column below, suggest the most appropriate format-preserving obfuscation rule.

Columns:
${JSON.stringify(columns, null, 2)}

Rules available:
- FORMAT_PRESERVE: Replace with a value that looks like the original (same format). Best for emails, phones, SSNs, names, addresses, IDs.
- HASH: One-way cryptographic hash. Best for internal identifiers that need consistency but no format preservation.
- NULLIFY: Replace with null. Use sparingly — only for columns with no analytical value when obfuscated.
- GENERALIZE: Replace with a broader category (e.g., exact age → age range, full address → city only). Good for quasi-identifiers.
- KEEP: Do not obfuscate. Only for non-PII columns.

Return ONLY valid JSON, no prose, no markdown:
{"suggestions": [{"column": "columnName", "rule": "FORMAT_PRESERVE", "reasoning": "one sentence explanation"}]}`;

		const response = await client.messages.create({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 1000,
			messages: [{ role: 'user', content: prompt }],
		});

		const raw = response.content[0].type === 'text' ? response.content[0].text : '';

		let parsed: { suggestions: SuggestionOutput[] };

		try {
			parsed = JSON.parse(raw) as { suggestions: SuggestionOutput[] };
		} catch {
			// Fallback: return KEEP for all columns
			parsed = {
				suggestions: columns.map((c) => ({
					column: c.name,
					rule: 'KEEP' as const,
					reasoning: 'LLM response could not be parsed — defaulting to KEEP.',
				})),
			};
		}

		return Response.json(parsed);
	} catch (error) {
		console.error('Suggest obfuscation error:', error);
		// Graceful fallback
		const body = (await request.clone().json().catch(() => ({ columns: [] }))) as RequestBody;
		return Response.json({
			suggestions: (body.columns || []).map((c: ColumnInput) => ({
				column: c.name,
				rule: 'KEEP',
				reasoning: 'Service temporarily unavailable — defaulting to KEEP.',
			})),
		});
	}
}
