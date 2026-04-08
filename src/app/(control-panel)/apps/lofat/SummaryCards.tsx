'use client';

import { memo, useEffect, useState } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { motion } from 'motion/react';
import type { Driver, ShiftMetric } from './types';

interface SummaryCardsProps {
	drivers: Driver[];
	todayMetrics: ShiftMetric | null;
}

const containerVariants = {
	hidden: {},
	show: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
	hidden: { opacity: 0, y: 12 },
	show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

/** Animated count-up from 0 to target. */
function useCountUp(target: number, duration = 800): number {
	const [value, setValue] = useState(0);

	useEffect(() => {
		let start = 0;
		const step = target / (duration / 16);
		const timer = setInterval(() => {
			start += step;
			if (start >= target) {
				setValue(target);
				clearInterval(timer);
			} else {
				setValue(Math.floor(start));
			}
		}, 16);
		return () => clearInterval(timer);
	}, [target, duration]);

	return value;
}

interface CardProps {
	icon: string;
	label: string;
	value: number;
	format?: 'number' | 'currency';
	color?: string;
	badgeColor?: string;
}

function StatCard({ icon, label, value, format = 'number', color = 'text.primary', badgeColor }: CardProps) {
	const animated = useCountUp(value);
	const display = format === 'currency' ? `$${animated.toLocaleString()}` : animated.toLocaleString();

	return (
		<motion.div variants={itemVariants}>
			<Paper
				className="p-3 flex items-center gap-3"
				elevation={0}
				variant="outlined"
				sx={badgeColor ? { borderLeft: `3px solid ${badgeColor}` } : undefined}
			>
				<div
					className="flex items-center justify-center w-10 h-10 rounded-lg"
					style={{ backgroundColor: badgeColor ? `${badgeColor}15` : '#e3f2fd' }}
				>
					<FuseSvgIcon
						size={20}
						sx={{ color: badgeColor || '#2196f3' }}
					>
						{icon}
					</FuseSvgIcon>
				</div>
				<div>
					<Typography
						variant="caption"
						color="text.secondary"
						className="font-medium"
					>
						{label}
					</Typography>
					<Typography
						variant="h6"
						className="font-bold leading-tight"
						sx={{ color }}
					>
						{display}
					</Typography>
				</div>
			</Paper>
		</motion.div>
	);
}

/**
 * Four summary metric cards for the Live Monitoring Dashboard.
 */
function SummaryCards({ drivers, todayMetrics }: SummaryCardsProps) {
	const activeCount = drivers.filter((d) => d.status === 'ACTIVE').length;
	const flaggedCount = drivers.filter(
		(d) => d.status === 'FLAGGED' || d.status === 'UNDER_INVESTIGATION'
	).length;
	const alertsToday = todayMetrics?.totalFraudAlerts ?? 0;
	const lossPrevented = todayMetrics?.preventedAmount ?? 0;

	return (
		<motion.div
			className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-2"
			variants={containerVariants}
			initial="hidden"
			animate="show"
		>
			<StatCard
				icon="heroicons-outline:users"
				label="Active Drivers"
				value={activeCount}
				badgeColor="#2196f3"
			/>
			<StatCard
				icon="heroicons-outline:exclamation-triangle"
				label="Flagged This Shift"
				value={flaggedCount}
				badgeColor="#f44336"
			/>
			<StatCard
				icon="heroicons-outline:bell-alert"
				label="Fraud Alerts Today"
				value={alertsToday}
				badgeColor="#ff9800"
			/>
			<StatCard
				icon="heroicons-outline:currency-dollar"
				label="Loss Prevented Today"
				value={lossPrevented}
				format="currency"
				badgeColor="#4caf50"
			/>
		</motion.div>
	);
}

export default memo(SummaryCards);
