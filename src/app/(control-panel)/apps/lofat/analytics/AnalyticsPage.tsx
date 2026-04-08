'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import FusePageSimple from '@fuse/core/FusePageSimple';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import PageBreadcrumb from 'src/components/PageBreadcrumb';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { motion } from 'motion/react';
import {
	PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
	BarChart, Bar, XAxis, YAxis, CartesianGrid,
	LineChart, Line, ReferenceLine,
	AreaChart, Area,
} from 'recharts';
import type { Driver, ShiftMetric, FraudPattern } from '../types';
import { FRAUD_PATTERNS, PATTERN_LABELS, PATTERN_COLORS, ZONES, ZONE_CITY_MAP } from '../types';

const ZoneDensityMap = dynamic(() => import('./ZoneDensityMap'), {
	ssr: false,
	loading: () => <Skeleton variant="rectangular" height={280} />,
});

const Root = styled(FusePageSimple)(({ theme }) => ({
	'&.FusePageSimple-scroll-content': { height: '100%' },
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

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

const SCORE_BUCKETS = ['0-20', '21-40', '41-60', '61-80', '81-100'];
const SCORE_BUCKET_COLORS = ['#4caf50', '#8bc34a', '#ffeb3b', '#ff9800', '#f44336'];

/**
 * LoFAT Fraud Pattern Analytics — 6 charts + summary stats.
 */
function AnalyticsPage() {
	const [drivers, setDrivers] = useState<Driver[]>([]);
	const [metrics, setMetrics] = useState<ShiftMetric[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		Promise.all([
			import('@/data/lofat/drivers.json'),
			import('@/data/lofat/shiftMetrics.json'),
		])
			.then(([dMod, mMod]) => {
				setDrivers(dMod.default as Driver[]);
				setMetrics(mMod.default as ShiftMetric[]);
			})
			.catch(() => {})
			.finally(() => setLoading(false));
	}, []);

	// Chart 1: Pattern distribution pie
	const patternPieData = useMemo(() => {
		const counts: Record<string, number> = {};
		drivers.forEach((d) => {
			if (d.primaryFraudPattern) {
				counts[d.primaryFraudPattern] = (counts[d.primaryFraudPattern] || 0) + 1;
			}
		});
		return FRAUD_PATTERNS.filter((p) => counts[p]).map((p) => ({
			name: PATTERN_LABELS[p],
			value: counts[p] || 0,
			color: PATTERN_COLORS[p],
		}));
	}, [drivers]);

	// Chart 2: Score distribution bar
	const scoreBarData = useMemo(() => {
		const buckets = [0, 0, 0, 0, 0];
		drivers.forEach((d) => {
			if (d.fraudScore <= 20) buckets[0]++;
			else if (d.fraudScore <= 40) buckets[1]++;
			else if (d.fraudScore <= 60) buckets[2]++;
			else if (d.fraudScore <= 80) buckets[3]++;
			else buckets[4]++;
		});
		return SCORE_BUCKETS.map((label, i) => ({ range: label, count: buckets[i], fill: SCORE_BUCKET_COLORS[i] }));
	}, [drivers]);

	// Chart 3: Daily alerts trend
	const alertsTrend = useMemo(() => {
		return metrics.map((m) => ({
			date: m.date.slice(5),
			alerts: m.totalFraudAlerts,
		}));
	}, [metrics]);

	const avgAlerts = useMemo(() => {
		if (metrics.length === 0) return 0;
		return metrics.reduce((s, m) => s + m.totalFraudAlerts, 0) / metrics.length;
	}, [metrics]);

	// Chart 4: Cumulative loss prevention
	const cumulativePrevention = useMemo(() => {
		let cumulative = 0;
		return metrics.map((m) => {
			cumulative += m.preventedAmount;
			return { date: m.date.slice(5), prevented: cumulative };
		});
	}, [metrics]);

	// Chart 6: Pattern × Zone matrix
	const patternZoneData = useMemo(() => {
		const zoneMap: Record<string, Record<string, number>> = {};
		const cities = ['Seattle', 'Chicago', 'Los Angeles'];
		cities.forEach((c) => {
			zoneMap[c] = {};
			FRAUD_PATTERNS.forEach((p) => { zoneMap[c][p] = 0; });
		});
		drivers.forEach((d) => {
			if (d.primaryFraudPattern) {
				const city = ZONE_CITY_MAP[d.zone];
				if (city && zoneMap[city]) {
					zoneMap[city][d.primaryFraudPattern]++;
				}
			}
		});
		return Object.entries(zoneMap).map(([city, patterns]) => ({
			city,
			...patterns,
		}));
	}, [drivers]);

	// Summary stats
	const totalFlagged = drivers.filter((d) => d.fraudScore >= 60).length;
	const totalLoss = metrics.reduce((s, m) => s + m.estimatedDailyLoss, 0);
	const detectionRate = drivers.length > 0
		? ((drivers.filter((d) => d.status !== 'ACTIVE' && d.status !== 'CLEARED').length /
			Math.max(1, drivers.filter((d) => d.fraudScore >= 60).length)) * 100)
		: 0;
	const avgResolution = 4.2;

	// Zone fraud density for map
	const zoneFraudData = useMemo(() => {
		return ZONES.map((z) => {
			const zoneDrivers = drivers.filter((d) => d.zone === z);
			const flagged = zoneDrivers.filter((d) => d.fraudScore >= 60);
			const patternCounts: Record<string, number> = {};
			flagged.forEach((d) => {
				if (d.primaryFraudPattern) {
					patternCounts[d.primaryFraudPattern] = (patternCounts[d.primaryFraudPattern] || 0) + 1;
				}
			});
			const dominant = Object.entries(patternCounts).sort((a, b) => b[1] - a[1])[0];
			return {
				zone: z,
				flaggedCount: flagged.length,
				dominantPattern: dominant ? PATTERN_LABELS[dominant[0] as FraudPattern] : 'None',
			};
		});
	}, [drivers]);

	if (loading) {
		return (
			<Root
				scroll="content"
				header={
					<div className="p-3 sm:px-4">
						<PageBreadcrumb className="mb-1" />
						<Skeleton variant="text" width={200} height={32} />
					</div>
				}
				content={
					<div className="w-full p-3 sm:p-4">
						<div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-2">
							{[0, 1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={70} />)}
						</div>
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
							{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} variant="rounded" height={300} />)}
						</div>
					</div>
				}
			/>
		);
	}

	return (
		<Root
			scroll="content"
			header={
				<div className="p-3 sm:px-4">
					<PageBreadcrumb className="mb-1" />
					<div className="flex items-center gap-2">
						<FuseSvgIcon size={24} color="secondary">heroicons-outline:chart-bar</FuseSvgIcon>
						<Typography variant="h6" className="font-semibold">Fraud Pattern Analytics</Typography>
					</div>
				</div>
			}
			content={
				<div className="w-full p-3 sm:p-4">
					<motion.div variants={containerVariants} initial="hidden" animate="show">
						{/* Summary stat row */}
						<motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-2" variants={itemVariants}>
							<StatCard icon="heroicons-outline:exclamation-triangle" label="Total Flagged Drivers" value={String(totalFlagged)} color="#f44336" />
							<StatCard icon="heroicons-outline:currency-dollar" label="Estimated Total Loss" value={`$${totalLoss.toLocaleString()}`} color="#ff9800" />
							<StatCard icon="heroicons-outline:shield-check" label="Fraud Detection Rate" value={`${detectionRate.toFixed(1)}%`} color="#4caf50" />
							<StatCard icon="heroicons-outline:clock" label="Avg Resolution Days" value={avgResolution.toFixed(1)} color="#2196f3" />
						</motion.div>

						{/* Charts grid */}
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
							{/* Chart 1: Pattern Distribution */}
							<motion.div variants={itemVariants}>
								<Paper className="p-3" elevation={0} variant="outlined">
									<Typography variant="subtitle2" className="font-semibold mb-2">Fraud Pattern Distribution</Typography>
									<ResponsiveContainer width="100%" height={240}>
										<PieChart>
											<Pie data={patternPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={40} paddingAngle={2}>
												{patternPieData.map((entry, i) => (
													<Cell key={i} fill={entry.color} />
												))}
											</Pie>
											<Tooltip />
											<Legend wrapperStyle={{ fontSize: 11 }} />
										</PieChart>
									</ResponsiveContainer>
								</Paper>
							</motion.div>

							{/* Chart 2: Score Distribution */}
							<motion.div variants={itemVariants}>
								<Paper className="p-3" elevation={0} variant="outlined">
									<Typography variant="subtitle2" className="font-semibold mb-2">Fraud Score Distribution</Typography>
									<ResponsiveContainer width="100%" height={240}>
										<BarChart data={scoreBarData}>
											<CartesianGrid strokeDasharray="3 3" />
											<XAxis dataKey="range" tick={{ fontSize: 11 }} />
											<YAxis tick={{ fontSize: 11 }} />
											<Tooltip />
											<Bar dataKey="count" name="Drivers">
												{scoreBarData.map((entry, i) => (
													<Cell key={i} fill={entry.fill} />
												))}
											</Bar>
										</BarChart>
									</ResponsiveContainer>
								</Paper>
							</motion.div>

							{/* Chart 3: Daily Alerts Trend */}
							<motion.div variants={itemVariants}>
								<Paper className="p-3" elevation={0} variant="outlined">
									<Typography variant="subtitle2" className="font-semibold mb-2">Daily Fraud Alerts (90 Days)</Typography>
									<ResponsiveContainer width="100%" height={240}>
										<LineChart data={alertsTrend}>
											<CartesianGrid strokeDasharray="3 3" />
											<XAxis dataKey="date" tick={{ fontSize: 10 }} interval={8} />
											<YAxis tick={{ fontSize: 11 }} />
											<Tooltip />
											<ReferenceLine y={avgAlerts} label={{ value: `Avg: ${avgAlerts.toFixed(1)}`, fontSize: 10, position: 'right' }} stroke="#9e9e9e" strokeDasharray="4 4" />
											<Line type="monotone" dataKey="alerts" stroke="#ef4444" strokeWidth={2} dot={false} />
										</LineChart>
									</ResponsiveContainer>
								</Paper>
							</motion.div>

							{/* Chart 4: Loss Prevention */}
							<motion.div variants={itemVariants}>
								<Paper className="p-3" elevation={0} variant="outlined">
									<Typography variant="subtitle2" className="font-semibold mb-2">Cumulative Loss Prevention ($)</Typography>
									<ResponsiveContainer width="100%" height={240}>
										<AreaChart data={cumulativePrevention}>
											<defs>
												<linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
													<stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
													<stop offset="95%" stopColor="#0d9488" stopOpacity={0.02} />
												</linearGradient>
											</defs>
											<CartesianGrid strokeDasharray="3 3" />
											<XAxis dataKey="date" tick={{ fontSize: 10 }} interval={8} />
											<YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
											<Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
											<Area type="monotone" dataKey="prevented" stroke="#0d9488" strokeWidth={2} fill="url(#tealGrad)" />
										</AreaChart>
									</ResponsiveContainer>
								</Paper>
							</motion.div>

							{/* Chart 5: Zone Fraud Density Map */}
							<motion.div variants={itemVariants}>
								<Paper className="p-3" elevation={0} variant="outlined">
									<Typography variant="subtitle2" className="font-semibold mb-2">Zone Fraud Density</Typography>
									<ZoneDensityMap zoneData={zoneFraudData} />
								</Paper>
							</motion.div>

							{/* Chart 6: Pattern × Zone Matrix */}
							<motion.div variants={itemVariants}>
								<Paper className="p-3" elevation={0} variant="outlined">
									<Typography variant="subtitle2" className="font-semibold mb-2">Pattern by City</Typography>
									<ResponsiveContainer width="100%" height={280}>
										<BarChart data={patternZoneData}>
											<CartesianGrid strokeDasharray="3 3" />
											<XAxis dataKey="city" tick={{ fontSize: 11 }} />
											<YAxis tick={{ fontSize: 11 }} />
											<Tooltip />
											<Legend wrapperStyle={{ fontSize: 10 }} />
											{FRAUD_PATTERNS.map((p) => (
												<Bar key={p} dataKey={p} name={PATTERN_LABELS[p]} fill={PATTERN_COLORS[p]} stackId="a" />
											))}
										</BarChart>
									</ResponsiveContainer>
								</Paper>
							</motion.div>
						</div>
					</motion.div>
				</div>
			}
		/>
	);
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
	return (
		<Paper className="p-3 flex items-center gap-3" elevation={0} variant="outlined" sx={{ borderLeft: `3px solid ${color}` }}>
			<div className="flex items-center justify-center w-10 h-10 rounded-lg" style={{ backgroundColor: `${color}15` }}>
				<FuseSvgIcon size={20} sx={{ color }}>{icon}</FuseSvgIcon>
			</div>
			<div>
				<Typography variant="caption" color="text.secondary" className="font-medium">{label}</Typography>
				<Typography variant="h6" className="font-bold leading-tight">{value}</Typography>
			</div>
		</Paper>
	);
}

export default AnalyticsPage;
