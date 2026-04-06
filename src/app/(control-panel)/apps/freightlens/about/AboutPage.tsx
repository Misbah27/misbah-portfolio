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
import LinearProgress from '@mui/material/LinearProgress';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SearchIcon from '@mui/icons-material/Search';
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
	'Python', 'ReactJS', 'AWS Lambda', 'DynamoDB', 'API Gateway',
	'CloudWatch', 'S3', 'EventBridge',
];

interface SchemaColumn {
	name: string;
	type: string;
	notes: string;
}

const ROLLING21_SCHEMA: SchemaColumn[] = [
	{ name: 'fcId', type: 'VARCHAR', notes: 'PK (composite) — FC identifier' },
	{ name: 'date', type: 'DATE', notes: 'PK (composite) — calendar date' },
	{ name: 'bmPortal', type: 'INT', notes: 'BM Portal planned capacity (units)' },
	{ name: 'vendorScheduled', type: 'INT', notes: 'Vendor-confirmed appointment units' },
	{ name: 'saBlocked', type: 'INT', notes: 'Standing Appointment blocked capacity' },
	{ name: 'saScheduled', type: 'INT', notes: 'Standing Appointment confirmed units' },
	{ name: 'saUnitsLeft', type: 'INT', notes: '0 = over-scheduled (RED flag)' },
	{ name: 'totalUnitsLeft', type: 'INT', notes: 'Net remaining capacity' },
	{ name: 'utilizationPct', type: 'DECIMAL', notes: 'Over 100% = over-capacity' },
];

const STANDING_SCHEMA: SchemaColumn[] = [
	{ name: 'fcId', type: 'VARCHAR', notes: 'FK → FC' },
	{ name: 'vendorType', type: 'ENUM', notes: 'PCP or PSP' },
	{ name: 'breakdownType', type: 'ENUM', notes: 'Blocked or Scheduled' },
	{ name: 'date', type: 'DATE', notes: 'Calendar date' },
	{ name: 'units', type: 'INT', notes: 'Appointment unit count' },
];

const METRICS_SCHEMA: SchemaColumn[] = [
	{ name: 'fcId', type: 'VARCHAR', notes: 'PK (composite)' },
	{ name: 'date', type: 'DATE', notes: 'PK (composite)' },
	{ name: 'plannedCapacity', type: 'INT', notes: 'Target daily capacity' },
	{ name: 'totalScheduledQty', type: 'INT', notes: 'All confirmed appointments' },
	{ name: 'ncnsPct', type: 'DECIMAL', notes: 'No Call No Show rate' },
	{ name: 'vendorReceipts', type: 'INT', notes: 'Actual vendor deliveries' },
	{ name: 'endBacklog', type: 'INT', notes: 'Outstanding unprocessed volume' },
	{ name: 'hotPos', type: 'INT', notes: 'Urgent purchase orders count' },
	{ name: 'dsAllocationPct', type: 'DECIMAL', notes: 'Day-shift allocation' },
	{ name: 'nsAllocationPct', type: 'DECIMAL', notes: 'Night-shift allocation' },
];

interface LlmFeature {
	icon: typeof AutoAwesomeIcon;
	title: string;
	description: string;
}

const LLM_FEATURES: LlmFeature[] = [
	{
		icon: AutoAwesomeIcon,
		title: 'Scheduling Risk Analyzer',
		description:
			'Analyzes the full Rolling 21 matrix to identify the top 3 over-scheduling risks across selected FCs. Returns FC name, date range, severity (HIGH/MEDIUM), and a recommended operational action for each risk.',
	},
	{
		icon: SearchIcon,
		title: 'Natural Language Metric Query',
		description:
			'Plain English questions like "Which FCs are over capacity next week?" or "Show me FCs with NCNS above 15%". The LLM interprets the query against FC metric data and highlights matching fulfillment centers.',
	},
	{
		icon: TrendingUpIcon,
		title: 'Capacity Forecast Summary',
		description:
			'Auto-loads on the Rolling 21 Days page. Evaluates overall network health (HEALTHY / AT_RISK / CRITICAL) based on over-scheduling frequency, identifies the top concern, and recommends a specific operational action.',
	},
];

interface MetricStat {
	value: string;
	label: string;
	bg: string;
}

