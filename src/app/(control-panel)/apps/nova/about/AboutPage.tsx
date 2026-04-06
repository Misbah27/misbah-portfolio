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
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

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
	'Python', 'ReactJS', 'AWS Lambda', 'Kinesis', 'DynamoDB',
	'SNS/SQS', 'CloudWatch', 'Step Functions',
];

interface SchemaColumn {
	name: string;
	type: string;
	notes: string;
}

const DELAY_ALERTS_SCHEMA: SchemaColumn[] = [
	{ name: 'vehicleId', type: 'VARCHAR', notes: 'PK — VRID' },
	{ name: 'lane', type: 'VARCHAR', notes: 'Origin→Destination (e.g. SEA1→PDX2)' },
	{ name: 'destination', type: 'VARCHAR', notes: 'Destination city' },
	{ name: 'zone', type: 'ENUM', notes: 'North, South, East, West' },
	{ name: 'scac', type: 'VARCHAR', notes: 'Carrier SCAC code' },
	{ name: 'reasonCodedBy', type: 'ENUM', notes: 'WEATHER, AMAZON_TOC, CARRIER' },
	{ name: 'delayHours', type: 'DECIMAL', notes: '0 = on time, >0 = delayed' },
	{ name: 'plannedYardTime', type: 'DATETIME', notes: 'Expected yard arrival' },
	{ name: 'eta', type: 'DATETIME', notes: 'Current estimated arrival' },
	{ name: 'alertType', type: 'ENUM', notes: 'LH (Linehaul) or MR (Middle-mile)' },
];

const RESCUES_SCHEMA: SchemaColumn[] = [
	{ name: 'rescueId', type: 'VARCHAR', notes: 'PK' },
	{ name: 'originalVrid', type: 'VARCHAR', notes: 'FK → delayed vehicle' },
	{ name: 'rescueVrid', type: 'VARCHAR', notes: 'Replacement vehicle assigned' },
	{ name: 'lane', type: 'VARCHAR', notes: 'Affected lane' },
	{ name: 'delayHours', type: 'DECIMAL', notes: 'Hours of delay triggering rescue' },
	{ name: 'rescueStatus', type: 'ENUM', notes: 'PENDING, APPROVED, IN_TRANSIT, DELIVERED' },
	{ name: 'retrievalTime', type: 'VARCHAR', notes: 'Planned retrieval window' },
	{ name: 'reasonForDelay', type: 'VARCHAR', notes: 'Root cause description' },
	{ name: 'clientApprovals', type: 'ARRAY[BOOL]', notes: '3 stakeholder sign-offs' },
];

interface LlmFeature {
	icon: typeof AutoAwesomeIcon;
	title: string;
	description: string;
}

const LLM_FEATURES: LlmFeature[] = [
	{
		icon: AutoAwesomeIcon,
		title: 'Delay Intelligence Brief',
		description:
			'Auto-loads on the Delay Alert dashboard. Analyzes all active delays to identify the critical corridor, top delay reason, and provides a network-wide intelligence summary with recommended NOC actions.',
	},
	{
		icon: LocalShippingIcon,
		title: 'Rescue Recommendation Engine',
		description:
			'Evaluates a delayed shipment against available rescue vehicles, transit times, and customer impact to recommend the optimal rescue plan — including carrier selection, timing, and cost trade-offs.',
	},
	{
		icon: SearchIcon,
		title: 'Natural Language Delay Filter',
		description:
			'Queries like "Show North zone vehicles delayed 6+ hours with high EDD impact" are interpreted by the LLM and translated into structured filters applied to the delay alerts table.',
	},
	{
		icon: SummarizeIcon,
		title: 'Executive Summary Generator',
		description:
			'Generates a concise executive-level summary of the current delay landscape, including delay distribution by reason code, highest-impact lanes, and recommended escalation actions.',
	},
];

interface MetricStat {
	value: string;
	label: string;
	bg: string;
}

