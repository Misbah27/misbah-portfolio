'use client';

import { useMemo } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { motion } from 'motion/react';
import type { DelayAlert } from '../types';

interface SummaryCardsProps {
	alerts: DelayAlert[];
}

const containerVariants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
	hidden: { opacity: 0, y: 12 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const CARDS = [
	{ label: 'Total Unique Delayed Vehicles', icon: 'heroicons-outline:truck', color: '#ef4444' },
	{ label: 'Vehicles with >4hrs Delay', icon: 'heroicons-outline:clock', color: '#f59e0b' },
	{ label: 'Vehicles Today EDD>20', icon: 'heroicons-outline:calendar', color: '#3b82f6' },
	{ label: 'Vehicles Tomorrow EDD>20', icon: 'heroicons-outline:calendar-days', color: '#8b5cf6' },
] as const;

/**
 * Four summary metric cards for delay alert overview.
 */
function SummaryCards({ alerts }: SummaryCardsProps) {
	const counts = useMemo(() => [
		alerts.filter((a) => a.delayHours > 0).length,
		alerts.filter((a) => a.delayHours > 4).length,
		alerts.filter((a) => a.eddToday > 20).length,
		alerts.filter((a) => a.eddTomorrow > 20).length,
	], [alerts]);

	return (
		<motion.div
			className="grid grid-cols-2 sm:grid-cols-4 gap-6"
			variants={containerVariants}
			initial="hidden"
			animate="visible"
		>
			{CARDS.map((card, i) => (
				<motion.div key={card.label} variants={itemVariants}>
					<Paper variant="outlined" className="p-4">
						<div className="flex items-center gap-2 mb-2">
							<FuseSvgIcon size={20} sx={{ color: card.color }}>
								{card.icon}
							</FuseSvgIcon>
							<Typography variant="caption" color="text.secondary" className="leading-tight">
								{card.label}
							</Typography>
						</div>
						<Typography className="text-2xl font-bold" sx={{ color: card.color }}>
							{counts[i]}
						</Typography>
					</Paper>
				</motion.div>
			))}
		</motion.div>
	);
}

export default SummaryCards;
