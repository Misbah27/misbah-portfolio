'use client';

import FusePageSimple from '@fuse/core/FusePageSimple';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SearchIcon from '@mui/icons-material/Search';
import SummarizeIcon from '@mui/icons-material/Summarize';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import DescriptionIcon from '@mui/icons-material/Description';
import dynamic from 'next/dynamic';

const ArchitectureDiagram = dynamic(() => import('./ArchitectureDiagram'), { ssr: false });

const Root = styled(FusePageSimple)(({ theme }) => ({
	'&.FusePageSimple-scroll-content': {
		height: '100%',
	},
	'& .FusePageSimple-content': {
		backgroundColor: theme.vars.palette.background.default,
	},
}));

/* ------------------------------------------------------------------ */
/*  Data constants                                                     */
/* ------------------------------------------------------------------ */

const TECH_BADGES = [
	'Python', 'AWS Lambda', 'Kinesis', 'SageMaker', 'DynamoDB',
	'React Leaflet', 'SNS', 'CloudWatch', 'S3',
];

interface SchemaColumn {
	name: string;
	type: string;
	notes: string;
}

const DRIVERS_SCHEMA: SchemaColumn[] = [
	{ name: 'driverId', type: 'VARCHAR', notes: 'PK — DRV-10001 format' },
	{ name: 'name', type: 'VARCHAR', notes: 'Driver name' },
	{ name: 'zone', type: 'ENUM', notes: 'Seattle-North, Chicago-Loop, LA-Westside, etc.' },
	{ name: 'vehicleType', type: 'ENUM', notes: 'BIKE, CAR, VAN, SCOOTER' },
	{ name: 'status', type: 'ENUM', notes: 'ACTIVE, FLAGGED, SUSPENDED, UNDER_INVESTIGATION, CLEARED' },
	{ name: 'fraudScore', type: 'INT', notes: '0-100 composite anomaly score' },
	{ name: 'primaryFraudPattern', type: 'VARCHAR', notes: 'Pattern name or null' },
	{ name: 'hourlyRate', type: 'DECIMAL', notes: '18-25 USD' },
	{ name: 'totalShifts', type: 'INT', notes: 'Career shifts worked (20-200)' },
	{ name: 'flaggedShifts', type: 'INT', notes: 'Shifts with fraud flags (0-50)' },
	{ name: 'customerComplaintRate', type: 'DECIMAL', notes: '0.0-0.6 ratio' },
	{ name: 'onTimeRate', type: 'DECIMAL', notes: '0.0-1.0 ratio' },
];

const DELIVERIES_SCHEMA: SchemaColumn[] = [
	{ name: 'deliveryId', type: 'VARCHAR', notes: 'PK' },
	{ name: 'driverId', type: 'VARCHAR', notes: 'FK -> Drivers' },
	{ name: 'zone', type: 'ENUM', notes: 'Delivery zone' },
	{ name: 'deliveryStatus', type: 'ENUM', notes: 'COMPLETED, ATTEMPTED, FAILED, GHOST_FLAGGED, SPOOFED_FLAGGED' },
	{ name: 'timeAtDeliveryAddress', type: 'INT', notes: 'Seconds at address (0 = ghost delivery)' },
	{ name: 'distanceFromAddressAtCompletion', type: 'INT', notes: 'Meters from address at completion event' },
	{ name: 'fraudFlagType', type: 'VARCHAR', notes: 'Pattern name or null' },
	{ name: 'fraudConfidence', type: 'INT', notes: '0-100 ML confidence score' },
	{ name: 'customerComplaint', type: 'BOOLEAN', notes: 'Customer reported issue' },
];

const GPS_TRACES_SCHEMA: SchemaColumn[] = [
	{ name: 'driverId', type: 'VARCHAR', notes: 'PK (composite)' },
	{ name: 'date', type: 'DATE', notes: 'PK (composite) — shift date' },
	{ name: 'fraudPattern', type: 'VARCHAR', notes: 'Detected pattern or null' },
	{ name: 'pings[]', type: 'ARRAY', notes: '{timestamp, lat, lng, speed, accuracy}' },
];