const KEY_METRICS: MetricStat[] = [
	{ value: '150', label: 'Vehicles Monitored', bg: 'bg-orange-50 dark:bg-orange-950' },
	{ value: '50', label: 'Rescue Records', bg: 'bg-blue-50 dark:bg-blue-950' },
	{ value: '< 5 min', label: 'Alert Latency', bg: 'bg-green-50 dark:bg-green-950' },
	{ value: '3 Roles', label: 'Access Control', bg: 'bg-purple-50 dark:bg-purple-950' },
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
 * Nova About page — system design overview, delay pipeline architecture,
 * rescue workflow, data model, and LLM enhancements.
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
							background: 'linear-gradient(135deg, #ea580c 0%, #dc2626 50%, #9333ea 100%)',
						}}
					>
						<Typography variant="h3" className="mb-4 font-extrabold tracking-tight">
							Nova — Delay Alert + Rescue Planner
						</Typography>
						<Typography variant="h6" className="mb-8 max-w-2xl font-light opacity-90">
							Real-time linehaul delay visibility and automated rescue planning across the transportation network
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
									Amazon&apos;s linehaul network moves thousands of trailers daily between
									fulfillment centers. When a vehicle encounters delays — weather, carrier
									issues, or operational disruptions — the downstream impact cascades across
									the network. Without centralized delay visibility, NOC (Network Operations
									Center) teams relied on fragmented carrier updates, phone calls, and manual
									spreadsheets to identify and respond to delays.
								</Typography>
								<Typography variant="body1" className="leading-relaxed text-gray-700 dark:text-gray-300">
									Nova provides a unified delay alert dashboard that ingests real-time vehicle
									telemetry and carrier status updates through Kinesis streams. When delays
									are detected, the system automatically categorizes them by reason code,
									calculates downstream EDD (Estimated Delivery Date) impact, and surfaces
									rescue recommendations. The Rescue Planner provides a 5-tab workflow
									(Home, Edit, Plan, Check, Follow Up) with role-based access for Internal
									NOC, Line-haul Associates, and ATS Surface teams.
								</Typography>
							</Paper>
						</Section>

						{/* Architecture */}
						<Section title="System Architecture">
							<Paper variant="outlined" className="p-6 sm:p-8" sx={{ borderRadius: 3 }}>
								<Typography variant="body1" className="mb-4 leading-relaxed text-gray-700 dark:text-gray-300">
									Vehicle telemetry and carrier status updates flow into Amazon Kinesis Data
									Streams in real time. A Lambda consumer processes each event, correlating
									it with the planned transit schedule stored in DynamoDB. When a delay is
									detected (actual ETA exceeds planned yard time), the system generates an
									alert and publishes it to SNS for downstream consumers.
								</Typography>
								<Typography variant="body1" className="mb-4 leading-relaxed text-gray-700 dark:text-gray-300">
									The Rescue Planner uses AWS Step Functions to orchestrate the multi-step
									rescue workflow. When a rescue is initiated, the state machine coordinates
									vehicle availability checks, carrier capacity queries, route optimization,
									and approval workflows — with each step backed by a dedicated Lambda function.
								</Typography>
								<Typography variant="body1" className="leading-relaxed text-gray-700 dark:text-gray-300">
									The React dashboard connects to API Gateway, which routes requests to Lambda
									handlers for delay queries, rescue CRUD operations, and LLM-powered analysis.
									CloudWatch Alarms monitor delay volume spikes and rescue SLA breaches.
								</Typography>
							</Paper>
						</Section>

						{/* Data Model */}
						<Section title="Data Model">
							<SchemaTable title="Delay Alerts" columns={DELAY_ALERTS_SCHEMA} />
							<SchemaTable title="Rescue Records" columns={RESCUES_SCHEMA} />
						</Section>

						{/* Rescue Workflow */}
						<Section title="Rescue Workflow">
							<Paper variant="outlined" className="p-6 sm:p-8" sx={{ borderRadius: 3 }}>
								<Box className="space-y-4">
									{[
										{ step: 'Home', desc: 'Dashboard overview of all active rescues, status distribution, and priority queue.' },
										{ step: 'Edit', desc: 'Update retrieval time and delay reason for the selected rescue record.' },
										{ step: 'Plan', desc: 'AI-powered rescue recommendations — carrier selection, route, timing, and cost analysis.' },
										{ step: 'Check', desc: 'Stakeholder approval workflow — 3 sign-offs required before rescue execution.' },
										{ step: 'Follow Up', desc: 'Post-rescue tracking — delivery confirmation, carrier performance, and incident closure.' },
									].map((item, i) => (
										<Box key={item.step} className="flex gap-4">
											<Box
												className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold"
												sx={{ backgroundColor: '#dc2626' }}
											>
												{i + 1}
											</Box>
											<Box>
												<Typography variant="subtitle2" className="font-semibold">{item.step}</Typography>
												<Typography variant="body2" className="text-gray-600 dark:text-gray-400">{item.desc}</Typography>
											</Box>
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
