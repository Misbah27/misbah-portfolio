'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import FusePageSimple from '@fuse/core/FusePageSimple';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Button from '@mui/material/Button';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PageBreadcrumb from 'src/components/PageBreadcrumb';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { motion } from 'motion/react';
import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import DataTable from 'src/components/data-table/DataTable';
import { type MRT_ColumnDef } from 'material-react-table';
import EvidenceTimeline from './EvidenceTimeline';
import type { Driver, Delivery, GpsTrace } from '../../types';
import {
	FRAUD_SCORE_COLOR,
	PATTERN_LABELS,
	type DriverStatus,
} from '../../types';

const GpsTraceMap = dynamic(() => import('./GpsTraceMap'), {
	ssr: false,
	loading: () => (
		<div className="flex items-center justify-center h-full">
			<Skeleton variant="rectangular" width="100%" height={400} />
		</div>
	),
});

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

const containerVariants = {
	hidden: {},
	show: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
	hidden: { opacity: 0, y: 12 },
	show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const STATUS_CHIP_COLOR: Record<DriverStatus, 'info' | 'warning' | 'error' | 'secondary' | 'success'> = {
	ACTIVE: 'info',
	FLAGGED: 'warning',
	SUSPENDED: 'error',
	UNDER_INVESTIGATION: 'secondary',
	CLEARED: 'success',
};

const DELIVERY_COLUMNS: MRT_ColumnDef<Delivery>[] = [
	{ accessorKey: 'deliveryId', header: 'Delivery ID', size: 120 },
	{ accessorKey: 'deliveryAddress', header: 'Address', size: 200 },
	{
		accessorKey: 'deliveryStatus',
		header: 'Status',
		size: 120,
		Cell: ({ row }) => {
			const s = row.original.deliveryStatus;
			const isFraud = s === 'GHOST_FLAGGED' || s === 'SPOOFED_FLAGGED';
			return (
				<Chip
					label={s.replace(/_/g, ' ')}
					size="small"
					color={isFraud ? 'error' : s === 'COMPLETED' ? 'success' : 'default'}
					variant="outlined"
					sx={{ fontSize: '0.65rem', height: 22 }}
				/>
			);
		},
	},
	{
		accessorKey: 'fraudFlagType',
		header: 'Fraud Flag',
		size: 120,
		Cell: ({ row }) => {
			const flag = row.original.fraudFlagType;
			if (!flag) return <Typography variant="caption" color="text.disabled">None</Typography>;
			return (
				<Chip
					label={PATTERN_LABELS[flag]}
					size="small"
					sx={{ fontSize: '0.6rem', height: 20, backgroundColor: '#fff3e0', color: '#e65100' }}
				/>
			);
		},
	},
	{
		accessorKey: 'fraudConfidence',
		header: 'Confidence',
		size: 90,
		Cell: ({ row }) => {
			const v = row.original.fraudConfidence;
			if (v === 0) return <Typography variant="caption" color="text.disabled">-</Typography>;
			return (
				<Typography variant="caption" sx={{ fontWeight: 600, color: v >= 80 ? '#f44336' : '#ff9800' }}>
					{v}%
				</Typography>
			);
		},
	},
];

/**
 * Driver Investigation Detail — 3-column layout with driver profile,
 * GPS trace map, and evidence timeline + delivery table below.
 */
function DriverInvestigationPage() {
	const params = useParams();
	const driverId = params.driverId as string;
	const [driver, setDriver] = useState<Driver | null>(null);
	const [deliveries, setDeliveries] = useState<Delivery[]>([]);
	const [allTraces, setAllTraces] = useState<GpsTrace[]>([]);
	const [loading, setLoading] = useState(true);
	const [analysisText, setAnalysisText] = useState('');
	const [analysisLoading, setAnalysisLoading] = useState(false);
	const [analysisOpen, setAnalysisOpen] = useState(false);

	useEffect(() => {
		Promise.all([
			import('@/data/lofat/drivers.json'),
			import('@/data/lofat/deliveries.json'),
			import('@/data/lofat/gpsTraces.json'),
		])
			.then(([driverMod, deliveryMod, traceMod]) => {
				const found = (driverMod.default as Driver[]).find((d) => d.driverId === driverId);
				setDriver(found || null);
				setDeliveries(
					(deliveryMod.default as Delivery[]).filter((d) => d.driverId === driverId)
				);
				setAllTraces(traceMod.default as GpsTrace[]);
			})
			.catch(() => {
				setDriver(null);
			})
			.finally(() => setLoading(false));
	}, [driverId]);

	const trace = useMemo(
		() => allTraces.find((t) => t.driverId === driverId) ?? null,
		[allTraces, driverId]
	);

	const clusterTraces = useMemo(
		() => (trace?.fraudPattern === 'CLUSTER_FRAUD' ? allTraces.filter((t) => t.fraudPattern === 'CLUSTER_FRAUD') : undefined),
		[trace, allTraces]
	);

	const handleAnalyze = useCallback(async () => {
		if (!driver) return;
		setAnalysisLoading(true);
		setAnalysisOpen(true);
		try {
			const res = await fetch('/api/lofat/investigate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					driver,
					recentDeliveries: deliveries,
					fraudPattern: driver.primaryFraudPattern,
					flaggedShifts: driver.flaggedShifts,
				}),
			});
			const data = await res.json();
			setAnalysisText(data.result || data.error || 'Analysis unavailable.');
		} catch {
			setAnalysisText('Investigation analysis failed. Please try again.');
		} finally {
			setAnalysisLoading(false);
		}
	}, [driver, deliveries]);

	if (loading) {
		return (
			<Root
				scroll="content"
				header={
					<div className="p-3 sm:px-4">
						<PageBreadcrumb className="mb-1" />
						<Skeleton variant="text" width={250} height={32} />
					</div>
				}
				content={
					<div className="w-full p-3 sm:p-4">
						<div className="grid gap-2" style={{ gridTemplateColumns: '280px 1fr 320px' }}>
							<Skeleton variant="rounded" height={500} />
							<Skeleton variant="rounded" height={500} />
							<Skeleton variant="rounded" height={500} />
						</div>
						<Skeleton variant="rounded" height={200} className="mt-2" />
					</div>
				}
			/>
		);
	}

	if (!driver) {
		return (
			<Root
				scroll="content"
				header={
					<div className="p-3 sm:px-4">
						<PageBreadcrumb className="mb-1" />
						<Typography variant="h6">Driver Not Found</Typography>
					</div>
				}
				content={
					<div className="w-full p-3 sm:p-4 text-center">
						<Typography color="text.secondary">
							No driver found with ID {driverId}.
						</Typography>
					</div>
				}
			/>
		);
	}

	const scoreColor = FRAUD_SCORE_COLOR(driver.fraudScore);

	return (
		<Root
			scroll="content"
			header={
				<div className="p-3 sm:px-4">
					<PageBreadcrumb className="mb-1" />
					<div className="flex items-center gap-2">
						<FuseSvgIcon size={24} color="secondary">
							heroicons-outline:shield-exclamation
						</FuseSvgIcon>
						<Typography variant="h6" className="font-semibold">
							Investigation: {driver.name}
						</Typography>
						<Chip
							label={driver.status.replace(/_/g, ' ')}
							size="small"
							color={STATUS_CHIP_COLOR[driver.status]}
							variant="filled"
						/>
						{driver.primaryFraudPattern && (
							<Chip
								label={PATTERN_LABELS[driver.primaryFraudPattern]}
								size="small"
								sx={{ fontSize: '0.7rem', backgroundColor: '#fff3e0', color: '#e65100' }}
							/>
						)}
					</div>
				</div>
			}
			content={
				<div className="w-full p-3 sm:p-4">
					<motion.div
						variants={containerVariants}
						initial="hidden"
						animate="show"
					>
						{/* 3-column grid */}
						<div
							className="grid gap-2 mb-2"
							style={{
								gridTemplateColumns: '280px 1fr 320px',
								height: 'calc(100vh - 180px)',
								minHeight: 480,
							}}
						>
							{/* Left — Driver Profile */}
							<motion.div variants={itemVariants} className="overflow-y-auto">
								<DriverProfile driver={driver} scoreColor={scoreColor} />
							</motion.div>

							{/* Center — GPS Trace Map */}
							<motion.div variants={itemVariants}>
								<Paper
									elevation={0}
									variant="outlined"
									sx={{ height: '100%', overflow: 'hidden', borderRadius: 2 }}
								>
									<GpsTraceMap
										trace={trace}
										deliveries={deliveries}
										allTraces={clusterTraces}
									/>
								</Paper>
							</motion.div>

							{/* Right — Evidence Timeline */}
							<motion.div variants={itemVariants}>
								<EvidenceTimeline trace={trace} date={trace?.date ?? '2026-04-07'} />
							</motion.div>
						</div>

						{/* Analyze This Driver */}
						<motion.div variants={itemVariants} className="mb-2">
							<div className="flex items-center gap-2">
								<Button
									size="small"
									color="secondary"
									variant="contained"
									onClick={handleAnalyze}
									disabled={analysisLoading}
									startIcon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
									sx={{ textTransform: 'none', fontSize: '0.75rem' }}
								>
									{analysisLoading ? 'Analyzing...' : 'Analyze This Driver'}
								</Button>
								<Chip icon={<AutoAwesomeIcon />} label="AI-Enhanced" size="small" color="secondary" variant="outlined" />
								{analysisOpen && !analysisLoading && (
									<Button size="small" onClick={() => setAnalysisOpen(false)} sx={{ textTransform: 'none', fontSize: '0.7rem' }}>
										Hide
									</Button>
								)}
							</div>
							{analysisOpen && (
								<Paper className="p-3 mt-1" elevation={0} variant="outlined" sx={{ borderLeft: '3px solid', borderLeftColor: 'secondary.main' }}>
									{analysisLoading ? (
										<div className="space-y-1">
											<Skeleton variant="text" width="60%" />
											<Skeleton variant="text" width="100%" />
											<Skeleton variant="text" width="90%" />
											<Skeleton variant="text" width="85%" />
											<Skeleton variant="text" width="95%" />
											<Skeleton variant="text" width="70%" />
										</div>
									) : (
										<Typography variant="body2" sx={{ fontSize: '0.8rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
											{analysisText}
										</Typography>
									)}
									{!analysisLoading && analysisText && (
										<Button size="small" onClick={handleAnalyze} sx={{ mt: 1, textTransform: 'none', fontSize: '0.7rem' }}>
											Retry
										</Button>
									)}
								</Paper>
							)}
						</motion.div>

						{/* Bottom — Deliveries This Shift */}
						<motion.div variants={itemVariants}>
							<Paper className="p-2" elevation={0} variant="outlined">
								<div className="flex items-center gap-2 mb-1 px-1">
									<FuseSvgIcon size={16} color="action">heroicons-outline:cube</FuseSvgIcon>
									<Typography variant="subtitle2" className="font-semibold">
										Deliveries This Shift ({deliveries.length})
									</Typography>
								</div>
								<DataTable
									columns={DELIVERY_COLUMNS}
									data={deliveries}
									enableRowSelection={false}
									enableRowActions={false}
									enableColumnOrdering={false}
									enableGrouping={false}
									enableColumnPinning={false}
									enableDensityToggle={false}
									enableHiding={false}
									enableStickyHeader
									enableFilters={false}
									enablePagination={false}
									enableBottomToolbar={false}
									enableTopToolbar={false}
									initialState={{ density: 'compact' }}
									muiTableBodyRowProps={({ row }) => ({
										sx: row.original.fraudFlagType
											? { backgroundColor: 'rgba(244, 67, 54, 0.06)' }
											: undefined,
									})}
								/>
							</Paper>
						</motion.div>
					</motion.div>
				</div>
			}
		/>
	);
}

/** Driver profile card with RadialBarChart fraud score gauge and stats. */
function DriverProfile({ driver, scoreColor }: { driver: Driver; scoreColor: string }) {
	const gaugeData = [{ value: driver.fraudScore, fill: scoreColor }];

	return (
		<Paper className="p-3" elevation={0} variant="outlined" sx={{ height: '100%' }}>
			{/* Name + ID */}
			<Typography variant="h6" className="font-semibold leading-tight">
				{driver.name}
			</Typography>
			<Chip
				label={driver.driverId}
				size="small"
				variant="outlined"
				sx={{ fontSize: '0.65rem', mt: 0.5, fontFamily: 'monospace' }}
			/>

			{/* Zone + Vehicle */}
			<div className="flex items-center gap-1 mt-2">
				<Chip label={driver.zone} size="small" color="info" variant="outlined" sx={{ fontSize: '0.65rem' }} />
				<Chip
					label={driver.vehicleType}
					size="small"
					variant="outlined"
					sx={{ fontSize: '0.65rem' }}
					icon={<FuseSvgIcon size={12}>heroicons-outline:truck</FuseSvgIcon>}
				/>
			</div>

			{/* Fraud Score Gauge */}
			<div className="flex justify-center my-2">
				<div className="relative">
					<RadialBarChart
						width={140}
						height={80}
						cx={70}
						cy={70}
						innerRadius={50}
						outerRadius={65}
						startAngle={180}
						endAngle={0}
						barSize={12}
						data={gaugeData}
					>
						<PolarAngleAxis
							type="number"
							domain={[0, 100]}
							angleAxisId={0}
							tick={false}
						/>
						<RadialBar
							dataKey="value"
							cornerRadius={6}
							background={{ fill: '#e0e0e0' }}
						/>
					</RadialBarChart>
					<div
						className="absolute flex flex-col items-center"
						style={{ left: '50%', top: 45, transform: 'translateX(-50%)' }}
					>
						<Typography variant="h5" className="font-bold" sx={{ color: scoreColor, lineHeight: 1 }}>
							{driver.fraudScore}
						</Typography>
						<Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
							Fraud Score
						</Typography>
					</div>
				</div>
			</div>

			{/* Status */}
			<div className="flex justify-center mb-2">
				<Chip
					label={driver.status.replace(/_/g, ' ')}
					size="small"
					color={STATUS_CHIP_COLOR[driver.status]}
					variant="filled"
					sx={{ fontWeight: 600, fontSize: '0.7rem' }}
				/>
			</div>

			{/* Stats grid */}
			<div className="grid grid-cols-2 gap-1">
				<StatBox label="Total Shifts" value={String(driver.totalShifts)} />
				<StatBox label="Flagged" value={String(driver.flaggedShifts)} alert={driver.flaggedShifts > 0} />
				<StatBox label="Complaint Rate" value={`${(driver.customerComplaintRate * 100).toFixed(1)}%`} alert={driver.customerComplaintRate > 0.2} />
				<StatBox label="On-Time" value={`${(driver.onTimeRate * 100).toFixed(1)}%`} alert={driver.onTimeRate < 0.7} />
				<StatBox label="Completed" value={String(driver.deliveriesCompleted)} />
				<StatBox label="Attempted" value={String(driver.deliveriesAttempted)} />
				<StatBox label="Rate" value={`$${driver.hourlyRate}/hr`} />
				<StatBox label="Earnings" value={`$${Math.round(driver.totalEarnings).toLocaleString()}`} />
			</div>

			{driver.lastFlaggedDate && (
				<div className="mt-2 flex items-center gap-1">
					<FuseSvgIcon size={12} color="error">heroicons-outline:exclamation-triangle</FuseSvgIcon>
					<Typography variant="caption" color="error">
						Last flagged: {new Date(driver.lastFlaggedDate).toLocaleDateString()}
					</Typography>
				</div>
			)}
		</Paper>
	);
}

function StatBox({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
	return (
		<Paper
			className="p-2 text-center"
			elevation={0}
			sx={{
				backgroundColor: alert ? 'rgba(244,67,54,0.06)' : 'background.default',
				border: '1px solid',
				borderColor: alert ? 'error.light' : 'divider',
			}}
		>
			<Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }} display="block">
				{label}
			</Typography>
			<Typography variant="body2" className="font-semibold" sx={{ color: alert ? 'error.main' : 'text.primary', fontSize: '0.8rem' }}>
				{value}
			</Typography>
		</Paper>
	);
}

export default DriverInvestigationPage;
