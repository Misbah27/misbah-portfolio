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
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SearchIcon from '@mui/icons-material/Search';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import dynamic from 'next/dynamic';

const ArchitectureDiagram = dynamic(() => import('./ArchitectureDiagram'), { ssr: false });

/**
 * Styled FusePageSimple root for the About page (no sidebars).
 */
const Root = styled(FusePageSimple)(({ theme }) => ({
	'& .FusePageSimple-header': {
		backgroundColor: theme.vars.palette.background.paper,
		borderBottomWidth: 1,
		borderStyle: 'solid',
		borderColor: theme.vars.palette.divider,
	},
	'& .FusePageSimple-content': {
		backgroundColor: theme.vars.palette.background.default,
	},
}));

/* ------------------------------------------------------------------ */
/*  Data constants                                                     */
/* ------------------------------------------------------------------ */

const TECH_BADGES = [
	'Python',
	'ReactJS',
	'AWS Lambda',
	'MySQL RDS',
	'API Gateway',
	'CloudWatch',
	'Midway Auth',
];

interface SchemaColumn {
	name: string;
	type: string;
	notes: string;
}

const APPOINTMENTS_SCHEMA: SchemaColumn[] = [
	{ name: 'appointmentId', type: 'VARCHAR', notes: 'PK' },
	{ name: 'warehouseId', type: 'VARCHAR', notes: 'FK → FC' },
	{ name: 'appointmentStatus', type: 'ENUM', notes: 'OPEN, CHECKED_IN, CLOSED' },
	{ name: 'carrierName', type: 'VARCHAR', notes: 'SCAC carrier' },
	{ name: 'appointmentStartDate', type: 'DATETIME', notes: '' },
	{ name: 'appointmentEndDate', type: 'DATETIME', notes: '' },
	{ name: 'vrid', type: 'VARCHAR', notes: 'Vehicle Registration ID' },
	{ name: 'unitCount', type: 'INT', notes: '' },
	{ name: 'cartonCount', type: 'INT', notes: '' },
	{ name: 'apptType', type: 'ENUM', notes: 'CARP, AMZL, SPD, HOT' },
	{ name: 'lowInstockPct', type: 'DECIMAL', notes: '0-80, shelf criticality' },
	{ name: 'scac', type: 'VARCHAR', notes: 'Carrier code' },
	{ name: 'doorNumber', type: 'INT', notes: 'Assigned dock door' },
	{ name: 'lastUpdatedTime', type: 'DATETIME', notes: '' },
	{ name: 'recordVersion', type: 'INT', notes: 'Optimistic locking' },
];

const YARD_EVENTS_SCHEMA: SchemaColumn[] = [
	{ name: 'nodeId', type: 'VARCHAR', notes: 'PK' },
	{ name: 'buildingCode', type: 'VARCHAR', notes: 'FC identifier' },
	{ name: 'equipmentNumber', type: 'VARCHAR', notes: '' },
	{ name: 'registrationId', type: 'VARCHAR', notes: '' },
	{ name: 'shipperAccount', type: 'VARCHAR', notes: '' },
	{ name: 'vrid', type: 'VARCHAR', notes: '' },
	{ name: 'ISA', type: 'VARCHAR', notes: 'ISA identifier' },
	{ name: 'userId', type: 'VARCHAR', notes: 'Operator' },
	{ name: 'timeStamp', type: 'DATETIME', notes: '' },
	{ name: 'notes', type: 'TEXT', notes: '' },
];

const SHIPMENTS_SCHEMA: SchemaColumn[] = [
	{ name: 'appointmentId', type: 'VARCHAR', notes: 'PK (composite)' },
	{ name: 'shipmentId', type: 'VARCHAR', notes: 'PK (composite)' },
	{ name: 'warehouseId', type: 'VARCHAR', notes: '' },
	{ name: 'eventType', type: 'ENUM', notes: '' },
	{ name: 'cartonCount', type: 'INT', notes: '' },
	{ name: 'unitCount', type: 'INT', notes: '' },
	{ name: 'shipmentStatus', type: 'ENUM', notes: '' },
	{ name: 'recordVersion', type: 'INT', notes: '' },
];

interface RankingWeight {
	label: string;
	weight: number;
	color: string;
	description: string;
}

const RANKING_WEIGHTS: RankingWeight[] = [
	{ label: 'Low In-Stock %', weight: 35, color: '#ef4444', description: 'How critically the FC shelves need this cargo' },
	{ label: 'Appointment Type', weight: 25, color: '#f97316', description: 'HOT = 100, SPD = 75, CARP = 50, AMZL = 40' },
	{ label: 'Dwell Hours', weight: 20, color: '#3b82f6', description: 'Time waiting in yard, normalized' },
	{ label: 'Stow Urgency', weight: 12, color: '#8b5cf6', description: 'Stow window pressure' },
	{ label: 'Arrival Status', weight: 8, color: '#14b8a6', description: 'Timing vs scheduled appointment' },
];


