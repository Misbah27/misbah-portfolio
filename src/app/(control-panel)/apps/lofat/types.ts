/**
 * LoFAT — Last-Mile Fraud Detection Platform type definitions.
 */

export const ZONES = [
	'Seattle-North',
	'Seattle-South',
	'Chicago-Loop',
	'Chicago-North',
	'LA-Westside',
	'LA-Valley',
] as const;
export type Zone = (typeof ZONES)[number];

export const VEHICLE_TYPES = ['BIKE', 'CAR', 'VAN', 'SCOOTER'] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const DRIVER_STATUSES = [
	'ACTIVE',
	'FLAGGED',
	'SUSPENDED',
	'UNDER_INVESTIGATION',
	'CLEARED',
] as const;
export type DriverStatus = (typeof DRIVER_STATUSES)[number];

export const FRAUD_PATTERNS = [
	'ROSTER_AVOIDANCE',
	'GPS_SPOOFING',
	'GHOST_DELIVERY',
	'PHANTOM_ROUTE',
	'CLUSTER_FRAUD',
] as const;
export type FraudPattern = (typeof FRAUD_PATTERNS)[number];

export const DELIVERY_STATUSES = [
	'COMPLETED',
	'ATTEMPTED',
	'FAILED',
	'GHOST_FLAGGED',
	'SPOOFED_FLAGGED',
] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export const ZONE_CITY_MAP: Record<string, string> = {
	'Seattle-North': 'Seattle',
	'Seattle-South': 'Seattle',
	'Chicago-Loop': 'Chicago',
	'Chicago-North': 'Chicago',
	'LA-Westside': 'Los Angeles',
	'LA-Valley': 'Los Angeles',
};

export const STATUS_COLORS: Record<DriverStatus, string> = {
	ACTIVE: '#2196f3',
	FLAGGED: '#ff9800',
	SUSPENDED: '#f44336',
	UNDER_INVESTIGATION: '#9c27b0',
	CLEARED: '#4caf50',
};

export const FRAUD_SCORE_COLOR = (score: number): string => {
	if (score <= 30) return '#4caf50';
	if (score <= 60) return '#ffeb3b';
	if (score <= 80) return '#ff9800';
	return '#f44336';
};

export const PATTERN_LABELS: Record<FraudPattern, string> = {
	ROSTER_AVOIDANCE: 'Order Dodging',
	GPS_SPOOFING: 'GPS Spoofing',
	GHOST_DELIVERY: 'Ghost Delivery',
	PHANTOM_ROUTE: 'Phantom Route',
	CLUSTER_FRAUD: 'Cluster Fraud',
};

export interface Driver {
	driverId: string;
	name: string;
	zone: Zone;
	vehicleType: VehicleType;
	shiftStart: string;
	shiftEnd: string;
	hourlyRate: number;
	status: DriverStatus;
	fraudScore: number;
	primaryFraudPattern: FraudPattern | null;
	totalShifts: number;
	flaggedShifts: number;
	totalEarnings: number;
	deliveriesCompleted: number;
	deliveriesAttempted: number;
	customerComplaintRate: number;
	onTimeRate: number;
	lastFlaggedDate: string | null;
}

export interface Delivery {
	deliveryId: string;
	driverId: string;
	orderId: string;
	zone: Zone;
	pickupAddress: string;
	deliveryAddress: string;
	scheduledPickup: string;
	actualPickup: string | null;
	deliveryStatus: DeliveryStatus;
	timeAtDeliveryAddress: number;
	distanceFromAddressAtCompletion: number;
	customerRating: number | null;
	customerComplaint: boolean;
	fraudFlagType: FraudPattern | null;
	fraudConfidence: number;
}

export interface PatternBreakdown {
	rosterAvoidance: number;
	gpsSpoofing: number;
	ghostDelivery: number;
	phantomRoute: number;
	clusterFraud: number;
}

export interface GpsPing {
	timestamp: string;
	lat: number;
	lng: number;
	speed: number;
	accuracy: number;
}

export interface PickupZone {
	lat: number;
	lng: number;
	name: string;
}

export interface GpsTrace {
	driverId: string;
	date: string;
	fraudPattern: FraudPattern;
	pickupZones?: PickupZone[];
	pings: GpsPing[];
}

export interface EvidenceItem {
	timestamp: string;
	signalType: 'GPS_ANOMALY' | 'ZONE_AVOIDANCE' | 'GHOST_DELIVERY' | 'CLUSTER' | 'ORDER_DODGE' | 'SPEED_ANOMALY' | 'TELEPORT';
	description: string;
}

export const SIGNAL_COLORS: Record<string, string> = {
	GPS_ANOMALY: '#f44336',
	ZONE_AVOIDANCE: '#ff9800',
	GHOST_DELIVERY: '#f44336',
	CLUSTER: '#ff9800',
	ORDER_DODGE: '#ff9800',
	SPEED_ANOMALY: '#f44336',
	TELEPORT: '#f44336',
};

export const CASE_STATUSES = [
	'OPEN',
	'IN_REVIEW',
	'ESCALATED',
	'CLOSED_FRAUD',
	'CLOSED_FALSE_POSITIVE',
] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export const CASE_STATUS_COLORS: Record<CaseStatus, 'warning' | 'info' | 'error' | 'default' | 'success'> = {
	OPEN: 'warning',
	IN_REVIEW: 'info',
	ESCALATED: 'error',
	CLOSED_FRAUD: 'error',
	CLOSED_FALSE_POSITIVE: 'success',
};

export interface InvestigationCase {
	caseId: string;
	driverId: string;
	driverName: string;
	openedDate: string;
	status: CaseStatus;
	fraudPattern: FraudPattern;
	evidenceSummary: string;
	assignedInvestigator: string;
	estimatedFraudAmount: number;
	resolution: string | null;
}

export const PATTERN_COLORS: Record<FraudPattern, string> = {
	ROSTER_AVOIDANCE: '#f59e0b',
	GPS_SPOOFING: '#ef4444',
	GHOST_DELIVERY: '#dc2626',
	PHANTOM_ROUTE: '#7c3aed',
	CLUSTER_FRAUD: '#db2777',
};

export interface ShiftMetric {
	date: string;
	dailyActiveDrivers: number;
	dailyFlaggedDrivers: number;
	totalDeliveries: number;
	totalFraudAlerts: number;
	patternBreakdown: PatternBreakdown;
	estimatedDailyLoss: number;
	preventedAmount: number;
}
