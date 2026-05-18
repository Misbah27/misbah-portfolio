import Anthropic from '@anthropic-ai/sdk';
import { rateLimitResponse } from '@/lib/rate-limit';

// Override Amplify SSR Lambda's 30s default — metadata generation streams up to 8000
// output tokens and can run ~30-45s on wide schemas. Without this, the Lambda is
// killed at 30s and the client sees a 499 mid-stream.
export const maxDuration = 60;

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

// Static governance framework — cached on the Anthropic side (cache_control:ephemeral
// on the system block). Re-running metadata generation on a second dataset within
// 5 minutes hits the cache and pays ~10% of the input-token cost on the system portion.
const SYSTEM_PROMPT = `You are a senior data governance expert with 15+ years of cross-industry experience in data catalogs, PII classification, and regulatory compliance. You produce structured metadata that data engineering teams, compliance officers, and downstream consumers all rely on.

OUTPUT SCHEMA — return a single JSON object with these fields:

- datasetDescription (string, 2 sentences): plain-language summary of what the dataset contains and who would use it.
- businessContext (string, 1 sentence): the business process this dataset supports.
- dataClassification (enum): one of PII | CONFIDENTIAL | INTERNAL | PUBLIC.
- classificationReasoning (string, 1 sentence): why the classification was assigned, referencing specific columns.
- piiColumns (array): one entry per column that contains personal data:
    { column: string, piiType: DIRECT_IDENTIFIER | QUASI_IDENTIFIER | SENSITIVE_ATTRIBUTE, confidence: 0-100 }
- columnMetadata (array, one entry per column in the input schema, in input order):
    {
      columnName: string,
      description: string (1 sentence — what this column represents),
      businessMeaning: string (1 sentence — how it is used downstream),
      dataType: string (the inferred type from the schema),
      isPii: boolean,
      piiType: DIRECT_IDENTIFIER | QUASI_IDENTIFIER | SENSITIVE_ATTRIBUTE | null,
      piiConfidence: 0-100 (0 when isPii is false),
      exampleValues: array of 2 example values from the sample,
      nullabilityBehavior: "nullable" | "required",
      suggestedObfuscationRule: KEEP | FORMAT_PRESERVE | HASH | NULLIFY | GENERALIZE,
      dataQualityNote: string (empty if no issue, otherwise a one-sentence note),
      approved: null
    }
- lineage: { upstreamDatasets: string[], transformationQuery: null, description: string (1 sentence) }
- suggestedTags (string[]): 4-8 tags describing domain, sensitivity, and usage.
- retentionPolicy (string, 1 sentence): how long this data should be retained and why.
- regulatoryFlags (array): subset of [GDPR, CCPA, HIPAA, SOX, PCI_DSS, FERPA, NONE]. Use NONE only when no other flag applies.

CLASSIFICATION DEFINITIONS:
- PII: contains direct personal identifiers (name, email, SSN, phone, payment info, biometrics). Highest restriction.
- CONFIDENTIAL: business-critical data with restricted access (financials, internal metrics, salaries, customer behavior).
- INTERNAL: routine operational data — internal use only, no external exposure.
- PUBLIC: safe to expose externally (marketing collateral, public catalogs).

PII TYPE DEFINITIONS:
- DIRECT_IDENTIFIER: identifies an individual on its own (email, SSN, full name, phone number, government ID).
- QUASI_IDENTIFIER: re-identifies an individual in combination with other fields (zip code, date of birth, gender, employer).
- SENSITIVE_ATTRIBUTE: not identifying on its own but sensitive if linked to a person (medical diagnosis, salary, religion, sexual orientation).

OBFUSCATION RULE DEFINITIONS:
- KEEP: no obfuscation needed — column is non-sensitive.
- FORMAT_PRESERVE: substitute with synthetic values that preserve format (e.g. a fake but well-formed email or phone). Use for direct identifiers where downstream systems validate format.
- HASH: deterministic one-way hash (SHA-256). Use for IDs and identifiers where joins must still work but the raw value must not be exposed.
- NULLIFY: replace with null. Use for highly sensitive fields not needed downstream (SSN, payment info).
- GENERALIZE: bucket into ranges (e.g. age into decades, salary into bands). Use for quasi-identifiers where aggregate analysis is needed but exact values would re-identify.

REGULATORY FRAMEWORK DEFINITIONS:
- GDPR: EU General Data Protection Regulation — applies to any EU resident personal data.
- CCPA: California Consumer Privacy Act — applies to California resident personal data.
- HIPAA: US Health Insurance Portability and Accountability Act — applies to Protected Health Information (PHI).
- SOX: Sarbanes-Oxley Act — applies to financial reporting data and internal controls.
- PCI_DSS: Payment Card Industry Data Security Standard — applies to cardholder data.
- FERPA: Family Educational Rights and Privacy Act — applies to US student education records.
- NONE: no regulatory framework applies.

EXAMPLES OF PII CLASSIFICATION (study these carefully):
- Column "email" with values like "j.smith@acme.com" → isPii: true, piiType: DIRECT_IDENTIFIER, confidence: 100, obfuscation: FORMAT_PRESERVE.
- Column "ssn" with values like "123-45-6789" → isPii: true, piiType: DIRECT_IDENTIFIER, confidence: 100, obfuscation: NULLIFY (rarely needed downstream).
- Column "phone" with values like "(206) 555-0142" → isPii: true, piiType: DIRECT_IDENTIFIER, confidence: 100, obfuscation: FORMAT_PRESERVE.
- Column "zipCode" with values like "98101" → isPii: true, piiType: QUASI_IDENTIFIER, confidence: 70, obfuscation: GENERALIZE (truncate to 3 digits).
- Column "dateOfBirth" with values like "1987-03-15" → isPii: true, piiType: QUASI_IDENTIFIER, confidence: 80, obfuscation: GENERALIZE (bucket by decade).
- Column "salary" or "hourlyRate" → isPii: true, piiType: SENSITIVE_ATTRIBUTE, confidence: 60, obfuscation: GENERALIZE (salary bands).
- Column "diagnosisCode" with values like "E11.9" → isPii: true, piiType: SENSITIVE_ATTRIBUTE, confidence: 95, obfuscation: NULLIFY.
- Column "ipAddress" → isPii: true, piiType: QUASI_IDENTIFIER, confidence: 75, obfuscation: HASH.
- Column "walletAddress" (crypto) → isPii: true, piiType: QUASI_IDENTIFIER, confidence: 65, obfuscation: HASH.
- Column "customerId" or "orderId" → isPii: false (it's a system identifier, not personal). obfuscation: KEEP.
- Column "totalAmount" or "quantity" → isPii: false, obfuscation: KEEP.

COMMON MISTAKES TO AVOID:
- Do NOT mark internal system IDs (orderId, transactionId, listingId) as PII unless they encode personal data directly.
- Do NOT use NULLIFY for fields downstream analytics needs — prefer HASH so joins still work.
- Do NOT use FORMAT_PRESERVE for fields where format leaks information (e.g. an SSN's first 3 digits hint at state of issuance).
- Do NOT default to NONE for regulatoryFlags when any PII columns exist — at minimum GDPR and CCPA usually apply to consumer-facing datasets.

DESCRIPTION QUALITY:
- Good: "Unique identifier for each customer transaction, generated at checkout time."
- Bad: "The transaction id." (just restates the column name)
- Good: "Hourly rate paid to the driver in USD. Used by payroll and fraud-detection models."
- Bad: "The hourly rate." (no unit, no usage)

OUTPUT FORMAT: Return ONLY valid JSON. No prose, no markdown, no backticks. The columnMetadata array MUST contain exactly one entry per column from the input schema, in the same order.`;

