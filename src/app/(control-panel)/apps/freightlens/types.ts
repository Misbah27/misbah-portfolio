/**
 * TypeScript interfaces and constants for the FreightLens (Daily Freight Tracker) app.
 */

/** Single day entry for a fulfillment center in the Rolling 21 Days view. */
export interface Rolling21DayEntry {
	date: string;
	bmPortal: number;
	vendorScheduled: number;
	saBlocked: number;
	saScheduled: number;
	saUnitsLeft: number;
	totalUnitsLeft: number;
	utilizationPct: number;
}

/** Rolling 21 data keyed by FC ID. */
export type Rolling21Data = Record<string, Rolling21DayEntry[]>;

/** Metric row labels displayed in the per-FC row group. */
export const METRIC_ROWS = [
	{ key: 'bmPortal' as const, label: 'BM Portal' },
	{ key: 'vendorScheduled' as const, label: 'Vendor Scheduled' },
	{ key: 'saBlocked' as const, label: 'SA Blocked' },
	{ key: 'saScheduled' as const, label: 'SA Scheduled' },
	{ key: 'saUnitsLeft' as const, label: 'SA Units Left' },
	{ key: 'totalUnitsLeft' as const, label: 'Total Units Left' },
	{ key: 'utilizationPct' as const, label: '%' },
];

export type MetricKey = (typeof METRIC_ROWS)[number]['key'];

/** All available fulfillment centers. */
export const FC_IDS = ['SEA1', 'PDX2', 'LAX3', 'ORD2', 'JFK4', 'DFW3', 'ATL1', 'BOS2'] as const;
export type FcId = (typeof FC_IDS)[number];

/** FC Type filter options. */
export const FC_TYPE_OPTIONS = ['All', 'EFP&AFT'] as const;
export type FcType = (typeof FC_TYPE_OPTIONS)[number];

/** Zone filter options. */
export const ZONE_OPTIONS = ['All', 'East', 'West'] as const;
export type Zone = (typeof ZONE_OPTIONS)[number];

/** Warehouse type filter options. */
export const WAREHOUSE_TYPE_OPTIONS = ['All', 'FC', 'SC'] as const;
export type WarehouseType = (typeof WAREHOUSE_TYPE_OPTIONS)[number];

/** Zone mapping for FCs. */
export const FC_ZONE_MAP: Record<FcId, 'East' | 'West'> = {
	SEA1: 'West',
	PDX2: 'West',
	LAX3: 'West',
	DFW3: 'West',
	ORD2: 'East',
	JFK4: 'East',
	ATL1: 'East',
	BOS2: 'East',
};

/** Number of date columns visible per page in the table. */
export const DATES_PER_PAGE = 7;

// ─── Standing Appointments ──────────────────────────────────────────────────

/** Vendor types for standing appointments. */
export const VENDOR_TYPES = ['PCP', 'PSP'] as const;
export type VendorType = (typeof VENDOR_TYPES)[number];

/** Breakdown types for standing appointments. */
export const BREAKDOWN_TYPES = ['Blocked', 'Scheduled'] as const;
export type BreakdownType = (typeof BREAKDOWN_TYPES)[number];

/** Single date entry in standing appointments. */
export interface StandingDateEntry {
	date: string;
	units: number;
}

/** Standing appointments data: FC → Vendor → Breakdown → date entries. */
export type StandingData = Record<string, Record<string, Record<string, StandingDateEntry[]>>>;

// ─── FC Metrics ─────────────────────────────────────────────────────────────

/** FC metric definitions for the FC Metric page. */
export const FC_METRIC_DEFS = [
	{ key: 'plannedCapacity', label: 'Planned Capacity', format: 'number' as const },
	{ key: 'totalScheduledQty', label: 'Total Scheduled Qty', format: 'number' as const },
	{ key: 'ncnsPct', label: 'NCNS %', format: 'percent' as const },
	{ key: 'vendorReceipts', label: 'Vendor Receipts', format: 'number' as const },
	{ key: 'endBacklog', label: 'End Backlog', format: 'number' as const },
	{ key: 'maxNyr', label: 'Max NYR', format: 'number' as const },
	{ key: 'backlogSafetyBacklog', label: 'Backlog/Safety Backlog', format: 'number' as const },
	{ key: 'palletCount', label: 'Pallet Count', format: 'number' as const },
	{ key: 'hotPos', label: 'Hot POs', format: 'number' as const },
	{ key: 'dsAllocationPct', label: 'DS Allocation %', format: 'percent' as const },
	{ key: 'nsAllocationPct', label: 'NS Allocation %', format: 'percent' as const },
] as const;

export type FcMetricKey = (typeof FC_METRIC_DEFS)[number]['key'];

/** Single day entry for FC metrics. */
export interface FcMetricDayEntry {
	date: string;
	plannedCapacity: number;
	totalScheduledQty: number;
	ncnsPct: number;
	vendorReceipts: number;
	endBacklog: number;
	maxNyr: number;
	backlogSafetyBacklog: number;
	palletCount: number;
	hotPos: number;
	dsAllocationPct: number;
	nsAllocationPct: number;
}

/** FC metrics data keyed by FC ID. */
export type FcMetricsData = Record<string, FcMetricDayEntry[]>;

/** Number of standing appointment date columns per page. */
export const STANDING_DATES_PER_PAGE = 8;
