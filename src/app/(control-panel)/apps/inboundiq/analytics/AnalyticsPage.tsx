'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import FusePageSimple from '@fuse/core/FusePageSimple';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
	LineChart,
	Line,
	ReferenceLine,
	ComposedChart,
	Label,
} from 'recharts';
import trucksData from '@/data/inboundiq/trucks.json';
import { type Truck, type FcOption, FC_OPTIONS, DOORS_PER_FC } from '../types';

const MapContent = dynamic(() => import('../map/MapContent'), {
	ssr: false,
	loading: () => (
		<Box display="flex" alignItems="center" justifyContent="center" sx={{ minHeight: 400 }}>
			<CircularProgress />
		</Box>
	),
});

/**
 * Styled root following the InboundIQ page pattern (no right sidebar).
 */
const Root = styled(FusePageSimple)(({ theme }) => ({
	'&.FusePageSimple-scroll-content': {
		height: '100%',
	},
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

const allTrucks = trucksData as Truck[];

/** Appointment type color map (shared across charts). */
const APPT_COLORS: Record<string, string> = {
	HOT: '#ef4444',
	SPD: '#f97316',
	CARP: '#3b82f6',
	AMZL: '#14b8a6',
};

/** Dwell bucket color map. */
const DWELL_COLORS: Record<string, string> = {
	'0-4h': '#22c55e',
	'4-8h': '#22c55e',
	'8-12h': '#22c55e',
	'12-24h': '#f59e0b',
	'24h+': '#ef4444',
};

/** Low instock bucket color map. */
const INSTOCK_COLORS: Record<string, string> = {
	'0-20%': '#fbbf24',
	'20-40%': '#f59e0b',
	'40-60%': '#ea580c',
	'60-80%': '#dc2626',
};

/**
 * Generate synthetic TAT improvement timeline (Jan 2016 - Dec 2017).
 * Starts around 6.7h, HEIMDALL deployed Apr 2016, declining to ~2.2h by Dec 2017.
 */
function generateTatTimeline(): { month: string; tat: number }[] {
	const data: { month: string; tat: number }[] = [];
	const months = [
		'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
		'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
	];

	for (let year = 2016; year <= 2017; year++) {
		for (let m = 0; m < 12; m++) {
			const index = (year - 2016) * 12 + m;
			let tat: number;

			if (index <= 2) {
				// Jan-Mar 2016: baseline ~6.7h with slight noise
				tat = 6.7 + (Math.sin(index * 1.5) * 0.15);
			} else if (index === 3) {
				// Apr 2016: deployment month, first drop
				tat = 5.8;
			} else {
				// Post-deployment: exponential decay toward 2.2
				const monthsAfterDeploy = index - 3;
				tat = 2.2 + 3.6 * Math.exp(-0.18 * monthsAfterDeploy);
				// Add small noise
				tat += Math.sin(index * 2.1) * 0.12;
			}

			data.push({
				month: `${months[m]} ${year}`,
				tat: Math.round(tat * 100) / 100,
			});
		}
	}

	return data;
}

/**
 * Generate synthetic daily dock throughput for the last 14 days.
 */
function generateThroughputData(): {
	day: string;
	HOT: number;
	SPD: number;
	CARP: number;
	AMZL: number;
}[] {
	const data: { day: string; HOT: number; SPD: number; CARP: number; AMZL: number }[] = [];
	const today = new Date();

	for (let i = 13; i >= 0; i--) {
		const d = new Date(today);
		d.setDate(d.getDate() - i);
		const label = `${d.getMonth() + 1}/${d.getDate()}`;

		// HOT trucks consistently prioritized (highest throughput)
		const seed = d.getDate();
		data.push({
			day: label,
			HOT: 8 + Math.floor(Math.sin(seed * 0.7) * 3 + 3),
			SPD: 5 + Math.floor(Math.sin(seed * 1.1) * 2 + 2),
			CARP: 10 + Math.floor(Math.sin(seed * 0.9) * 3 + 3),
			AMZL: 4 + Math.floor(Math.sin(seed * 1.3) * 2 + 2),
		});
	}

	return data;
}

/**
 * Custom Recharts label renderer for the Pie chart.
 */
interface PieLabelProps {
	cx: number;
	cy: number;
	midAngle: number;
	innerRadius: number;
	outerRadius: number;
	percent: number;
	name: string;
	value: number;
}

function renderPieLabel({
	cx,
	cy,
	midAngle,
	innerRadius,
	outerRadius,
	percent,
	name,
	value,
}: PieLabelProps): React.ReactElement {
	const RADIAN = Math.PI / 180;
	const radius = innerRadius + (outerRadius - innerRadius) * 1.6;
	const x = cx + radius * Math.cos(-midAngle * RADIAN);
	const y = cy + radius * Math.sin(-midAngle * RADIAN);

	return (
		<text
			x={x}
			y={y}
			fill="#888"
			textAnchor={x > cx ? 'start' : 'end'}
			dominantBaseline="central"
			fontSize={12}
		>
			{`${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
		</text>
	);
}

/**
 * ChartCard — reusable wrapper for each chart tile.
 */
function ChartCard({
	title,
	subtitle,
	children,
}: {
	title: string;
	subtitle?: string;
	children: React.ReactNode;
}) {
	return (
		<Paper
			className="p-4 rounded-lg"
			elevation={0}
			sx={{ border: '1px solid', borderColor: 'divider' }}
		>
			<Typography variant="h6" className="font-semibold mb-1">
				{title}
			</Typography>
			{subtitle && (
				<Typography variant="body2" color="text.secondary" className="mb-3">
					{subtitle}
				</Typography>
			)}
			<Box className="w-full" sx={{ height: 320 }}>
				{children}
			</Box>
		</Paper>
	);
}

/**
 * InboundIQ Analytics page — 6 Recharts visualizations derived from truck data.
 */
export function AnalyticsPage() {
	const yardTrucks = useMemo(
		() => allTrucks.filter((t) => t.dmStatus === 'Arrived' || t.dmStatus === 'PreCheckin'),
		[]
	);

	const dockedTrucks = useMemo(
		() => allTrucks.filter((t) => t.dmStatus === 'CheckedIn'),
		[]
	);

	// ── Chart 1: Yard Queue Depth by FC ──
	const queueDepthData = useMemo(() => {
		return FC_OPTIONS.map((fc) => ({
			fc,
			Waiting: yardTrucks.filter((t) => t.fcId === fc).length,
			'At Dock': dockedTrucks.filter((t) => t.fcId === fc).length,
			Capacity: DOORS_PER_FC[fc],
		}));
	}, [yardTrucks, dockedTrucks]);

	// ── Chart 2: Dwell Time Distribution ──
	const dwellData = useMemo(() => {
		const buckets: Record<string, number> = {
			'0-4h': 0,
			'4-8h': 0,
			'8-12h': 0,
			'12-24h': 0,
			'24h+': 0,
		};

		yardTrucks.forEach((t) => {
			if (t.dwellHours === null) return;
			const h = t.dwellHours;
			if (h < 4) buckets['0-4h']++;
			else if (h < 8) buckets['4-8h']++;
			else if (h < 12) buckets['8-12h']++;
			else if (h < 24) buckets['12-24h']++;
			else buckets['24h+']++;
		});

		return Object.entries(buckets).map(([bucket, count]) => ({
			bucket,
			count,
			fill: DWELL_COLORS[bucket],
		}));
	}, [yardTrucks]);

	// ── Chart 3: Low In-Stock % Distribution ──
	const instockData = useMemo(() => {
		const buckets: Record<string, number> = {
			'0-20%': 0,
			'20-40%': 0,
			'40-60%': 0,
			'60-80%': 0,
		};

		yardTrucks.forEach((t) => {
			const pct = t.lowInstockPct;
			if (pct < 20) buckets['0-20%']++;
			else if (pct < 40) buckets['20-40%']++;
			else if (pct < 60) buckets['40-60%']++;
			else buckets['60-80%']++;
		});

		return Object.entries(buckets).map(([bucket, count]) => ({
			bucket,
			count,
			fill: INSTOCK_COLORS[bucket],
		}));
	}, [yardTrucks]);

	// ── Chart 4: Appointment Type Breakdown ──
	const apptTypeData = useMemo(() => {
		const counts: Record<string, number> = { HOT: 0, SPD: 0, CARP: 0, AMZL: 0 };
		yardTrucks.forEach((t) => {
			counts[t.apptType]++;
		});
		return Object.entries(counts).map(([name, value]) => ({ name, value }));
	}, [yardTrucks]);

	// ── Chart 5: TAT Improvement Timeline ──
	const tatData = useMemo(() => generateTatTimeline(), []);

	// ── Chart 6: Dock Throughput by Appointment Type ──
	const throughputData = useMemo(() => generateThroughputData(), []);

	return (
		<Root
			scroll="content"
			header={
				<div className="flex items-center gap-3 py-2 px-6 sm:px-8 w-full">
					<Typography className="text-lg font-bold">
						Analytics
					</Typography>
					<Typography variant="caption" color="text.secondary">
						InboundIQ operational metrics and trends
					</Typography>
				</div>
			}
			content={
				<div className="p-6 sm:p-8 w-full">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Chart 1 — Yard Queue Depth by FC */}
						<ChartCard
							title="Yard Queue Depth by FC"
							subtitle="Waiting vs. docked trucks per fulfillment center against door capacity"
						>
							<ResponsiveContainer width="100%" height="100%">
								<ComposedChart data={queueDepthData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="fc" />
									<YAxis />
									<Tooltip />
									<Legend />
									<Bar dataKey="Waiting" fill="#f59e0b" radius={[4, 4, 0, 0]} />
									<Bar dataKey="At Dock" fill="#14b8a6" radius={[4, 4, 0, 0]} />
									<Line
										type="monotone"
										dataKey="Capacity"
										stroke="#ef4444"
										strokeWidth={2}
										strokeDasharray="6 3"
										dot={{ r: 4, fill: '#ef4444' }}
										name="Door Capacity"
									/>
								</ComposedChart>
							</ResponsiveContainer>
						</ChartCard>

						{/* Chart 2 — Dwell Time Distribution */}
						<ChartCard
							title="Dwell Time Distribution"
							subtitle="Hours trucks have been waiting in the yard queue"
						>
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={dwellData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="bucket" />
									<YAxis />
									<Tooltip />
									<Bar dataKey="count" name="Trucks" radius={[4, 4, 0, 0]}>
										{dwellData.map((entry) => (
											<Cell key={entry.bucket} fill={entry.fill} />
										))}
									</Bar>
									<ReferenceLine x="24h+" stroke="#ef4444" strokeDasharray="3 3">
										<Label
											value="SLA breach threshold"
											position="top"
											fill="#ef4444"
											fontSize={11}
										/>
									</ReferenceLine>
								</BarChart>
							</ResponsiveContainer>
						</ChartCard>

						{/* Chart 3 — Low In-Stock % Distribution */}
						<ChartCard
							title="Low In-Stock % Distribution"
							subtitle="Cargo criticality — % of SKUs out of stock at destination FC"
						>
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={instockData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="bucket" />
									<YAxis />
									<Tooltip />
									<Bar dataKey="count" name="Trucks" radius={[4, 4, 0, 0]}>
										{instockData.map((entry) => (
											<Cell key={entry.bucket} fill={entry.fill} />
										))}
									</Bar>
								</BarChart>
							</ResponsiveContainer>
						</ChartCard>

						{/* Chart 4 — Appointment Type Breakdown */}
						<ChartCard
							title="Appointment Type Breakdown"
							subtitle="Yard queue trucks by appointment priority category"
						>
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={apptTypeData}
										cx="50%"
										cy="50%"
										innerRadius={60}
										outerRadius={100}
										paddingAngle={3}
										dataKey="value"
										nameKey="name"
										label={renderPieLabel}
									>
										{apptTypeData.map((entry) => (
											<Cell
												key={entry.name}
												fill={APPT_COLORS[entry.name]}
											/>
										))}
									</Pie>
									<Tooltip />
									<Legend />
								</PieChart>
							</ResponsiveContainer>
						</ChartCard>

						{/* Chart 5 — TAT Improvement Timeline */}
						<ChartCard
							title="TAT Improvement Timeline"
							subtitle="Average truck turnaround time (hours) — Jan 2016 to Dec 2017"
						>
							<ResponsiveContainer width="100%" height="100%">
								<LineChart data={tatData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis
										dataKey="month"
										interval={3}
										angle={-30}
										textAnchor="end"
										height={50}
										tick={{ fontSize: 11 }}
									/>
									<YAxis
										domain={[0, 8]}
										label={{
											value: 'TAT (hours)',
											angle: -90,
											position: 'insideLeft',
											style: { fontSize: 12 },
										}}
									/>
									<Tooltip />
									<Line
										type="monotone"
										dataKey="tat"
										stroke="#3b82f6"
										strokeWidth={2}
										dot={false}
										name="Avg TAT (hrs)"
									/>
									<ReferenceLine
										x="Apr 2016"
										stroke="#16a34a"
										strokeDasharray="4 4"
										strokeWidth={2}
									>
										<Label
											value="HEIMDALL DEPLOYED"
											position="top"
											fill="#16a34a"
											fontSize={11}
											fontWeight="bold"
										/>
									</ReferenceLine>
									<ReferenceLine
										y={2.2}
										stroke="#94a3b8"
										strokeDasharray="3 3"
									>
										<Label
											value="Target: 2.2h"
											position="right"
											fill="#94a3b8"
											fontSize={11}
										/>
									</ReferenceLine>
								</LineChart>
							</ResponsiveContainer>
						</ChartCard>

						{/* Chart 6 — Dock Throughput by Appointment Type */}
						<ChartCard
							title="Dock Throughput by Appointment Type"
							subtitle="Daily trucks unloaded (last 14 days) — HOT trucks consistently prioritized"
						>
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={throughputData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="day" />
									<YAxis />
									<Tooltip />
									<Legend />
									<Bar
										dataKey="HOT"
										stackId="a"
										fill={APPT_COLORS.HOT}
									/>
									<Bar
										dataKey="SPD"
										stackId="a"
										fill={APPT_COLORS.SPD}
									/>
									<Bar
										dataKey="CARP"
										stackId="a"
										fill={APPT_COLORS.CARP}
									/>
									<Bar
										dataKey="AMZL"
										stackId="a"
										fill={APPT_COLORS.AMZL}
										radius={[4, 4, 0, 0]}
									/>
								</BarChart>
							</ResponsiveContainer>
						</ChartCard>
					</div>

					{/* FC Network Map */}
					<Paper
						className="p-4 rounded-lg mt-6"
						elevation={0}
						sx={{ border: '1px solid', borderColor: 'divider' }}
					>
						<Typography variant="h6" className="font-semibold mb-1">
							FC Network Map
						</Typography>
						<Typography variant="body2" color="text.secondary" className="mb-3">
							Real-time yard pressure and dock utilization across all fulfillment centers
						</Typography>
						<MapContent />
					</Paper>
				</div>
			}
		/>
	);
}

export default AnalyticsPage;
