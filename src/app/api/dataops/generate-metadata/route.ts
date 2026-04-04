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
 * LLM-powered metadata generation: PII detection, lineage, retention, regulatory flags.
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

		const sampleStr = JSON.stringify(sampleRows.slice(0, 3), null, 1).slice(0, 1500);

		const prompt = `You are a data governance expert. Generate metadata for this ${industryTag} dataset "${datasetName}".

COLUMNS: ${schemaStr}
SAMPLE (3 rows): ${sampleStr}
${sqlQuery ? `SQL: ${sqlQuery}\n` : ''}QUALITY ISSUES: ${qualitySummary}

Return a JSON object with these fields:
- datasetDescription: 2-sentence description
- businessContext: 1 sentence on who uses this data
- dataClassification: one of PII|CONFIDENTIAL|INTERNAL|PUBLIC
- classificationReasoning: 1 sentence why
- piiColumns: [{column,piiType(DIRECT_IDENTIFIER|QUASI_IDENTIFIER|SENSITIVE_ATTRIBUTE),confidence(0-100)}]
- columnMetadata: array with one entry per column (${schema.length} total), each: {columnName,description(short),businessMeaning(short),dataType,isPii,piiType(or null),piiConfidence,exampleValues(2 values),nullabilityBehavior,suggestedObfuscationRule(KEEP|FORMAT_PRESERVE|HASH|NULLIFY|GENERALIZE),dataQualityNote,approved:null}
- lineage: {upstreamDatasets[],transformationQuery:null,description}
- suggestedTags: string[]
- retentionPolicy: 1 sentence
- regulatoryFlags: from [GDPR,CCPA,HIPAA,SOX,PCI_DSS,FERPA,NONE]

Use exact column names: ${schema.map((c: Column) => c.name).join(', ')}
Return ONLY valid JSON, no markdown or extra text.`;

		const response = await client.messages.create({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 8000,
			messages: [{ role: 'user', content: prompt }],
		});

		const text = response.content[0].type === 'text' ? response.content[0].text : '';

		// Extract JSON from response
		const jsonMatch = text.match(/\{[\s\S]*\}/);
		if (!jsonMatch) {
			return Response.json({ error: 'Failed to parse LLM response' }, { status: 500 });
		}

		const metadata = JSON.parse(jsonMatch[0]);

		// Ensure all columns have metadata (fill gaps if LLM missed any)
		const coveredColumns = new Set(
			metadata.columnMetadata?.map((c: { columnName: string }) => c.columnName) ?? []
		);
		for (const col of schema) {
			if (!coveredColumns.has(col.name)) {
				metadata.columnMetadata = metadata.columnMetadata || [];
				metadata.columnMetadata.push({
					columnName: col.name,
					description: `${col.name} field`,
					businessMeaning: 'Auto-generated — review needed',
					dataType: col.inferredType,
					isPii: false,
					piiType: null,
					piiConfidence: 0,
					exampleValues: col.sampleValues.slice(0, 3),
					nullabilityBehavior: col.nullable ? 'nullable — inferred from data' : 'required — inferred from data',
					suggestedObfuscationRule: 'KEEP',
					dataQualityNote: '',
					approved: null,
				});
			}
		}

		return Response.json(metadata);
	} catch (error) {
		return Response.json({ error: 'Metadata generation failed' }, { status: 500 });
	}
}