interface LlmFeature {
	icon: typeof AutoAwesomeIcon;
	title: string;
	description: string;
}

const LLM_FEATURES: LlmFeature[] = [
	{
		icon: AutoAwesomeIcon,
		title: 'Explain Rank',
		description:
			'Per-truck AI explanation of why it is ranked at its current position, referencing actual model weights — lowInstockPct, apptType, dwellHours, stowUrgency, and arrivalStatus — with a plain-English narrative for operations associates.',
	},
	{
		icon: SearchIcon,
		title: 'Natural Language Filter',
		description:
			'Plain English queries like "show HOT trucks with high instock need" or "dwell over 12 hours at SEA1" that the LLM translates into structured filters applied to the yard queue table in real time.',
	},
	{
		icon: SmartToyIcon,
		title: 'Dock Intelligence',
		description:
			'AI-powered recommendations for dock allocation that analyze the current yard queue, dock occupancy, unloading ETAs, and truck priority scores to suggest which truck should be assigned to the next available door.',
	},
	{
		icon: QuestionAnswerIcon,
		title: 'Ask the Yard',
		description:
			'Conversational chat interface with full yard context — docked trucks, waiting trucks, door status, and FC metrics — enabling operations leads to ask ad-hoc questions without building queries.',
	},
];

interface MetricStat {
	value: string;
	label: string;
	bg: string;
}

const KEY_METRICS: MetricStat[] = [
	{ value: '6.7 → 2.2 hrs', label: 'Truck TAT P95', bg: 'bg-red-50 dark:bg-red-950' },
	{ value: '100%', label: 'Decision Automation', bg: 'bg-blue-50 dark:bg-blue-950' },
	{ value: '5 FCs', label: 'Deployment Scope', bg: 'bg-green-50 dark:bg-green-950' },
	{ value: '<2 min', label: 'Ranking Refresh Rate', bg: 'bg-purple-50 dark:bg-purple-950' },
];

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

/** Renders a styled schema table with MUI Table components. */
function SchemaTable({ title, columns }: { title: string; columns: SchemaColumn[] }) {
	return (
		<Box className="mb-8">
			<Typography variant="h6" className="mb-3 font-semibold">
				{title}
			</Typography>
			<TableContainer
				component={Paper}
				variant="outlined"
			>
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
									<code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm dark:bg-gray-800">
										{col.name}
									</code>
								</TableCell>
								<TableCell>
									<span className="text-sm font-medium text-blue-700 dark:text-blue-400">
										{col.type}
									</span>
								</TableCell>
								<TableCell className="text-sm text-gray-600 dark:text-gray-400">
									{col.notes}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
		</Box>
	);
}


/* ------------------------------------------------------------------ */
/*  Section wrapper                                                    */
/* ------------------------------------------------------------------ */

