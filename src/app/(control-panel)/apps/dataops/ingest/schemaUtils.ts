import type { DatasetColumn, DataRow } from '../types';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/;
const URL_REGEX = /^https?:\/\//;
const IMAGE_URL_REGEX = /\.(png|jpg|jpeg|gif|webp|svg)/i;

/**
 * Infer column schema from the first N rows of a dataset.
 */
export function inferSchema(rows: DataRow[], sampleSize = 10): DatasetColumn[] {
	if (rows.length === 0) return [];

	const sample = rows.slice(0, sampleSize);
	const columns = Object.keys(rows[0]);

	return columns.map((name) => {
		const values = sample.map((row) => row[name]);
		const nonNull = values.filter((v) => v !== null && v !== undefined && v !== '');
		const nullable = nonNull.length < values.length;
		const sampleValues = nonNull.slice(0, 3);

		let inferredType = inferType(name, nonNull);

		return { name, inferredType, nullable, sampleValues };
	});
}

function inferType(
	name: string,
	values: unknown[]
): DatasetColumn['inferredType'] {
	if (values.length === 0) return 'STRING';

	const lowerName = name.toLowerCase();

	// ID columns
	if (lowerName.endsWith('id') || lowerName === 'id' || lowerName.endsWith('_id')) {
		return 'ID';
	}

	// Check first non-null values
	const first = values[0];

	if (typeof first === 'boolean') return 'BOOLEAN';

	if (typeof first === 'number') {
		return Number.isInteger(first) && values.every((v) => Number.isInteger(v as number))
			? 'INTEGER'
			: 'FLOAT';
	}

	if (typeof first === 'string') {
		const str = first as string;

		// URL/Image
		if (URL_REGEX.test(str)) {
			return IMAGE_URL_REGEX.test(str) ? 'IMAGE_URL' : 'URL';
		}

		// Date
		if (ISO_DATE_REGEX.test(str)) return 'DATE';

		// Enum detection: if all sample values are from a small set
		const unique = new Set(values.map(String));
		if (unique.size <= 6 && values.length >= 5) return 'ENUM';
	}

	return 'STRING';
}

/**
 * Parse CSV text into rows. Handles quoted fields with commas.
 */
export function parseCsv(text: string): DataRow[] {
	const lines = text.trim().split('\n');
	if (lines.length < 2) return [];

	const headers = parseCsvLine(lines[0]);
	const rows: DataRow[] = [];

	for (let i = 1; i < lines.length; i++) {
		const vals = parseCsvLine(lines[i]);
		const row: DataRow = {};
		headers.forEach((h, idx) => {
			const v = vals[idx] ?? '';
			// Try to parse numbers and booleans
			if (v === '') {
				row[h] = null;
			} else if (v === 'true') {
				row[h] = true;
			} else if (v === 'false') {
				row[h] = false;
			} else if (!isNaN(Number(v)) && v.trim() !== '') {
				row[h] = Number(v);
			} else {
				row[h] = v;
			}
		});
		rows.push(row);
	}

	return rows;
}

function parseCsvLine(line: string): string[] {
	const result: string[] = [];
	let current = '';
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		if (char === '"') {
			if (inQuotes && line[i + 1] === '"') {
				current += '"';
				i++;
			} else {
				inQuotes = !inQuotes;
			}
		} else if (char === ',' && !inQuotes) {
			result.push(current.trim());
			current = '';
		} else {
			current += char;
		}
	}
	result.push(current.trim());
	return result;
}