const KEY_METRICS: MetricStat[] = [
	{ value: '100+ FCs', label: 'Visibility Scope', bg: 'bg-blue-50 dark:bg-blue-950' },
	{ value: '500 hrs/mo', label: 'Manual Work Saved', bg: 'bg-green-50 dark:bg-green-950' },
	{ value: '21 Days', label: 'Rolling Window', bg: 'bg-purple-50 dark:bg-purple-950' },
	{ value: '8 FCs', label: 'Demo Deployment', bg: 'bg-amber-50 dark:bg-amber-950' },
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
 * FreightLens About page — system design overview, data model,
 * architecture, and LLM enhancements.
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
							background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 50%, #6366f1 100%)',
						}}
					>
						<Typography variant="h3" className="mb-4 font-extrabold tracking-tight">
							FreightLens — Daily Freight Tracker
						</Typography>
						<Typography variant="h6" className="mb-8 max-w-2xl font-light opacity-90">
							Real-time visibility across 100+ FCs, eliminating manual spreadsheets and saving 500+ hours per month
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
									Amazon&apos;s inbound freight scheduling was managed through disconnected
									spreadsheets shared across 100+ fulfillment centers. Each FC independently
									tracked vendor appointments, standing appointment allocations, and capacity
									metrics — making it impossible for regional managers to identify scheduling
									conflicts, over-commitments, or capacity gaps until they manifested as
									operational disruptions on the dock floor.
								</Typography>
								<Typography variant="body1" className="leading-relaxed text-gray-700 dark:text-gray-300">
									FreightLens consolidated all FC scheduling data into a single rolling 21-day
									matrix view. The system surfaces over-scheduled dates (where committed volume
									exceeds planned capacity) in real time, provides standing appointment
									breakdowns by vendor type, and exposes per-FC operational metrics — enabling
									proactive load balancing and capacity planning across the network.
								</Typography>
							</Paper>
						</Section>

						{/* Architecture */}
						<Section title="System Architecture">
							<Paper variant="outlined" className="p-6 sm:p-8" sx={{ borderRadius: 3 }}>
								<Typography variant="body1" className="mb-4 leading-relaxed text-gray-700 dark:text-gray-300">
									FreightLens ingests daily scheduling data from FC-level systems through an
									EventBridge-orchestrated pipeline. Each FC publishes its appointment and
									capacity data to S3, which triggers a Lambda consolidation function that
									normalizes, validates, and writes to DynamoDB.
								</Typography>
								<Typography variant="body1" className="mb-4 leading-relaxed text-gray-700 dark:text-gray-300">
									The React frontend queries a REST API (API Gateway + Lambda) to retrieve the
									rolling 21-day matrix, standing appointment breakdowns, and FC metrics. The
									Admin Portal writes updates back through the same API layer, with optimistic
									locking on DynamoDB items to prevent conflicting edits.
								</Typography>
								<Typography variant="body1" className="leading-relaxed text-gray-700 dark:text-gray-300">
									CloudWatch dashboards monitor data freshness (each FC must report within its
									SLA window), Lambda error rates, and API latency. Alarms trigger SNS
									notifications to the on-call team when an FC misses its reporting window.
								</Typography>
							</Paper>
							<Typography variant="caption" className="mt-4 mb-2 block text-gray-400 italic">
								Animated edges show the primary request path. Dashed edges show async/secondary flows. Drag to explore, scroll to zoom.
							</Typography>
							<ArchitectureDiagram />
						</Section>

						{/* Data Model */}
						<Section title="Data Model">
							<SchemaTable title="Rolling 21-Day Capacity" columns={ROLLING21_SCHEMA} />
							<SchemaTable title="Standing Appointments" columns={STANDING_SCHEMA} />
							<SchemaTable title="FC Operational Metrics" columns={METRICS_SCHEMA} />
						</Section>

						{/* Capacity Logic */}
						<Section title="Capacity Utilization Logic">
							<Paper variant="outlined" className="p-6 sm:p-8" sx={{ borderRadius: 3 }}>
								<Box className="mb-6 rounded-lg p-4 text-center" sx={{ backgroundColor: 'action.hover' }}>
									<Typography sx={{ fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: 600 }}>
										Utilization % = ((vendorScheduled + saScheduled) / bmPortal) x 100
									</Typography>
								</Box>
								<Box className="space-y-4">
									{[
										{ label: 'Healthy (0-85%)', value: 85, color: '#22c55e', desc: 'Normal scheduling — capacity buffer available' },
										{ label: 'Warning (85-100%)', value: 100, color: '#f59e0b', desc: 'Approaching capacity — monitor closely' },
										{ label: 'Over-scheduled (>100%)', value: 100, color: '#ef4444', desc: 'Committed volume exceeds planned capacity — requires rebalancing' },
									].map((tier) => (
										<Box key={tier.label}>
											<Box className="mb-1 flex items-baseline justify-between">
												<Typography variant="subtitle2" className="font-semibold">{tier.label}</Typography>
												<Typography variant="caption" className="font-bold" sx={{ color: tier.color }}>
													{tier.label.includes('>') ? 'RED' : tier.label.includes('85') ? 'AMBER' : 'GREEN'}
												</Typography>
											</Box>
											<LinearProgress
												variant="determinate"
												value={tier.value}
												sx={{
													height: 10, borderRadius: 5, backgroundColor: 'action.hover',
													'& .MuiLinearProgress-bar': { backgroundColor: tier.color, borderRadius: 5 },
												}}
											/>
											<Typography variant="caption" className="mt-0.5 text-gray-500 dark:text-gray-400">
												{tier.desc}
											</Typography>
										</Box>
									))}
								</Box>
							</Paper>
						</Section>

						{/* LLM Enhancements */}
						<Section title="LLM Enhancements">
							<Box className="grid gap-6 sm:grid-cols-2">
								{LLM_FEATURES.map((feat) => {
									const Icon = feat.icon;
									return (
										<Paper key={feat.title} variant="outlined" className="p-6" sx={{ borderRadius: 3 }}>
											<Box className="mb-3 flex items-center gap-2">
												<Icon sx={{ color: '#0d9488' }} />
												<Typography variant="h6" className="font-semibold">
													{feat.title} <span className="text-teal-500">&#10022;</span>
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
							<Box className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
