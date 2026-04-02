/**
 * Truck record interface matching /data/inboundiq/trucks.json schema.
 */
export interface Truck {
	rank: number | null;
	vehicleNo: string;
	isaVrid: string;
	dockDoor: number | null;
	apptType: 'CARP' | 'AMZL' | 'SPD' | 'HOT';
	slotHours: number;
	dmStatus: 'CheckedIn' | 'Arrived' | 'PreCheckin' | 'Scheduled';
	scheduleTime: string;
	precheckinTime: string | null;
	checkinTime: string | null;
	unloadingEta: string | null;
	arrivalStatus: 'ON_TIME' | 'LATE' | 'DELAYED' | 'EARLY' | 'EXPECTED';
	sidelineRemarks: string | null;
	units: number;
	cartons: number;
	dwellHours: number | null;
	stowDate: string;
	stowTimeRemaining: string;
	lowInstockPct: number;
	fcId: string;
}

export type SortField = keyof Truck;
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
	field: SortField;
	direction: SortDirection;
}

export const FC_OPTIONS = ['SEA1', 'PDX2', 'LAX3', 'ORD2', 'JFK4'] as const;
export type FcOption = (typeof FC_OPTIONS)[number];

export const DOORS_PER_FC: Record<FcOption, number> = {
	SEA1: 14,
	PDX2: 12,
	LAX3: 13,
	ORD2: 11,
	JFK4: 10,
};

/** Columns shown in the Yard Queue table (Arrived/PreCheckin trucks). */
export const YARD_QUEUE_COLUMNS: { key: keyof Truck; label: string }[] = [
	{ key: 'rank', label: 'Rank' },
	{ key: 'vehicleNo', label: 'Vehicle No' },
	{ key: 'isaVrid', label: 'ISA/VRID' },
	{ key: 'apptType', label: 'Appt Type' },
	{ key: 'lowInstockPct', label: 'Low Instock %' },
	{ key: 'arrivalStatus', label: 'Arrival Status' },
	{ key: 'dwellHours', label: 'Dwell (Hours)' },
	{ key: 'units', label: 'Units' },
	{ key: 'cartons', label: 'Cartons' },
	{ key: 'slotHours', label: 'Slot (hrs)' },
	{ key: 'stowTimeRemaining', label: 'Stow Time Left' },
	{ key: 'scheduleTime', label: 'Schedule Time' },
	{ key: 'precheckinTime', label: 'Pre-Checkin' },
	{ key: 'sidelineRemarks', label: 'Sideline Remarks' },
];

/** All columns — used for CSV export. */
export const ALL_COLUMNS: { key: keyof Truck; label: string }[] = [
	{ key: 'rank', label: 'Rank' },
	{ key: 'vehicleNo', label: 'Vehicle No' },
	{ key: 'isaVrid', label: 'ISA/VRID' },
	{ key: 'dockDoor', label: 'Dock Door' },
	{ key: 'apptType', label: 'Appt Type' },
	{ key: 'slotHours', label: 'Slot (hrs)' },
	{ key: 'dmStatus', label: 'DM Status' },
	{ key: 'scheduleTime', label: 'Schedule Time' },
	{ key: 'precheckinTime', label: 'Pre-Checkin' },
	{ key: 'checkinTime', label: 'Checkin' },
	{ key: 'unloadingEta', label: 'Unloading ETA' },
	{ key: 'arrivalStatus', label: 'Arrival Status' },
	{ key: 'sidelineRemarks', label: 'Sideline Remarks' },
	{ key: 'units', label: 'Units' },
	{ key: 'cartons', label: 'Cartons' },
	{ key: 'dwellHours', label: 'Dwell (Hours)' },
	{ key: 'lowInstockPct', label: 'Low Instock %' },
	{ key: 'stowDate', label: 'Stow Date' },
	{ key: 'stowTimeRemaining', label: 'Stow Time Left' },
];

export interface DockDoorStatus {
	doorNumber: number;
	truck: Truck | null;
}
