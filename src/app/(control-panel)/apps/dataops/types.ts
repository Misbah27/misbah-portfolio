/**
 * DataOps Suite type definitions.
 * Covers dataset models, quality reports, metadata, and wizard state.
 */

/* ------------------------------------------------------------------ */
/* Industry Tags                                                      */
/* ------------------------------------------------------------------ */

export const INDUSTRY_TAGS = [
	'LUXURY_RESALE',
	'FINTECH',
	'ECOMMERCE',
	'HR',
	'EDTECH',
	'HEALTHCARE',
	'SUPPLY_CHAIN',
	'MARKETING',
	'IOT',
	'PROPTECH',
	'MEDIA',
	'WEB3',
	'OTHER',
] as const;

export type IndustryTag = (typeof INDUSTRY_TAGS)[number];

export const INDUSTRY_LABELS: Record<IndustryTag, string> = {
	LUXURY_RESALE: 'Luxury Resale',
	FINTECH: 'Fintech',
	ECOMMERCE: 'E-Commerce',
	HR: 'Human Resources',
	EDTECH: 'EdTech',
	HEALTHCARE: 'Healthcare',
	SUPPLY_CHAIN: 'Supply Chain',
	MARKETING: 'Marketing',
	IOT: 'IoT / Manufacturing',
	PROPTECH: 'PropTech',
	MEDIA: 'Media / Streaming',
	WEB3: 'Web3 / Crypto',
	OTHER: 'Other',
};

export const INDUSTRY_COLORS: Record<IndustryTag, string> = {
	LUXURY_RESALE: '#9C27B0',
	FINTECH: '#2196F3',
	ECOMMERCE: '#FF9800',
	HR: '#F44336',
	EDTECH: '#4CAF50',
	HEALTHCARE: '#00BCD4',
	SUPPLY_CHAIN: '#795548',
	MARKETING: '#E91E63',
	IOT: '#607D8B',
	PROPTECH: '#8BC34A',
	MEDIA: '#673AB7',
	WEB3: '#FF5722',
	OTHER: '#9E9E9E',
};

/* ------------------------------------------------------------------ */
/* Dataset Schema & Catalog                                           */
/* ------------------------------------------------------------------ */

export interface DatasetColumn {
	name: string;
	inferredType: 'STRING' | 'INTEGER' | 'FLOAT' | 'BOOLEAN' | 'DATE' | 'ENUM' | 'ID' | 'URL' | 'IMAGE_URL';
	nullable: boolean;
	sampleValues: unknown[];
	description?: string;
}

export type DataRow = Record<string, unknown>;

export interface DatasetFile {
	metadata: {
		name: string;
		industryTag: IndustryTag;
		description: string;
		rowCount: number;
		createdAt: string;
	};
	rows: DataRow[];
}

export type DataClassification = 'PII' | 'CONFIDENTIAL' | 'INTERNAL' | 'PUBLIC';

export type PiiType = 'DIRECT_IDENTIFIER' | 'QUASI_IDENTIFIER' | 'SENSITIVE_ATTRIBUTE';

export interface PiiColumnInfo {
	column: string;
	piiType: PiiType;
	confidence: number;
}

export interface DatasetLineage {
	upstreamDatasets: string[];
	transformationQuery: string | null;
	description: string;
}

export interface DatasetCatalogEntry {
	datasetId: string;
	name: string;
	industryTag: IndustryTag;
	description: string;
	businessContext?: string;
	filePath: string;
	schema: DatasetColumn[];
	rowCount: number;
	classification: DataClassification;
	piiColumns: PiiColumnInfo[];
	regulatoryFlags?: RegulatoryFlag[];
	owner: string;
	team: string;
	domain: string;
	lastUpdated: string;
	tags: string[];
	lineage: DatasetLineage;
	statistics: {
		completeness: number | null;
		qualityScore: number | null;
	};
	publishedToCatalog: boolean;
}

/* ------------------------------------------------------------------ */
/* Obfuscation Job                                                     */
/* ------------------------------------------------------------------ */

export interface ObfuscationJob {
	jobId: string;
	datasetId: string;
	datasetName: string;
	submittedAt: string;
	completedAt: string | null;
	status: 'COMPLETED' | 'FAILED' | 'RUNNING';
	piiColumnsObfuscated: number;
	rowsProcessed: number;
	processingTimeMs: number;
	requestedBy: string;
	seedVersion: string;
	reidentificationRequests: number;
}

/* ------------------------------------------------------------------ */
/* Quality Report                                                      */
/* ------------------------------------------------------------------ */

export type IssueSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export type IssueType =
	| 'NULL_RATE'
	| 'DUPLICATE'
	| 'DUPLICATE_KEY'
	| 'TEMPORAL'
	| 'COMPUTED_DRIFT'
	| 'REFERENTIAL'
	| 'FORMAT'
	| 'OUTLIER'
	| 'SCHEMA_COMPLETENESS'
	| 'NEGATIVE_VALUE'
	| 'SEMANTIC'
	| 'BUSINESS_LOGIC';