const CASES_SCHEMA: SchemaColumn[] = [
	{ name: 'caseId', type: 'VARCHAR', notes: 'PK — CASE-2024-001 format' },
	{ name: 'driverId', type: 'VARCHAR', notes: 'FK -> Drivers' },
	{ name: 'status', type: 'ENUM', notes: 'OPEN, IN_REVIEW, ESCALATED, CLOSED_FRAUD, CLOSED_FALSE_POSITIVE' },
	{ name: 'fraudPattern', type: 'VARCHAR', notes: 'Pattern classification' },
	{ name: 'evidenceSummary', type: 'TEXT', notes: '2-3 sentence summary' },
	{ name: 'estimatedFraudAmount', type: 'DECIMAL', notes: 'USD, 200-8000' },
	{ name: 'resolution', type: 'TEXT', notes: 'Investigation outcome or null' },
];

interface LlmFeature {
	icon: typeof AutoAwesomeIcon;
	title: string;
	description: string;
}

const LLM_FEATURES: LlmFeature[] = [
	{
		icon: AutoAwesomeIcon,
		title: 'Fraud Investigation Summary',
		description:
			'Analyzes driver profile, delivery records, GPS trace, and evidence timeline to generate a formal investigation report — pattern classification, top 3 evidence points, confidence %, recommended action, and estimated financial impact.',
	},
	{
		icon: GpsFixedIcon,
		title: 'Signal Explanation',
		description:
			'Provides plain English explanations for each evidence timeline item. Contextualizes GPS anomalies, speed violations, and behavioral signals for non-technical ops managers who need to understand what the data means.',
	},
	{
		icon: SearchIcon,
		title: 'Natural Language Driver Search',
		description:
			'Queries like "show all order dodgers in Seattle with fraud score above 70" are interpreted and translated into structured filters. Returns matching driverIds with an explanation of what was found.',
	},
	{
		icon: SummarizeIcon,
		title: 'Daily Intelligence Brief',
		description:
			'Auto-loads on the Live Monitoring dashboard. Provides total fraud exposure, dominant pattern, highest-risk driver to prioritize, and one operational recommendation for the current shift.',
	},
	{
		icon: DescriptionIcon,
		title: 'Case Narrative Generator',
		description:
			'Drafts a formal investigation narrative for HR/legal review covering incident timeline, evidence, policy violations, and recommended action. Editable before saving to the case record.',
	},
];

interface MetricStat {
	value: string;
	label: string;
	bg: string;
}

const KEY_METRICS: MetricStat[] = [
	{ value: '$0.6M', label: 'Annual Savings', bg: 'bg-red-50 dark:bg-red-950' },
	{ value: '37', label: 'Headcount Avoided', bg: 'bg-orange-50 dark:bg-orange-950' },
	{ value: '< 90s', label: 'Detection Latency', bg: 'bg-green-50 dark:bg-green-950' },
	{ value: '< 8%', label: 'False Positive Rate', bg: 'bg-blue-50 dark:bg-blue-950' },
	{ value: '100%', label: 'Fleet Coverage', bg: 'bg-purple-50 dark:bg-purple-950' },
	{ value: '5', label: 'Fraud Patterns', bg: 'bg-amber-50 dark:bg-amber-950' },
];

interface FraudPattern {
	name: string;
	severity: string;
	severityColor: string;
	description: string;
	signals: string[];
}

