'use client';

import { useState, useEffect, useCallback } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { motion } from 'motion/react';
import type { DelayAlert } from '../types';

interface DelayIntelligenceBriefProps {
	alerts: DelayAlert[];
}

interface BriefResult {
	criticalCorridor: string;
	criticalCorridorImpact: string;
	topDelayReason: string;
	delayedCount: number;
	avgDelayHours: string;
	nocActions: string[];
}

/**
 * AI-Enhanced Delay Intelligence Brief — auto-loads when Delay Alert page mounts.
 * Supports server-side caching with forceRefresh bypass and 408 timeout handling.
 */
function DelayIntelligenceBrief({ alerts }: DelayIntelligenceBriefProps) {
	const [brief, setBrief] = useState<BriefResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | false>(false);
	const [generatedAt, setGeneratedAt] = useState('');
	const [responseTime, setResponseTime] = useState(0);
	const [isCached, setIsCached] = useState(false);
	const [cachedAt, setCachedAt] = useState<number | null>(null);

	const fetchBrief = useCallback(async (forceRefresh = false) => {
		setLoading(true);
		setError(false);
		const start = Date.now();
		try {
			const res = await fetch('/api/nova/delay-brief', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ vehicles: alerts, forceRefresh }),
			});
			if (res.status === 408) {
				setError('Request timed out — try again in a moment');
				return;
			}
			if (!res.ok) throw new Error('API error');
			const data = await res.json();
			setBrief(data.result);
			setResponseTime(Date.now() - start);
			setGeneratedAt(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

			if (data.cached) {
				setIsCached(true);
				setCachedAt(Date.now());
			} else {
				setIsCached(false);
				setCachedAt(null);
			}
		} catch {
			setError('Failed to generate delay intelligence brief');
		} finally {
			setLoading(false);
		}
	}, [alerts]);

	useEffect(() => {
		if (alerts.length > 0) {
			fetchBrief();
		}
	}, []);  // eslint-disable-line react-hooks/exhaustive-deps

	const getCachedAgoText = (): string => {
		if (!cachedAt) return '';
		const mins = Math.round((Date.now() - cachedAt) / 60000);
		if (mins < 1) return 'Cached just now';
		return `Cached ${mins} min${mins === 1 ? '' : 's'} ago`;
	};

	if (loading) {
		return (
			<Paper variant="outlined" className="p-4">
				<div className="flex items-center gap-2 mb-3">
					<Skeleton variant="circular" width={24} height={24} />
					<Skeleton variant="text" width={200} />
				</div>
				<Skeleton variant="rectangular" height={60} sx={{ borderRadius: 1, mb: 1 }} />
				<Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
			</Paper>
		);
	}

	if (error) {
		return (
			<Paper variant="outlined" className="p-4 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<FuseSvgIcon size={20} sx={{ color: '#ef4444' }}>heroicons-outline:exclamation-triangle</FuseSvgIcon>
					<Typography variant="body2" color="text.secondary">
						{typeof error === 'string' ? error : 'Failed to generate delay intelligence brief'}
					</Typography>
				</div>
				<Button size="small" onClick={() => fetchBrief(true)} startIcon={<FuseSvgIcon size={16}>heroicons-outline:arrow-path</FuseSvgIcon>} sx={{ textTransform: 'none' }}>
					Retry
				</Button>
			</Paper>
		);
	}

	if (!brief) return null;

	return (
		<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
			<Paper variant="outlined" className="p-4" sx={{ borderColor: 'secondary.main', borderWidth: 1 }}>
				<div className="flex items-center justify-between mb-3">
					<div className="flex items-center gap-2">
						<Chip icon={<AutoAwesomeIcon />} label="AI-Enhanced" size="small" color="secondary" variant="outlined" />
						<Typography variant="subtitle2" className="font-bold">Delay Intelligence</Typography>
					</div>
					<div className="flex items-center gap-2">
						<Typography variant="caption" color="text.secondary">
							Generated at {generatedAt} ({(responseTime / 1000).toFixed(1)}s)
							{isCached && (
								<>
									{' '}&middot; {getCachedAgoText()}
								</>
							)}
						</Typography>
						<Button
							size="small"
							onClick={() => fetchBrief(true)}
							sx={{ minWidth: 0, p: 0.5 }}
							title={isCached ? 'Refresh (bypass cache)' : 'Refresh'}
						>
							<FuseSvgIcon size={16}>heroicons-outline:arrow-path</FuseSvgIcon>
						</Button>
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
					<Paper variant="outlined" className="p-3" sx={{ bgcolor: '#fef2f2' }}>
						<Typography variant="caption" color="text.secondary">Critical Corridor</Typography>
						<Typography variant="body2" className="font-semibold">{brief.criticalCorridor}</Typography>
						<Typography variant="caption" color="text.secondary">{brief.criticalCorridorImpact}</Typography>
					</Paper>
					<Paper variant="outlined" className="p-3" sx={{ bgcolor: '#fefce8' }}>
						<Typography variant="caption" color="text.secondary">Top Delay Reason</Typography>
						<Typography variant="body2" className="font-semibold">{brief.topDelayReason}</Typography>
					</Paper>
					<Paper variant="outlined" className="p-3" sx={{ bgcolor: '#eff6ff' }}>
						<Typography variant="caption" color="text.secondary">Delayed / Avg Hours</Typography>
						<Typography variant="body2" className="font-semibold">{brief.delayedCount} vehicles / {brief.avgDelayHours}h avg</Typography>
					</Paper>
				</div>

				<Typography variant="caption" className="font-semibold mb-1 block">NOC Actions:</Typography>
				<div className="flex flex-col gap-1">
					{brief.nocActions.map((action, i) => (
						<div key={i} className="flex items-start gap-2">
							<FuseSvgIcon size={14} sx={{ mt: 0.3, color: '#10b981' }}>heroicons-outline:check-circle</FuseSvgIcon>
							<Typography variant="caption">{action}</Typography>
						</div>
					))}
				</div>
			</Paper>
		</motion.div>
	);
}

export default DelayIntelligenceBrief;