export interface QualityIssue {
	column: string;
	issueType: IssueType;
	severity: IssueSeverity;
	description: string;
	affectedRowCount: number;
	recommendation: string;
}

export interface ColumnHealth {
	column: string;
	nullRate: number;
	uniqueRate: number;
	healthScore: number;
}

export interface QualityReport {
	qualityScore: number;
	totalIssues: number;
	criticalCount: number;
	warningCount: number;
	infoCount: number;
	issues: QualityIssue[];
	columnHealth: ColumnHealth[];
	checkedAt: string;
}

/* ------------------------------------------------------------------ */
/* Metadata Generation                                                 */
/* ------------------------------------------------------------------ */

export type ObfuscationRule = 'KEEP' | 'FORMAT_PRESERVE' | 'HASH' | 'NULLIFY' | 'GENERALIZE';

export type RegulatoryFlag = 'GDPR' | 'CCPA' | 'HIPAA' | 'SOX' | 'PCI_DSS' | 'FERPA' | 'NONE';

export interface ColumnMetadata {
	columnName: string;
	description: string;
	businessMeaning: string;
	dataType: DatasetColumn['inferredType'];
	isPii: boolean;
	piiType: PiiType | null;
	piiConfidence: number;
	exampleValues: unknown[];
	nullabilityBehavior: string;
	suggestedObfuscationRule: ObfuscationRule;
	dataQualityNote: string;
	approved: boolean | null;
}

export interface GeneratedMetadata {
	datasetDescription: string;
	businessContext: string;
	dataClassification: DataClassification;
	classificationReasoning: string;
	piiColumns: PiiColumnInfo[];
	columnMetadata: ColumnMetadata[];
	lineage: DatasetLineage;
	suggestedTags: string[];
	retentionPolicy: string;
	regulatoryFlags: RegulatoryFlag[];
}

/* ------------------------------------------------------------------ */
/* Wizard State                                                        */
/* ------------------------------------------------------------------ */

export type WizardStep = 0 | 1 | 2 | 3;

export const WIZARD_STEP_LABELS = ['Upload', 'Quality', 'Metadata', 'Publish'] as const;

export interface WizardContext {
	step: WizardStep;
	datasetName: string;
	industryTag: IndustryTag | '';
	sqlQuery: string;
	schema: DatasetColumn[];
	rows: DataRow[];
	qualityReport: QualityReport | null;
	generatedMetadata: GeneratedMetadata | null;
	owner: string;
	tags: string[];
	classificationOverride: DataClassification | null;
}

export const INITIAL_WIZARD_CONTEXT: WizardContext = {
	step: 0,
	datasetName: '',
	industryTag: '',
	sqlQuery: '',
	schema: [],
	rows: [],
	qualityReport: null,
	generatedMetadata: null,
	owner: '',
	tags: [],
	classificationOverride: null,
};

/* ------------------------------------------------------------------ */
/* Sample Dataset Registry (for quick-load buttons)                    */
/* ------------------------------------------------------------------ */

export interface SampleDataset {
	name: string;
	industryTag: IndustryTag;
	fileName: string;
	label: string;
}

export const SAMPLE_DATASETS: SampleDataset[] = [
	{ name: 'trx_product_listings', industryTag: 'LUXURY_RESALE', fileName: 'trx_product_listings.json', label: 'Luxury Resale' },
	{ name: 'fin_transactions', industryTag: 'FINTECH', fileName: 'fin_transactions.json', label: 'Fintech' },
	{ name: 'ecom_orders', industryTag: 'ECOMMERCE', fileName: 'ecom_orders.json', label: 'E-Commerce' },
	{ name: 'hr_employees', industryTag: 'HR', fileName: 'hr_employees.json', label: 'HR / People' },
	{ name: 'edu_students', industryTag: 'EDTECH', fileName: 'edu_students.json', label: 'EdTech' },
	{ name: 'health_appointments', industryTag: 'HEALTHCARE', fileName: 'health_appointments.json', label: 'Healthcare' },
	{ name: 'inv_inventory', industryTag: 'SUPPLY_CHAIN', fileName: 'inv_inventory.json', label: 'Supply Chain' },
	{ name: 'mktg_campaigns', industryTag: 'MARKETING', fileName: 'mktg_campaigns.json', label: 'Marketing' },
	{ name: 'iot_sensor_readings', industryTag: 'IOT', fileName: 'iot_sensor_readings.json', label: 'IoT' },
	{ name: 'real_estate_listings', industryTag: 'PROPTECH', fileName: 'real_estate_listings.json', label: 'PropTech' },
	{ name: 'streaming_events', industryTag: 'MEDIA', fileName: 'streaming_events.json', label: 'Media' },
	{ name: 'crypto_trades', industryTag: 'WEB3', fileName: 'crypto_trades.json', label: 'Web3 / Crypto' },
];
