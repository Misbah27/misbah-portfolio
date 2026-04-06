/**
 * TypeScript interfaces and constants for the Nova Delay Alert app.
 */

export type AlertType = 'LH' | 'MR';
export type Zone = 'North' | 'South' | 'East' | 'West' | 'C&E';
export type Scac = 'UPSN' | 'FXFE' | 'ODFL' | 'SAIA' | 'RDWY';
export type ReasonCodedBy = 'AMAZON_TOC' | 'CARRIER' | 'WEATHER';
export type RescueStatus = 'FACILITATED' | 'RESCUED' | 'NA' | null;

export interface DelayAlert {
	vrid: string;
	lane: string;
	destination: string;
	zone: Zone;
	scac: Scac;
	type: AlertType;
	reasonCodedBy: ReasonCodedBy;
	delayHours: number;
	plannedYardTime: string;
	eta: string | null;
	rescueStatus: RescueStatus;
	eddToday: number;
	eddTomorrow: number;
}

export const ZONE_OPTIONS: Zone[] = ['North', 'South', 'East', 'West', 'C&E'];
export const SCAC_OPTIONS: Scac[] = ['UPSN', 'FXFE', 'ODFL', 'SAIA', 'RDWY'];
export const REASON_OPTIONS: ReasonCodedBy[] = ['AMAZON_TOC', 'CARRIER', 'WEATHER'];

export interface DelayAlertFilters {
	zone: Zone | 'ALL';
	scac: Scac | 'ALL';
	reason: ReasonCodedBy | 'ALL';
}

export const INITIAL_FILTERS: DelayAlertFilters = {
	zone: 'ALL',
	scac: 'ALL',
	reason: 'ALL',
};

/* ── Rescue Planner types ── */

export type HaulType = 'LH' | 'RH' | 'AH';
export type RescueJobStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type VehicleSize = '53FT' | '48FT' | 'SPRINTER';
export type AlgorithmRecommendation = 'RESCUE' | 'DROP' | 'MERGE';
export type RescueRole = 'Internal NOC' | 'Line-haul Associate' | 'ATS Surface';

export interface RescueRecord {
	rescueId: string;
	odPair: string;
	vrid: string;
	rescueDate: string;
	retrievalTime: string;
	eddSplit: string;
	reasonForDelay: string;
	haulType: HaulType;
	lane: string;
	status: RescueJobStatus;
	eta: string;
	eddPackageCount: number;
	vehicleSize: VehicleSize;
	algorithmRecommendation: AlgorithmRecommendation;
	clientApprovals: [boolean, boolean, boolean];
}

export const HAUL_TYPE_OPTIONS: HaulType[] = ['LH', 'RH', 'AH'];
export const RESCUE_STATUS_OPTIONS: RescueJobStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
export const VEHICLE_SIZE_OPTIONS: VehicleSize[] = ['53FT', '48FT', 'SPRINTER'];
export const ROLE_OPTIONS: RescueRole[] = ['Internal NOC', 'Line-haul Associate', 'ATS Surface'];

export const FC_OPTIONS = ['SEA1', 'PDX2', 'LAX3', 'SFO1', 'ORD2', 'JFK4', 'DFW3', 'ATL1', 'BOS2', 'MIA1'] as const;

/** Role-based tab visibility: which tabs each role can access (0-indexed). */
export const ROLE_TAB_ACCESS: Record<RescueRole, number[]> = {
	'Internal NOC': [0, 1, 2, 3, 4],
	'Line-haul Associate': [0, 3, 4],
	'ATS Surface': [0, 2, 4],
};

/** Role-based action visibility: which roles can create/edit/approve. */
export const ROLE_ACTIONS: Record<RescueRole, { canCreate: boolean; canEdit: boolean; canApprove: boolean }> = {
	'Internal NOC': { canCreate: true, canEdit: true, canApprove: true },
	'Line-haul Associate': { canCreate: false, canEdit: false, canApprove: false },
	'ATS Surface': { canCreate: true, canEdit: false, canApprove: true },
};
