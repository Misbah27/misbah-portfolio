'use client';

import { useState, useCallback } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import type { RescueRecord } from '../../types';

interface AiRecommendPanelProps {
	rescue: RescueRecord;
}

interface RecommendResult {
	recommendation: string;
	confidence: number;
	reasoning: string;
}

const REC_COLORS: Record<string, { bg: string; color: string }> = {
	RESCUE: { bg: '#e8f5e9', color: '#2e7d32' },
	DROP: { bg: '#ffebee', color: '#c62828' },
	MERGE: { bg: '#fff8e1', color: '#f57f17' },
};

/**
 * Per-row AI recommendation panel for rescue lanes.
 */
function AiRecommendPanel({ rescue }: AiRecommendPanelProps) {
	const [result, setResult] = useState<RecommendResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(false);
	const [responseTime, setResponseTime] = useState(0);

	const fetchRecommendation = useCallback(async () => {
		setLoading(true);
		setError(false);
		const start = Date.now();
		try {
			const res = await fetch('/api/nova/rescue-recommend', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					odPair: rescue.odPair,
					delayHours: rescue.rescueDate,
					eddCount: rescue.eddPackageCount,
					vehicleSize: rescue.vehicleSize,
					haulType: rescue.haulType,
				}),
			});
			if (!res.ok) throw new Error('API error');
			const data = await res.json();
			setResult(data.result);
			setResponseTime(Date.now() - start);
		} catch {
			setError(true);
		} finally {
			setLoading(false);
		}
	}, [rescue]);

	if (!result && !loading && !error) {
		return (
			<Button
				size="small"
				variant="outlined"
				color="secondary"
				onClick={fetchRecommendation}
				startIcon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
				sx={{ textTransform: 'none', fontSize: '0.7rem' }}
			>
				Get AI Recommendation
			</Button>
		);
	}

	if (loading) {
		return (
			<Paper variant="outlined" className="p-3 mt-1">
				<div className="flex items-center gap-2">
					<CircularProgress size={16} />
					<Skeleton variant="text" width={200} />
				</div>
			</Paper>
		);
	}

	if (error) {
		return (
			<Paper variant="outlined" className="p-2 mt-1 flex items-center gap-2" sx={{ borderColor: '#ef4444' }}>
				<FuseSvgIcon size={16} sx={{ color: '#ef4444' }}>heroicons-outline:exclamation-triangle</FuseSvgIcon>
				<Typography variant="caption" color="error">Recommendation failed</Typography>
				<Button size="small" onClick={fetchRecommendation} sx={{ textTransform: 'none', ml: 1 }}>Retry</Button>
			</Paper>
		);
	}

	if (!result) return null;
	const rc = REC_COLORS[result.recommendation] ?? { bg: '#f3f4f6', color: '#374151' };

	return (
		<Paper variant="outlined" className="p-3 mt-1" sx={{ borderColor: 'secondary.main' }}>
			<div className="flex items-center gap-2 mb-1">
				<Chip icon={<AutoAwesomeIcon />} label="AI-Enhanced" size="small" color="secondary" variant="outlined" />
				<Chip label={result.recommendation} size="small" sx={{ fontWeight: 600, bgcolor: rc.bg, color: rc.color, fontSize: '0.65rem', height: 22 }} />
				<Chip label={`${result.confidence}% confidence`} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 22 }} />
				<Typography variant="caption" color="text.secondary" className="ml-auto">{(responseTime / 1000).toFixed(1)}s</Typography>
			</div>
			<Typography variant="caption">{result.reasoning}</Typography>
		</Paper>
	);
}

export default AiRecommendPanel;