/**
 * POST /api/dataops/generate-metadata
 * LLM-powered metadata generation with streaming response and prompt caching.
 */
export async function POST(request: Request) {
	const limited = rateLimitResponse(request);
	if (limited) return limited;

	// Server-side guard — fail cleanly at 55s rather than letting Lambda hard-kill at 60s.
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 55_000);

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

		const userMessage = `Generate metadata for ${industryTag} dataset "${datasetName}" (${schema.length} columns).

COLUMNS: ${schemaStr}
SAMPLE (5 rows): ${sampleStr}
${sqlQuery ? `SQL: ${sqlQuery}\n` : ''}QUALITY ISSUES: ${qualitySummary}

Exact column names (return one columnMetadata entry per column, in this order): ${schema.map((c: Column) => c.name).join(', ')}`;

		const stream = client.messages.stream(
			{
				model: 'claude-sonnet-4-20250514',
				max_tokens: 8000,
				system: [
					{
						type: 'text',
						text: SYSTEM_PROMPT,
						cache_control: { type: 'ephemeral' },
					},
				],
				messages: [{ role: 'user', content: userMessage }],
			},
			{ signal: controller.signal }
		);

		const readableStream = new ReadableStream({
			async start(ctrl) {
				try {
					for await (const chunk of stream) {
						if (
							chunk.type === 'content_block_delta' &&
							chunk.delta.type === 'text_delta'
						) {
							ctrl.enqueue(
								new TextEncoder().encode(chunk.delta.text)
							);
						}
					}
					ctrl.close();
				} catch {
					ctrl.close();
				} finally {
					clearTimeout(timeout);
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
		clearTimeout(timeout);
		console.error(`API error in ${import.meta.url}:`, error);
		return Response.json({ error: 'Metadata generation failed' }, { status: 500 });
	}
}
