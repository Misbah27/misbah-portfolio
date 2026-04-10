import Anthropic from '@anthropic-ai/sdk';
import { rateLimitResponse } from '@/lib/rate-limit';

const client = new Anthropic();

interface Column {
	name: string;
	inferredType: string;
	nullable: boolean;
	sampleValues: unknown[];
}

type DataRow = Record<string, unknown>;

interface QualityIssue {
	column: string;
	issueType: string;
	severity: 'CRITICAL' | 'WARNING' | 'INFO';
	description: string;
	affectedRowCount: number;
	recommendation: string;
}

interface ColumnHealth {
	column: string;
	nullRate: number;
	uniqueRate: number;
	healthScore: number;
}

/* ------------------------------------------------------------------ */
/* Deterministic checks                                                */
/* ------------------------------------------------------------------ */

function runDeterministicChecks(schema: Column[], rows: DataRow[]): QualityIssue[] {
	const issues: QualityIssue[] = [];
	const total = rows.length;

	for (const col of schema) {
		const values = rows.map((r) => r[col.name]);
		const nullCount = values.filter((v) => v === null || v === undefined || v === '').length;
		const nullRate = nullCount / total;

		// 1. Null Rate
		if (nullRate > 0.2) {
			issues.push({
				column: col.name,
				issueType: 'NULL_RATE',
				severity: 'CRITICAL',
				description: `${(nullRate * 100).toFixed(1)}% of values are null (${nullCount}/${total})`,
				affectedRowCount: nullCount,
				recommendation: 'Investigate source for missing data. Consider imputation or marking as required.',
			});
		} else if (nullRate > 0.05) {
			issues.push({
				column: col.name,
				issueType: 'NULL_RATE',
				severity: 'WARNING',
				description: `${(nullRate * 100).toFixed(1)}% of values are null (${nullCount}/${total})`,
				affectedRowCount: nullCount,
				recommendation: 'Monitor null rate. Consider adding validation at ingestion.',
			});
		}

		// 9. Schema Completeness — sparse columns
		if (nullRate > 0.5) {
			issues.push({
				column: col.name,
				issueType: 'SCHEMA_COMPLETENESS',
				severity: 'WARNING',
				description: `Column is sparse — ${(nullRate * 100).toFixed(1)}% null`,
				affectedRowCount: nullCount,
				recommendation: 'Consider removing column or making it optional in schema.',
			});
		}
	}

	// 2. Duplicate Rows (exact)
	const rowHashes = rows.map((r) => JSON.stringify(r));
	const dupeCount = rowHashes.length - new Set(rowHashes).size;
	if (dupeCount > 0) {
		issues.push({
			column: '(all)',
			issueType: 'DUPLICATE',
			severity: 'WARNING',
			description: `${dupeCount} exact duplicate rows detected`,
			affectedRowCount: dupeCount,
			recommendation: 'Deduplicate rows. Check ETL pipeline for double-loading.',
		});
	}

	// 3. Duplicate Key — ID columns
	for (const col of schema) {
		const lower = col.name.toLowerCase();
		if (lower.endsWith('id') || lower === 'id' || lower.endsWith('_id')) {
			const vals = rows.map((r) => r[col.name]).filter((v) => v !== null && v !== undefined);
			const uniqueVals = new Set(vals);
			const dupKeys = vals.length - uniqueVals.size;
			if (dupKeys > 0) {
				issues.push({
					column: col.name,
					issueType: 'DUPLICATE_KEY',
					severity: 'CRITICAL',
					description: `${dupKeys} duplicate key values in ID column`,
					affectedRowCount: dupKeys,
					recommendation: 'ID columns must be unique. Check for duplicate inserts.',
				});
			}
		}
	}

	// 4. Temporal Anomalies — find date column pairs
	const dateCols = schema.filter(
		(c) => c.inferredType === 'DATE' || c.name.toLowerCase().includes('date') || c.name.toLowerCase().includes('time') || c.name.toLowerCase().includes('at')
	);
	const startEndPairs: [string, string][] = [];
	const pairPatterns = [
		['start', 'end'],
		['placed', 'delivered'],
		['hire', 'termination'],
		['listed', 'sold'],
		['created', 'updated'],
		['enrollment', 'graduation'],
		['scheduled', 'actual'],
		['appointment', 'followUp'],
	];
	for (const [s, e] of pairPatterns) {
		const startCol = dateCols.find((c) => c.name.toLowerCase().includes(s));
		const endCol = dateCols.find((c) => c.name.toLowerCase().includes(e));
		if (startCol && endCol && startCol.name !== endCol.name) {
			startEndPairs.push([startCol.name, endCol.name]);
		}
	}
	for (const [startCol, endCol] of startEndPairs) {
		let inversions = 0;
		for (const row of rows) {
			const s = row[startCol];
			const e = row[endCol];
			if (s && e && typeof s === 'string' && typeof e === 'string') {
				if (new Date(e) < new Date(s)) inversions++;
			}
		}
		if (inversions > 0) {
			issues.push({
				column: `${startCol} / ${endCol}`,
				issueType: 'TEMPORAL',
				severity: 'CRITICAL',
				description: `${inversions} rows have end date before start date`,
				affectedRowCount: inversions,
				recommendation: 'Fix temporal inversions. Validate date ordering at ingestion.',
			});
		}
	}

	// 5. Computed Field Drift — check common computed patterns
	const numCols = schema.filter((c) => c.inferredType === 'FLOAT' || c.inferredType === 'INTEGER');
	const computedChecks: { result: string; operands: string[]; op: 'multiply' | 'subtract' }[] = [
		{ result: 'totalAmount', operands: ['quantity', 'unitPrice'], op: 'multiply' },
		{ result: 'totalValue', operands: ['quantity', 'priceAtTrade'], op: 'multiply' },
		{ result: 'quantityAvailable', operands: ['quantityOnHand', 'quantityReserved'], op: 'subtract' },
		{ result: 'patientResponsibility', operands: ['billingAmount', 'insuranceCovered'], op: 'subtract' },
	];
	for (const check of computedChecks) {
		const hasAll = [check.result, ...check.operands].every((name) =>
			schema.some((c) => c.name === name)
		);
		if (!hasAll) continue;
		let driftCount = 0;
		for (const row of rows) {
			const result = Number(row[check.result]);
			const a = Number(row[check.operands[0]]);
			const b = Number(row[check.operands[1]]);
			if (isNaN(result) || isNaN(a) || isNaN(b)) continue;
			const expected = check.op === 'multiply' ? a * b : a - b;
			if (Math.abs(result - expected) > 0.01) driftCount++;
		}
		if (driftCount > 0) {
			issues.push({
				column: check.result,
				issueType: 'COMPUTED_DRIFT',
				severity: 'WARNING',
				description: `${driftCount} rows have ${check.result} != ${check.operands.join(check.op === 'multiply' ? ' × ' : ' - ')}`,
				affectedRowCount: driftCount,
				recommendation: 'Recompute derived field from source columns. Add validation rule.',
			});
		}
	}

	// Specific computed fields: ctr, cvr, roas, completionRate, pricePerSqFt, discount_pct
	const ratioChecks: { result: string; numerator: string; denominator: string }[] = [
		{ result: 'ctr', numerator: 'clicks', denominator: 'impressions' },
		{ result: 'cvr', numerator: 'conversions', denominator: 'clicks' },
		{ result: 'roas', numerator: 'revenue', denominator: 'spend' },
		{ result: 'completionRate', numerator: 'watchedMinutes', denominator: 'durationMinutes' },
		{ result: 'pricePerSqFt', numerator: 'listingPrice', denominator: 'squareFeet' },
	];
	for (const check of ratioChecks) {
		const hasAll = [check.result, check.numerator, check.denominator].every((name) =>
			schema.some((c) => c.name === name)
		);
		if (!hasAll) continue;
		let driftCount = 0;
		for (const row of rows) {
			const result = Number(row[check.result]);
			const num = Number(row[check.numerator]);
			const denom = Number(row[check.denominator]);
			if (isNaN(result) || isNaN(num) || isNaN(denom) || denom === 0) continue;
			const expected = num / denom;
			if (Math.abs(result - expected) > 0.01) driftCount++;
		}
		if (driftCount > 0) {
			issues.push({
				column: check.result,
				issueType: 'COMPUTED_DRIFT',
				severity: 'WARNING',
				description: `${driftCount} rows have ${check.result} != ${check.numerator}/${check.denominator}`,
				affectedRowCount: driftCount,
				recommendation: 'Recompute ratio field from source columns.',
			});
		}
	}

	// 6. Referential Integrity (managerId → employeeId pattern)
	const idColumns = schema.filter((c) => {
		const lower = c.name.toLowerCase();
		return (lower.endsWith('id') || lower.endsWith('_id')) && lower !== 'id';
	});
	for (const fkCol of idColumns) {
		const fkLower = fkCol.name.toLowerCase();
		// Find potential parent: managerId → employeeId, advisorId → not matching, etc.
		for (const pkCol of idColumns) {
			if (pkCol.name === fkCol.name) continue;
			// Check if FK references PK: e.g. managerId references employeeId
			const fkBase = fkLower.replace(/id$/i, '').replace(/_id$/i, '');
			if (fkBase === 'manager' || fkBase === 'advisor' || fkBase === 'seller') {
				const pkValues = new Set(rows.map((r) => r[pkCol.name]).filter(Boolean));
				let orphans = 0;
				for (const row of rows) {
					const fkVal = row[fkCol.name];
					if (fkVal !== null && fkVal !== undefined && !pkValues.has(fkVal)) orphans++;
				}
				if (orphans > 0) {
					issues.push({
						column: fkCol.name,
						issueType: 'REFERENTIAL',
						severity: 'WARNING',
						description: `${orphans} rows reference non-existent ${pkCol.name} values`,
						affectedRowCount: orphans,
						recommendation: 'Validate foreign key references. Clean up orphan records.',
					});
				}
				break;
			}
		}
	}

	// 7. Format Violations
	const formatChecks: { pattern: RegExp; columns: string[]; name: string }[] = [
		{ pattern: /^[^@]+@[^@]+\.[^@]+$/, columns: ['email', 'customeremail'], name: 'email' },
		{ pattern: /^\(\d{3}\) \d{3}-\d{4}$|^\d{10}$|^\d{3}-\d{3}-\d{4}$/, columns: ['phone'], name: 'phone' },
		{ pattern: /^\d{3}-\d{2}-\d{4}$/, columns: ['ssn'], name: 'SSN' },
		{ pattern: /^\d{5}(-\d{4})?$/, columns: ['zipcode', 'zip'], name: 'zip code' },
		{ pattern: /^[A-Z]\d{2}(\.\d{1,2})?$/, columns: ['diagnosiscode'], name: 'ICD-10' },
	];
	for (const check of formatChecks) {
		for (const col of schema) {
			if (!check.columns.includes(col.name.toLowerCase())) continue;
			let violations = 0;
			for (const row of rows) {
				const val = row[col.name];
				if (val === null || val === undefined || val === '') continue;
				if (!check.pattern.test(String(val))) violations++;
			}
			if (violations > 0) {
				issues.push({
					column: col.name,
					issueType: 'FORMAT',
					severity: violations > total * 0.05 ? 'CRITICAL' : 'WARNING',
					description: `${violations} values don't match expected ${check.name} format`,
					affectedRowCount: violations,
					recommendation: `Validate ${check.name} format at ingestion. Standardize existing values.`,
				});
			}
		}
	}

	// 8. Outlier Detection — numeric columns
	for (const col of numCols) {
		const nums = rows
			.map((r) => Number(r[col.name]))
			.filter((n) => !isNaN(n));
		if (nums.length < 10) continue;
		const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
		const stddev = Math.sqrt(nums.reduce((a, b) => a + (b - mean) ** 2, 0) / nums.length);
		if (stddev === 0) continue;
		const outlierCount = nums.filter((n) => Math.abs(n - mean) > 3 * stddev).length;
		if (outlierCount > 0) {
			issues.push({
				column: col.name,
				issueType: 'OUTLIER',
				severity: 'INFO',
				description: `${outlierCount} values beyond mean ± 3σ (mean=${mean.toFixed(2)}, σ=${stddev.toFixed(2)})`,
				affectedRowCount: outlierCount,
				recommendation: 'Review outliers for data entry errors or legitimate extreme values.',
			});
		}
	}

	// 10. Negative Values in non-negative columns
	const nonNegPatterns = ['amount', 'price', 'quantity', 'score', 'count', 'cost', 'fee', 'salary', 'bonus', 'rate', 'balance'];
	for (const col of numCols) {
		const lower = col.name.toLowerCase();
		if (!nonNegPatterns.some((p) => lower.includes(p))) continue;
		let negCount = 0;
		for (const row of rows) {
			const val = Number(row[col.name]);
			if (!isNaN(val) && val < 0) negCount++;
		}
		if (negCount > 0) {
			issues.push({
				column: col.name,
				issueType: 'NEGATIVE_VALUE',
				severity: 'WARNING',
				description: `${negCount} negative values in column that should be non-negative`,
				affectedRowCount: negCount,
				recommendation: 'Validate that values are non-negative. Check for sign errors.',
			});
		}
	}

	// Check: conversions > clicks (impossible)
	if (schema.some((c) => c.name === 'conversions') && schema.some((c) => c.name === 'clicks')) {
		let count = 0;
		for (const row of rows) {
			const conv = Number(row['conversions']);
			const clicks = Number(row['clicks']);
			if (!isNaN(conv) && !isNaN(clicks) && conv > clicks) count++;
		}
		if (count > 0) {
			issues.push({
				column: 'conversions',
				issueType: 'BUSINESS_LOGIC',
				severity: 'CRITICAL',
				description: `${count} rows have conversions > clicks (impossible)`,
				affectedRowCount: count,
				recommendation: 'Conversions cannot exceed clicks. Fix tracking implementation.',
			});
		}
	}

	// Check: watchedMinutes > durationMinutes
	if (schema.some((c) => c.name === 'watchedMinutes') && schema.some((c) => c.name === 'durationMinutes')) {
		let count = 0;
		for (const row of rows) {
			const watched = Number(row['watchedMinutes']);
			const duration = Number(row['durationMinutes']);
			if (!isNaN(watched) && !isNaN(duration) && watched > duration) count++;
		}
		if (count > 0) {
			issues.push({
				column: 'watchedMinutes',
				issueType: 'BUSINESS_LOGIC',
				severity: 'CRITICAL',
				description: `${count} rows have watched minutes exceeding content duration`,
				affectedRowCount: count,
				recommendation: 'Cap watched minutes at content duration. Check tracking logic.',
			});
		}
	}

	// Check: spend > budget
	if (schema.some((c) => c.name === 'spend') && schema.some((c) => c.name === 'budget')) {
		let count = 0;
		for (const row of rows) {
			const spend = Number(row['spend']);
			const budget = Number(row['budget']);
			if (!isNaN(spend) && !isNaN(budget) && spend > budget) count++;
		}
		if (count > 0) {
			issues.push({
				column: 'spend',
				issueType: 'BUSINESS_LOGIC',
				severity: 'WARNING',
				description: `${count} campaigns overspent their budget`,
				affectedRowCount: count,
				recommendation: 'Implement budget caps. Review overspend approval process.',
			});
		}
	}

	// Check: billingAmount < insuranceCovered
	if (schema.some((c) => c.name === 'billingAmount') && schema.some((c) => c.name === 'insuranceCovered')) {
		let count = 0;
		for (const row of rows) {
			const billing = Number(row['billingAmount']);
			const covered = Number(row['insuranceCovered']);
			if (!isNaN(billing) && !isNaN(covered) && billing < covered) count++;
		}
		if (count > 0) {
			issues.push({
				column: 'billingAmount / insuranceCovered',
				issueType: 'BUSINESS_LOGIC',
				severity: 'CRITICAL',
				description: `${count} rows have insurance coverage exceeding billing amount`,
				affectedRowCount: count,
				recommendation: 'Insurance coverage cannot exceed billing. Review billing records.',
			});
		}
	}

	// Check: sellingPrice < unitCost
	if (schema.some((c) => c.name === 'sellingPrice') && schema.some((c) => c.name === 'unitCost')) {
		let count = 0;
		for (const row of rows) {
			const sell = Number(row['sellingPrice']);
			const cost = Number(row['unitCost']);
			if (!isNaN(sell) && !isNaN(cost) && sell < cost) count++;
		}
		if (count > 0) {
			issues.push({
				column: 'sellingPrice',
				issueType: 'BUSINESS_LOGIC',
				severity: 'WARNING',
				description: `${count} products have selling price below unit cost (negative margin)`,
				affectedRowCount: count,
				recommendation: 'Review pricing strategy. May indicate clearance or data entry error.',
			});
		}
	}

	return issues;
}

