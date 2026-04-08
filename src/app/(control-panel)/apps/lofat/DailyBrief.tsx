'use client';

import { useState, useEffect, useCallback } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { motion } from 'motion/react';
import type { Driver, ShiftMetric } from './types';

interface DailyBriefProps {
	drivers: Driver[];
	metrics: ShiftMetric[];
}

const itemVariants = {
	hidden: { opacity: 0, y: 12 },
	show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

/**
 * Intelligence Brief — auto-loads on dashboard mount, shows 4 bullet points.
 */
function DailyBrief({ drivers, metrics }: DailyBriefProps) {
	const [briefText, setBriefText] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const [generatedAt, setGeneratedAt] = useState('');

	const fetchBrief = useCallback(async () => {
		setLoading(true);
		setError(false);
		try {
			const res = await fetch('/api/lofat/daily-brief', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					drivers,
					shiftMetrics: metrics,
					date: new Date().toISOString().slice(0, 10),
				}),
			});
			const data = await res.json();
			if (data.error) {
				setError(true);
				setBriefText('');
			} else {
				setBriefText(data.result);
				setGeneratedAt(
					new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
				);
			}
		} catch {
			setError(true);
		} finally {
			setLoading(false);
		}
	}, [drivers, metrics]);

	useEffect(() => {
		if (drivers.length > 0 && metrics.length > 0) {
			fetchBrief();
		}
	}, [drivers.length, metrics.length, fetchBrief]);

	return (
		<motion.div variants={itemVariants} className="mb-2">
			<Paper
				className="p-3"
				elevation={0}
				variant="outlined"
				sx={{ borderLeft: '3px solid', borderLeftColor: 'secondary.main' }}
			>
				<div className="flex items-center gap-2 mb-2">
					<FuseSvgIcon size={18} color="secondary">heroicons-outline:light-bulb</FuseSvgIcon>
					<Typography variant="subtitle2" className="font-semibold">Intelligence Brief</Typography>
					<Chip icon={<AutoAwesomeIcon />} label="AI-Enhanced" size="small" color="secondary" variant="outlined" sx={{ height: 20, fontSize: '0.6rem' }} />
					{generatedAt && (
						<Typography variant="caption" color="text.secondary" className="ml-auto">
							Generated at {generatedAt}
						</Typography>
					)}
				</div>

				{loading && (
					<div className="space-y-1">
						<Skeleton variant="text" width="85%" height={18} />
						<Skeleton variant="text" width="92%" height={18} />
						<Skeleton variant="text" width="78%" height={18} />
						<Skeleton variant="text" width="88%" height={18} />
					</div>
				)}

				{error && !loading && (
					<div className="flex items-center gap-2">
						<Typography variant="body2" color="text.secondary">
							Brief unavailable — LLM service temporarily unreachable.
						</Typography>
						<Button size="small" onClick={fetchBrief} sx={{ textTransform: 'none', fontSize: '0.7rem' }}>
							Retry
						</Button>
					</div>
				)}

				{!loading && !error && briefText && (
					<Typography variant="body2" sx={{ fontSize: '0.8rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
						{briefText}
					</Typography>
				)}
			</Paper>
		</motion.div>
	);
}

export default DailyBrief;
