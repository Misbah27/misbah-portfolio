/**
 * HMAC-SHA256 obfuscation utilities with format preservation.
 */

export const DEMO_SEED = 'DEMO_SEED_2024';

const FIRST_NAMES = [
	'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
	'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
	'Thomas', 'Sarah', 'Christopher', 'Karen', 'Daniel', 'Lisa', 'Matthew', 'Nancy',
	'Anthony', 'Betty', 'Mark', 'Margaret', 'Donald', 'Sandra', 'Steven', 'Ashley',
	'Andrew', 'Dorothy', 'Paul', 'Kimberly', 'Joshua', 'Emily', 'Kenneth', 'Donna',
	'Kevin', 'Michelle', 'Brian', 'Carol', 'George', 'Amanda', 'Timothy', 'Melissa',
	'Ronald', 'Deborah',
];

const LAST_NAMES = [
	'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
	'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
	'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
	'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
	'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
	'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
	'Carter', 'Roberts',
];

export async function hmacHash(seed: string, value: string): Promise<string> {
	const enc = new TextEncoder();
	const key = await crypto.subtle.importKey(
		'raw',
		enc.encode(seed),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const sig = await crypto.subtle.sign('HMAC', key, enc.encode(value));
	return Array.from(new Uint8Array(sig))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

function digits(hash: string, start: number, end: number): string {
	const segment = hash.slice(start, end);
	return segment.replace(/[^0-9]/g, '').padEnd(end - start, '0').slice(0, end - start);
}

export function formatEmail(hash: string): string {
	return `${hash.slice(0, 5)}@obfs.io`;
}

export function formatPhone(hash: string): string {
	return `(${digits(hash, 0, 3)}) ${digits(hash, 3, 6)}-${digits(hash, 6, 10)}`;
}

export function formatSSN(hash: string): string {
	return `${digits(hash, 0, 3)}-${digits(hash, 3, 5)}-${digits(hash, 5, 9)}`;
}

export function formatName(hash: string): string {
	const idx = parseInt(hash.slice(0, 4), 16);
	const first = FIRST_NAMES[idx % FIRST_NAMES.length];
	const last = LAST_NAMES[(idx >> 4) % LAST_NAMES.length];
	return `${first} ${last}`;
}

export function formatWallet(hash: string): string {
	return `0x${hash.slice(0, 40)}`;
}

export function formatId(prefix: string, hash: string): string {
	return `${prefix}${hash.slice(0, 8)}`;
}

export function formatInteger(original: number, hash: string): number {
	return original + (parseInt(hash.slice(0, 4), 16) % 1000) - 500;
}

export type PiiFormatType = 'email' | 'phone' | 'ssn' | 'name' | 'wallet' | 'address' | 'id' | 'dob' | 'numeric' | 'generic';

export function detectFormatType(columnName: string, piiType: string): PiiFormatType {
	const lower = columnName.toLowerCase();
	if (lower.includes('email')) return 'email';
	if (lower.includes('phone')) return 'phone';
	if (lower.includes('ssn')) return 'ssn';
	if (lower.includes('name') || lower.includes('firstname') || lower.includes('lastname')) return 'name';
	if (lower.includes('wallet')) return 'wallet';
	if (lower.includes('address')) return 'address';
	if (lower.includes('dob') || lower.includes('dateofbirth') || lower.includes('date_of_birth')) return 'dob';
	if (lower.includes('salary') || lower.includes('bonus') || lower.includes('equity') || lower.includes('amount')) return 'numeric';
	if (lower.endsWith('id')) return 'id';
	return 'generic';
}

export async function obfuscateValue(
	seed: string,
	columnName: string,
	value: unknown,
	formatType: PiiFormatType
): Promise<string> {
	if (value == null) return '';
	const hash = await hmacHash(seed, String(value));
	switch (formatType) {
		case 'email': return formatEmail(hash);
		case 'phone': return formatPhone(hash);
		case 'ssn': return formatSSN(hash);
		case 'name': return formatName(hash);
		case 'wallet': return formatWallet(hash);
		case 'address': return `${parseInt(hash.slice(0, 3), 16)} ${formatName(hash)} St`;
		case 'dob': {
			const y = 1950 + (parseInt(hash.slice(0, 2), 16) % 50);
			const m = (parseInt(hash.slice(2, 4), 16) % 12) + 1;
			const d = (parseInt(hash.slice(4, 6), 16) % 28) + 1;
			return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
		}
		case 'numeric': return String(formatInteger(Number(value) || 0, hash));
		case 'id': return formatId('OBF-', hash);
		default: return hash.slice(0, 12);
	}
}
