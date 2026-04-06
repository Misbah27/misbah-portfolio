import type { DatasetCatalogEntry, DataRow } from '../types';

const CATALOG_KEY = 'dataops_user_catalog';
const ROWS_KEY_PREFIX = 'dataops_rows_';

/**
 * Read all user-published catalog entries from localStorage.
 */
export function getUserCatalogEntries(): DatasetCatalogEntry[] {
	if (typeof window === 'undefined') return [];
	try {
		const raw = localStorage.getItem(CATALOG_KEY);
		return raw ? (JSON.parse(raw) as DatasetCatalogEntry[]) : [];
	} catch {
		return [];
	}
}

/**
 * Read row data for a specific user-published dataset.
 */
export function getUserDatasetRows(datasetId: string): DataRow[] | null {
	if (typeof window === 'undefined') return null;
	try {
		const raw = localStorage.getItem(`${ROWS_KEY_PREFIX}${datasetId}`);
		return raw ? (JSON.parse(raw) as DataRow[]) : null;
	} catch {
		return null;
	}
}

/**
 * Persist a published dataset (catalog entry + rows) to localStorage.
 */
export function saveUserDataset(entry: DatasetCatalogEntry, rows: DataRow[]): void {
	if (typeof window === 'undefined') return;
	try {
		const existing = getUserCatalogEntries();
		existing.push(entry);
		localStorage.setItem(CATALOG_KEY, JSON.stringify(existing));
		localStorage.setItem(`${ROWS_KEY_PREFIX}${entry.datasetId}`, JSON.stringify(rows));
	} catch {
		console.warn('Failed to save dataset to localStorage — storage may be full.');
	}
}

/**
 * Generate the next dataset ID, avoiding collisions with static and user-published IDs.
 */
export function generateNextDatasetId(staticCatalog: DatasetCatalogEntry[]): string {
	const userEntries = getUserCatalogEntries();
	const allIds = [...staticCatalog, ...userEntries]
		.map((e) => e.datasetId)
		.filter((id) => id?.startsWith('ds-'))
		.map((id) => parseInt(id.replace('ds-', ''), 10))
		.filter((n) => !isNaN(n));
	const nextNum = allIds.length > 0 ? Math.max(...allIds) + 1 : 1;
	return `ds-${String(nextNum).padStart(3, '0')}`;
}
