'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import FusePageSimple from '@fuse/core/FusePageSimple';
import { styled } from '@mui/material/styles';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { motion } from 'motion/react';
import LoFATHeader from './LoFATHeader';
import LoFATSkeleton from './LoFATSkeleton';
import SummaryCards from './SummaryCards';
import DriverTable from './DriverTable';
import DailyBrief from './DailyBrief';
import NlSearchBar from './NlSearchBar';
import type { Driver, ShiftMetric } from './types';
import { PATTERN_LABELS, FRAUD_PATTERNS } from './types';

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

const ZONE_TABS = ['All', 'Seattle', 'Chicago', 'Los Angeles'];

const containerVariants = {
	hidden: {},
	show: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
	hidden: { opacity: 0, y: 12 },
	show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

/**
 * LoFAT Live Monitoring Dashboard — real-time fraud detection overview
 * with zone tabs, pattern filter chips, summary cards, and driver table.
 */
function LoFATPage() {
	const [drivers, setDrivers] = useState<Driver[]>([]);
	const [metrics, setMetrics] = useState<ShiftMetric[]>([]);
	const [loading, setLoading] = useState(true);
	const [lastUpdated, setLastUpdated] = useState('');
	const [autoRefresh, setAutoRefresh] = useState(false);
	const [selectedZone, setSelectedZone] = useState(0);
	const [selectedPattern, setSelectedPattern] = useState<string>('All');
	const [nlFilterIds, setNlFilterIds] = useState<string[] | null>(null);
	const refreshTimer = useRef<NodeJS.Timeout | null>(null);

	const updateTimestamp = useCallback(() => {
		setLastUpdated(
			new Date().toLocaleString('en-GB', {
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				hour12: false,
			})
		);
	}, []);

	const loadData = useCallback(async () => {
		try {
			const [driverMod, metricsMod] = await Promise.all([
				import('@/data/lofat/drivers.json'),
				import('@/data/lofat/shiftMetrics.json'),
			]);
			setDrivers(driverMod.default as Driver[]);
			setMetrics(metricsMod.default as ShiftMetric[]);
			updateTimestamp();
		} catch {
			setDrivers([]);
			setMetrics([]);
		} finally {
			setLoading(false);
		}
	}, [updateTimestamp]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	useEffect(() => {
		if (autoRefresh) {
			refreshTimer.current = setInterval(() => {
				updateTimestamp();
			}, 5000);
		} else if (refreshTimer.current) {
			clearInterval(refreshTimer.current);
			refreshTimer.current = null;
		}
		return () => {
			if (refreshTimer.current) clearInterval(refreshTimer.current);
		};
	}, [autoRefresh, updateTimestamp]);

	const todayMetrics = metrics.length > 0 ? metrics[metrics.length - 1] : null;

	return (
		<Root
			scroll="content"
			header={
				<LoFATHeader
					lastUpdated={lastUpdated}
					autoRefresh={autoRefresh}
					onAutoRefreshChange={setAutoRefresh}
				/>
			}
			content={
				<div className="w-full p-3 sm:p-4">
					{loading ? (
						<LoFATSkeleton />
					) : (
						<motion.div
							variants={containerVariants}
							initial="hidden"
							animate="show"
						>
							{/* Daily Intelligence Brief */}
							<DailyBrief drivers={drivers} metrics={metrics} />

							<SummaryCards
								drivers={drivers}
								todayMetrics={todayMetrics}
							/>

							{/* NL Search */}
							<motion.div variants={itemVariants}>
								<NlSearchBar drivers={drivers} onFilter={setNlFilterIds} />
							</motion.div>

							{/* Zone tabs */}
							<motion.div variants={itemVariants}>
								<Tabs
									value={selectedZone}
									onChange={(_, v) => setSelectedZone(v)}
									sx={{
										minHeight: 36,
										mb: 1,
										'& .MuiTab-root': { minHeight: 36, py: 0, textTransform: 'none' },
									}}
								>
									{ZONE_TABS.map((z) => (
										<Tab
											key={z}
											label={z}
											sx={{ fontSize: '0.8rem' }}
										/>
									))}
								</Tabs>
							</motion.div>

							{/* Pattern filter chips */}
							<motion.div
								className="flex flex-wrap gap-1 mb-2"
								variants={itemVariants}
							>
								<Chip
									label="All Patterns"
									size="small"
									variant={selectedPattern === 'All' ? 'filled' : 'outlined'}
									color={selectedPattern === 'All' ? 'primary' : 'default'}
									onClick={() => setSelectedPattern('All')}
									icon={
										<FuseSvgIcon size={14}>heroicons-outline:funnel</FuseSvgIcon>
									}
									sx={{ fontSize: '0.7rem' }}
								/>
								{FRAUD_PATTERNS.map((p) => (
									<Chip
										key={p}
										label={PATTERN_LABELS[p]}
										size="small"
										variant={selectedPattern === p ? 'filled' : 'outlined'}
										color={selectedPattern === p ? 'warning' : 'default'}
										onClick={() =>
											setSelectedPattern(selectedPattern === p ? 'All' : p)
										}
										sx={{ fontSize: '0.7rem' }}
									/>
								))}
							</motion.div>

							{/* Driver table */}
							<motion.div variants={itemVariants}>
								<DriverTable
									drivers={drivers}
									selectedZone={ZONE_TABS[selectedZone]}
									selectedPattern={selectedPattern}
									nlFilterIds={nlFilterIds}
								/>
							</motion.div>
						</motion.div>
					)}
				</div>
			}
		/>
	);
}

export default LoFATPage;
