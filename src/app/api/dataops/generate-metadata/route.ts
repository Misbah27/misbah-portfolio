import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

interface Column {
	name: string;
	inferredType: string;
	nullable: boolean;
	sampleValues: unknown[];
}

type DataRow = Record<string, unknown>;

interface QualityReport {
	qualityScore: number;
	issues: { column: string; issueType: string; description: string }[];
}

/**
 * POST /api/dataops/generate-metadata
 * LLM-powered metadata generation with streaming response.
 */
export async function POST(request: Request) {
	try {
		const { schema, sampleRows, datasetName, sqlQuery, industryTag, qualityReport } =
			(await request.json()) as {
				schema: Column[];
				sampleRows: DataRow[];
				datasetName: string;
				sqlQuery: string | null;
				industryTag: string;
				qualityReport: QualityReport | null;
			};

		const qualitySummary = qualityReport
			? qualityReport.issues
					.slice(0, 5)
					.map((i) => `${i.column}: ${i.issueType} — ${i.description}`)
					.join('\n')
			: 'None';

		const schemaStr = schema.map((c: Column) => `${c.name}(${c.inferredType}${c.nullable ? ',null' : ''})`).join(', ');

		// Cap at 5 rows and truncate string values to 50 chars
		const truncatedRows = sampleRows.slice(0, 5).map((row) => {
			const truncated: DataRow = {};
			for (const [key, val] of Object.entries(row)) {
				truncated[key] = typeof val === 'string' && val.length > 50 ? val.slice(0, 50) + '...' : val;
			}
			return truncated;
		});

		const sampleStr = JSON.stringify(truncatedRows, null, 0);

		const prompt = `Data governance expert. Generate metadata for ${industryTag} dataset "${datasetName}".

COLUMNS: ${schemaStr}
SAMPLE (5 rows): ${sampleStr}
${sqlQuery ? `SQL: ${sqlQuery}\n` : ''}QUALITY ISSUES: ${qualitySummary}

Return a JSON object:
- datasetDescription: 2 sentences
- businessContext: 1 sentence
- dataClassification: PII|CONFIDENTIAL|INTERNAL|PUBLIC
- classificationReasoning: 1 sentence
- piiColumns: [{column,piiType(DIRECT_IDENTIFIER|QUASI_IDENTIFIER|SENSITIVE_ATTRIBUTE),confidence(0-100)}]
- columnMetadata: array of ${schema.length} entries, each: {columnName,description,businessMeaning,dataType,isPii,piiType(or null),piiConfidence,exampleValues(2),nullabilityBehavior,suggestedObfuscationRule(KEEP|FORMAT_PRESERVE|HASH|NULLIFY|GENERALIZE),dataQualityNote,approved:null}
- lineage: {upstreamDatasets[],transformationQuery:null,description}
- suggestedTags: string[]
- retentionPolicy: 1 sentence
- regulatoryFlags: from [GDPR,CCPA,HIPAA,SOX,PCI_DSS,FERPA,NONE]

Exact column names: ${schema.map((c: Column) => c.name).join(', ')}
Return ONLY valid JSON. No prose, no markdown, no backticks.`;

		const stream = client.messages.stream({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 8000,
			messages: [{ role: 'user', content: prompt }],
		});

		const readableStream = new ReadableStream({
			async start(controller) {
				try {
					for await (const chunk of stream) {
						if (
							chunk.type === 'content_block_delta' &&
							chunk.delta.type === 'text_delta'
						) {
							controller.enqueue(
								new TextEncoder().encode(chunk.delta.text)
							);
						}
					}
					controller.close();
				} catch {
					controller.close();
				}
			},
		});

		return new Response(readableStream, {
			headers: {
				'Content-Type': 'text/plain; charset=utf-8',
				'Transfer-Encoding': 'chunked',
				'Cache-Control': 'no-cache',
			},
		});
	} catch (error) {
		return Response.json({ error: 'Metadata generation failed' }, { status: 500 });
	}
}