function computeColumnHealth(schema: Column[], rows: DataRow[]): ColumnHealth[] {
	const total = rows.length;
	return schema.map((col) => {
		const values = rows.map((r) => r[col.name]);
		const nullCount = values.filter((v) => v === null || v === undefined || v === '').length;
		const nullRate = nullCount / total;
		const nonNull = values.filter((v) => v !== null && v !== undefined && v !== '');
		const uniqueRate = new Set(nonNull.map(String)).size / Math.max(nonNull.length, 1);
		const healthScore = Math.round(Math.max(0, 100 - nullRate * 60 - (1 - Math.min(uniqueRate, 1)) * 20));
		return { column: col.name, nullRate, uniqueRate, healthScore };
	});
}

function computeQualityScore(issues: QualityIssue[]): number {
	let penalty = 0;
	for (const issue of issues) {
		if (issue.severity === 'CRITICAL') penalty += 8;
		else if (issue.severity === 'WARNING') penalty += 3;
		else penalty += 1;
	}
	return Math.max(0, Math.min(100, 100 - penalty));
}

/* ------------------------------------------------------------------ */
/* POST handler                                                        */
/* ------------------------------------------------------------------ */

export async function POST(request: Request) {
	const limited = rateLimitResponse(request);
	if (limited) return limited;
	try {
		const { schema, rows, datasetName, industryTag } = await request.json();

		// Run deterministic checks
		const deterministicIssues = runDeterministicChecks(schema, rows);
		const columnHealth = computeColumnHealth(schema, rows);

		// Run LLM semantic checks
		let semanticIssues: QualityIssue[] = [];
		try {
			const llmController = new AbortController();
			const llmTimeout = setTimeout(() => llmController.abort(), 25000);
			const sampleRows = rows.slice(0, 20);
			const prompt = `Data quality expert. Analyze this ${industryTag} dataset "${datasetName}".

Schema: ${JSON.stringify(schema.map((c: Column) => ({ name: c.name, type: c.inferredType })))}

Sample (20 rows): ${JSON.stringify(sampleRows, null, 0).slice(0, 2000)}

Known issues:
${deterministicIssues.map((i) => `- ${i.column}: ${i.issueType} — ${i.description}`).join('\n')}

Identify 3-5 ADDITIONAL semantic issues deterministic rules miss:
1. ${industryTag}-specific business logic violations
2. Suspicious value distributions
3. Column semantic mismatches
4. Data freshness concerns

Return ONLY valid JSON. No prose, no markdown, no backticks.
[{"column":"col","issueType":"SEMANTIC","severity":"WARNING","description":"...","affectedRowCount":0,"recommendation":"..."}]`;

			const response = await client.messages.create(
				{
					model: 'claude-sonnet-4-20250514',
					max_tokens: 1000,
					messages: [{ role: 'user', content: prompt }],
				},
				{ signal: llmController.signal }
			);
			clearTimeout(llmTimeout);

			const text = response.content[0].type === 'text' ? response.content[0].text : '';
			const jsonMatch = text.match(/\[[\s\S]*\]/);
			if (jsonMatch) {
				semanticIssues = JSON.parse(jsonMatch[0]);
			}
		} catch {
			// LLM check failed — continue with deterministic results only
		}

		const allIssues = [...deterministicIssues, ...semanticIssues];
		const qualityScore = computeQualityScore(allIssues);

		const report = {
			qualityScore,
			totalIssues: allIssues.length,
			criticalCount: allIssues.filter((i) => i.severity === 'CRITICAL').length,
			warningCount: allIssues.filter((i) => i.severity === 'WARNING').length,
			infoCount: allIssues.filter((i) => i.severity === 'INFO').length,
			issues: allIssues,
			columnHealth,
			checkedAt: new Date().toISOString(),
		};

		return Response.json(report);
	} catch (error) {
		console.error(`API error in ${import.meta.url}:`, error);
		return Response.json({ error: 'Quality check failed' }, { status: 500 });
	}
}