const FRAUD_PATTERNS: FraudPattern[] = [
	{
		name: 'Roster Avoidance (Order Dodging)',
		severity: 'HIGH',
		severityColor: '#ea580c',
		description: 'Driver is clocked in with valid GPS movement but systematically positions outside pickup zones to avoid order assignment.',
		signals: ['active_hours > 6 AND orders_completed <= 1', 'Repeated movement AWAY from pickup clusters', '8+ assignment attempts with no pickup', 'Pattern repeats across consecutive shifts'],
	},
	{
		name: 'GPS Spoofing',
		severity: 'CRITICAL',
		severityColor: '#dc2626',
		description: 'Device transmits a fixed fake coordinate with micro-jitter while driver is physically stationary.',
		signals: ['GPS variance < 50m over 4 hours', 'Speed spikes 0 -> 45 -> 0 mph in 30s', 'IP geolocation mismatches GPS coordinates', 'Device accelerometer shows zero movement'],
	},
	{
		name: 'Ghost Delivery (Fake Completion)',
		severity: 'CRITICAL',
		severityColor: '#dc2626',
		description: 'Driver marks delivery "completed" without traveling to customer address. GPS shows driver never came within 500m.',
		signals: ['Nearest GPS point to address > 500m at completion', 'time_at_delivery_address = 0 seconds', 'No door photo or photo metadata location mismatch', 'Customer complaint rate > 40%'],
	},
	{
		name: 'Phantom Route (Teleportation)',
		severity: 'HIGH',
		severityColor: '#ea580c',
		description: 'GPS shows driver "teleporting" — instant appearance 15+ miles away with no route trace between points.',
		signals: ['Impossible distance between consecutive pings', 'Implied speed > 150 mph in urban area', 'Route reconstruction fails', 'Occurs during active delivery window (not a dropout)'],
	},
	{
		name: 'Cluster Fraud (Coordinated Spoofing)',
		severity: 'CRITICAL',
		severityColor: '#dc2626',
		description: '3+ drivers show identical GPS coordinates at a non-hub location. Suggests shared spoofing script or organized fraud ring.',
		signals: ['3+ drivers within 50m for 30+ minutes', 'All show zero deliveries during overlap', 'Similar device fingerprints (OS, app version, IP subnet)', 'Location is not a registered hub or pickup zone'],
	},
];

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function SchemaTable({ title, columns }: { title: string; columns: SchemaColumn[] }) {
	return (
		<Box className="mb-8">
			<Typography variant="h6" className="mb-3 font-semibold">{title}</Typography>
			<TableContainer component={Paper} variant="outlined">
				<Table size="small">
					<TableHead>
						<TableRow sx={{ backgroundColor: 'action.hover' }}>
							<TableCell sx={{ fontWeight: 700 }}>Column</TableCell>
							<TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
							<TableCell sx={{ fontWeight: 700 }}>Notes</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{columns.map((col) => (
							<TableRow key={col.name} hover>
								<TableCell>
									<code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm dark:bg-gray-800">{col.name}</code>
								</TableCell>
								<TableCell>
									<span className="text-sm font-medium text-blue-700 dark:text-blue-400">{col.type}</span>
								</TableCell>
								<TableCell className="text-sm text-gray-600 dark:text-gray-400">{col.notes}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
		</Box>
	);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<Box className="mb-16">
			<Typography variant="h4" className="mb-6 font-bold tracking-tight">{title}</Typography>
			{children}
		</Box>
	);
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

/**
 * LoFAT About page — system design overview, fraud patterns, GPS pipeline
 * architecture, ML approach, data model, and LLM enhancements.
 */
export default function AboutPage() {
	return (
		<Root
			scroll="content"
			content={
				<Box className="w-full">
					{/* Hero */}
					<Box
						className="flex flex-col items-center justify-center px-6 py-20 text-center text-white"
						sx={{
							background: 'linear-gradient(135deg, #dc2626 0%, #ea580c 50%, #9333ea 100%)',
						}}
					>
						<Typography variant="h3" className="mb-4 font-extrabold tracking-tight">
							LoFAT — Last-Mile Fraud Detection Platform
						</Typography>
						<Typography variant="h6" className="mb-8 max-w-2xl font-light opacity-90">
							GPS telemetry fraud detection for last-mile delivery — automated flagging of spoofing, ghost deliveries, and coordinated fraud
						</Typography>
						<Box className="flex flex-wrap justify-center gap-2">
							{TECH_BADGES.map((badge) => (
								<Chip
									key={badge}
									label={badge}
									sx={{
										backgroundColor: 'rgba(255,255,255,0.2)',
										color: '#fff',
										fontWeight: 600,
										backdropFilter: 'blur(4px)',
										border: '1px solid rgba(255,255,255,0.3)',
									}}
								/>
							))}
						</Box>
					</Box>

					{/* Body */}
					<Box className="mx-auto max-w-5xl px-6 py-16 sm:px-10">
						{/* Problem Statement */}
						<Section title="Problem Statement">
							<Paper variant="outlined" className="p-6 sm:p-8" sx={{ borderRadius: 3 }}>
								<Typography variant="body1" className="mb-4 leading-relaxed text-gray-700 dark:text-gray-300">
									Amazon&apos;s last-mile delivery fleet operates on an hourly pay model.
									A subset of drivers exploit this structure by remaining &quot;on shift&quot;
									while systematically avoiding or fabricating deliveries. Prior to LoFAT,
									fraud detection relied on manual audits of delivery logs, tip-line reports,
									and periodic GPS spot-checks — a reactive process that caught less than
									15% of fraudulent activity and required a dedicated 37-person investigation team.
								</Typography>
								<Typography variant="body1" className="leading-relaxed text-gray-700 dark:text-gray-300">
									LoFAT replaced this manual process with an automated pipeline that ingests
									GPS telemetry in real time, applies ML anomaly detection models (Isolation
									Forest + Gradient Boosted Classifier), and surfaces flagged drivers to a
									streamlined investigation workflow — reducing the investigation team from
									37 to 0 dedicated headcount while increasing detection coverage from &lt;15%
									to 100% of the active fleet.
								</Typography>
							</Paper>
						</Section>

						{/* Fraud Patterns */}
						<Section title="Fraud Patterns (5 Types)">
							<Box className="space-y-4">
								{FRAUD_PATTERNS.map((pattern) => (
									<Paper key={pattern.name} variant="outlined" className="p-6" sx={{ borderRadius: 3 }}>
										<Box className="mb-3 flex items-center gap-2 flex-wrap">
											<Typography variant="h6" className="font-semibold">
												{pattern.name}
											</Typography>
											<Chip
												label={pattern.severity}
												size="small"
												sx={{
													backgroundColor: `${pattern.severityColor}20`,
													color: pattern.severityColor,
													fontWeight: 700,
													fontSize: '11px',
												}}
											/>
										</Box>
										<Typography variant="body2" className="mb-3 leading-relaxed text-gray-600 dark:text-gray-400">
											{pattern.description}
										</Typography>
										<Box className="space-y-1">
											{pattern.signals.map((signal) => (
												<Typography key={signal} variant="body2" className="text-gray-500 dark:text-gray-500">
													<code className="mr-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800">signal</code>
													{signal}
												</Typography>
											))}
										</Box>
									</Paper>
								))}
							</Box>
						</Section>

						{/* Architecture */}
						<Section title="System Architecture">
							<Paper variant="outlined" className="p-6 sm:p-8" sx={{ borderRadius: 3 }}>
								<Typography variant="body1" className="mb-4 leading-relaxed text-gray-700 dark:text-gray-300">
									GPS pings arrive at 5-second intervals from driver devices into Amazon
									Kinesis Data Streams. A Lambda consumer processes each event batch,
									enriches it with shift context from DynamoDB, and extracts a feature
									vector over a 15-minute sliding window. The feature vector is scored
									by a SageMaker endpoint running an Isolation Forest model — anomalies
									above threshold 0.7 trigger a secondary Gradient Boosted Classifier
									that classifies the fraud pattern.
								</Typography>
								<Typography variant="body1" className="mb-4 leading-relaxed text-gray-700 dark:text-gray-300">
									Kinesis Data Analytics runs real-time SQL aggregation for cluster fraud
									detection — identifying 3+ drivers within 50m for 30+ minutes. When
									fraud is confirmed, the Lambda function writes an alert to DynamoDB and
									publishes to SNS for push notifications to the React dashboard.
								</Typography>
								<Typography variant="body1" className="leading-relaxed text-gray-700 dark:text-gray-300">
									GPS trace archives are stored in S3 for historical analysis and model
									retraining. The React dashboard connects via API Gateway to query
									driver state, fetch GPS traces for map visualization, and invoke
									LLM-powered analysis through Anthropic Claude.
								</Typography>
							</Paper>
							<Typography variant="caption" className="mt-4 mb-2 block text-gray-400 italic">
								Animated edges show the primary data path. Dashed edges show async/secondary flows. Drag to explore, scroll to zoom.
							</Typography>
							<ArchitectureDiagram />
						</Section>

						{/* ML Approach */}
						<Section title="ML Approach">
							<Paper variant="outlined" className="p-6 sm:p-8" sx={{ borderRadius: 3 }}>
								<Typography variant="h6" className="mb-3 font-semibold">Primary: Isolation Forest (Unsupervised)</Typography>
								<Typography variant="body2" className="mb-4 leading-relaxed text-gray-600 dark:text-gray-400">
									Trained on 30 days of historical GPS data from clean drivers only.
									Operates on 15-minute sliding windows with features including GPS variance,
									max speed delta, zone proximity, delivery rate, and cluster density.
									Anomalies scoring above 0.7 trigger secondary classification. Retrained
									weekly on a rolling 30-day window.
								</Typography>
								<Typography variant="h6" className="mb-3 font-semibold">Secondary: Gradient Boosted Classifier</Typography>
								<Typography variant="body2" className="mb-4 leading-relaxed text-gray-600 dark:text-gray-400">
									Trained on 1,200 labeled fraud cases across 3 months. Classifies
									anomalies into 5 fraud patterns with a confidence score per pattern.
									Auto-flag threshold: 0.8 confidence. Achieved 92.3% precision and
									88.7% recall with a false positive rate under 8%.
								</Typography>
								<Box className="mt-4 grid gap-3 sm:grid-cols-2">
									{[
										{ feat: 'gps_variance', desc: 'Std dev of lat/lng within window' },
										{ feat: 'max_speed_delta', desc: 'Largest speed change between pings' },
										{ feat: 'zone_proximity', desc: 'Min distance to nearest pickup zone' },
										{ feat: 'delivery_rate', desc: 'Deliveries completed / hours active' },
										{ feat: 'cluster_density', desc: 'Number of drivers within 50m' },
										{ feat: 'route_continuity', desc: '% of consecutive pings with valid road path' },
									].map((item) => (
										<Box key={item.feat} className="flex gap-2">
											<code className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800">{item.feat}</code>
											<Typography variant="body2" className="text-gray-500 dark:text-gray-500">{item.desc}</Typography>
										</Box>
									))}
								</Box>
							</Paper>
						</Section>

						{/* Data Model */}
						<Section title="Data Model">
							<SchemaTable title="Drivers (200 records)" columns={DRIVERS_SCHEMA} />
							<SchemaTable title="Deliveries (1,000 records)" columns={DELIVERIES_SCHEMA} />
							<SchemaTable title="GPS Traces (20 flagged drivers)" columns={GPS_TRACES_SCHEMA} />
							<SchemaTable title="Investigation Cases (30 records)" columns={CASES_SCHEMA} />
						</Section>

						{/* LLM Enhancements */}
						<Section title="LLM Enhancements">
							<Box className="grid gap-6 sm:grid-cols-2">
								{LLM_FEATURES.map((feat) => {
									const Icon = feat.icon;
									return (
										<Paper key={feat.title} variant="outlined" className="p-6" sx={{ borderRadius: 3 }}>
											<Box className="mb-3 flex items-center gap-2">
												<Icon sx={{ color: '#dc2626' }} />
												<Typography variant="h6" className="font-semibold">
													{feat.title} <span className="text-red-500">&#10022;</span>
												</Typography>
											</Box>
											<Typography variant="body2" className="mb-3 leading-relaxed text-gray-600 dark:text-gray-400">
												{feat.description}
											</Typography>
											<Typography variant="caption" className="italic text-gray-400 dark:text-gray-500">
												Represents how I would build this system today with LLM capabilities
											</Typography>
										</Paper>
									);
								})}
							</Box>
						</Section>

						{/* Key Metrics */}
						<Section title="Key Metrics">
							<Box className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{KEY_METRICS.map((m) => (
									<Paper
										key={m.label}
										variant="outlined"
										className={`flex flex-col items-center justify-center p-6 text-center ${m.bg}`}
										sx={{ borderRadius: 3 }}
									>
										<Typography variant="h4" className="mb-1 font-extrabold tracking-tight">{m.value}</Typography>
										<Typography variant="body2" className="font-medium text-gray-500 dark:text-gray-400">{m.label}</Typography>
									</Paper>
								))}
							</Box>
						</Section>
					</Box>
				</Box>
			}
		/>
	);
}