/** Consistent section wrapper with title. */
function Section({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
	return (
		<Box id={id} className="mb-16">
			<Typography variant="h4" className="mb-6 font-bold tracking-tight">
				{title}
			</Typography>
			{children}
		</Box>
	);
}

/* ------------------------------------------------------------------ */
/*  Main page component                                                */
/* ------------------------------------------------------------------ */

/**
 * InboundIQ About page — system design overview, architecture,
 * database schema, ranking model, and LLM enhancements.
 */
export function AboutPage() {
	return (
		<Root
			content={
				<Box className="w-full">
					{/* SECTION 1 — Hero */}
					<Box
						className="flex flex-col items-center justify-center px-6 py-20 text-center text-white"
						sx={{
							background: 'linear-gradient(135deg, #4338ca 0%, #2563eb 50%, #0ea5e9 100%)',
						}}
					>
						<Typography variant="h3" className="mb-4 font-extrabold tracking-tight">
							InboundIQ — Intelligent Dock Allocation Engine
						</Typography>
						<Typography variant="h6" className="mb-8 max-w-2xl font-light opacity-90">
							Reduced truck TAT from 6.7 → 2.2 hours across Amazon FCs
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

					{/* Page body */}
					<Box className="mx-auto max-w-5xl px-6 py-16 sm:px-10">
						{/* SECTION 2 — Problem Statement */}
						<Section title="Problem Statement">
							<Paper variant="outlined" className="p-6 sm:p-8" sx={{ borderRadius: 3 }}>
								<Typography variant="body1" className="mb-4 leading-relaxed text-gray-700 dark:text-gray-300">
									Fulfillment Center dock doors are among the scarcest resources in Amazon&apos;s
									inbound logistics network — each site operates with just 10 to 15 doors.
									Without a systematic prioritization engine, operations associates relied on
									manual judgment to decide which truck in the yard should be sent to the next
									available door. This approach introduced inconsistency, bias toward familiar
									carriers, and frequent misallocation that left high-priority cargo waiting
									while less urgent loads occupied doors.
								</Typography>
								<Typography variant="body1" className="leading-relaxed text-gray-700 dark:text-gray-300">
									Heimdall (InboundIQ) replaced all manual decision-making with a data-driven
									priority model. The system continuously evaluates every truck in the yard
									across five weighted dimensions — shelf criticality, appointment urgency,
									dwell time, stow window pressure, and arrival timing — to produce a
									real-time ranked queue. When a door becomes available, the highest-priority
									truck is automatically surfaced to the operator, eliminating guesswork and
									ensuring that the most business-critical cargo always moves first.
								</Typography>
							</Paper>
						</Section>

						{/* SECTION 3 — Architecture */}
						<Section title="System Architecture">
							<Typography variant="body2" className="mb-2 text-gray-500 dark:text-gray-400">
								Serverless, event-driven architecture on AWS. The system ingests real-time
								appointment, shipment, and yard events through the Infinity Pipeline (SNS),
								processes them via Lambda, persists state in MySQL RDS (Multi-AZ), and serves
								a React dashboard through API Gateway. Drag to explore, scroll to zoom.
							</Typography>
							<Typography variant="caption" className="mb-6 block text-gray-400 italic">
								Animated edges show the primary request path. Dashed edges show async/secondary flows.
							</Typography>
							<ArchitectureDiagram />
						</Section>

						{/* SECTION 4 — Database Schema */}
						<Section title="Database Schema">
							<SchemaTable title="Appointments" columns={APPOINTMENTS_SCHEMA} />
							<SchemaTable title="YardEvents" columns={YARD_EVENTS_SCHEMA} />
							<SchemaTable title="Shipments" columns={SHIPMENTS_SCHEMA} />
						</Section>

						{/* SECTION 5 — Ranking Model */}
						<Section title="Priority Scoring Model">
							<Paper
								variant="outlined"
								className="p-6 sm:p-8"
								sx={{ borderRadius: 3 }}
							>
								<Box
									className="mb-8 rounded-lg p-4 text-center"
									sx={{ backgroundColor: 'action.hover' }}
								>
									<Typography
										variant="body1"
										sx={{ fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: 600 }}
									>
										Priority Score = (lowInstockPct × 0.35) + (apptTypeScore × 0.25) +
										(dwellHoursScore × 0.20) + (stowUrgencyScore × 0.12) + (arrivalScore × 0.08)
									</Typography>
								</Box>

								<Box className="space-y-5">
									{RANKING_WEIGHTS.map((w) => (
										<Box key={w.label}>
											<Box className="mb-1 flex items-baseline justify-between">
												<Typography variant="subtitle2" className="font-semibold">
													{w.label}
												</Typography>
												<Typography variant="caption" className="font-bold" sx={{ color: w.color }}>
													{w.weight}%
												</Typography>
											</Box>
											<LinearProgress
												variant="determinate"
												value={w.weight}
												sx={{
													height: 10,
													borderRadius: 5,
													backgroundColor: 'action.hover',
													'& .MuiLinearProgress-bar': {
														backgroundColor: w.color,
														borderRadius: 5,
													},
												}}
											/>
											<Typography variant="caption" className="mt-0.5 text-gray-500 dark:text-gray-400">
												{w.description}
											</Typography>
										</Box>
									))}
								</Box>
							</Paper>
						</Section>

						{/* SECTION 6 — LLM Enhancements */}
						<Section title="LLM Enhancements">
							<Box className="grid gap-6 sm:grid-cols-2">
								{LLM_FEATURES.map((feat) => {
									const Icon = feat.icon;
									return (
										<Paper
											key={feat.title}
											variant="outlined"
											className="p-6"
											sx={{ borderRadius: 3 }}
										>
											<Box className="mb-3 flex items-center gap-2">
												<Icon sx={{ color: '#8b5cf6' }} />
												<Typography variant="h6" className="font-semibold">
													{feat.title} <span className="text-purple-500">&#10022;</span>
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

						{/* SECTION 7 — Key Metrics */}
						<Section title="Key Metrics">
							<Box className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
								{KEY_METRICS.map((m) => (
									<Paper
										key={m.label}
										variant="outlined"
										className={`flex flex-col items-center justify-center p-6 text-center ${m.bg}`}
										sx={{ borderRadius: 3 }}
									>
										<Typography variant="h4" className="mb-1 font-extrabold tracking-tight">
											{m.value}
										</Typography>
										<Typography variant="body2" className="font-medium text-gray-500 dark:text-gray-400">
											{m.label}
										</Typography>
									</Paper>
								))}
							</Box>
						</Section>

						{/* SECTION 8 — Footer link */}
						<Box className="flex justify-center pb-8">
							<Button
								variant="outlined"
								size="large"
								endIcon={<ArrowForwardIcon />}
								href="/docs/inboundiq/"
								sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
							>
								View System Design on GitHub
							</Button>
						</Box>
					</Box>
				</Box>
			}
		/>
	);
}

export default AboutPage;
