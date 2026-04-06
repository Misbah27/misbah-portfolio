'use client';

import { useState, useEffect, useCallback } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { Rolling21Data, FcId } from './types';

interface ForecastResult {
	health: 'HEALTHY' | 'AT_RISK' | 'CRITICAL';
	topConcern: string;
	recommendation: string;
}

const HEALTH_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
	HEALTHY: { bg: 'rgba(46,125,50,0.06)', border: 'rgba(46,125,50,0.3)', text: '#2e7d32', label: 'Healthy' },
	AT_RISK: { bg: 'rgba(237,108,2,0.06)', border: 'rgba(237,108,2,0.3)', text: '#ed6c02', label: 'At Risk' },
	CRITICAL: { bg: 'rgba(211,47,47,0.06)', border: 'rgba(211,47,47,0.3)', text: '#d32f2f', label: 'Critical' },
};

interface ForecastSummaryProps {
	data: Rolling21Data;
	selectedFcs: FcId[];
}

/**
 * AI-Enhanced Capacity Intel panel that auto-loads on mount.
 * Shows overall health, top concern, and recommendation.
 */
function ForecastSummary({ data, selectedFcs }: ForecastSummaryProps) {
	const [loading, setLoading] = useState(true);
	const [result, setResult] = useState<ForecastResult | null>(null);
	const [error, setError] = useState(false);
	const [responseTime, setResponseTime] = useState<number | null>(null);

	const fetchForecast = useCallback(async () => {
		setLoading(true);
		setError(false);
		const start = Date.now();

		try {
			const rollingData: Record<string, unknown[]> = {};
			selectedFcs.forEach((fc) => {
				if (data[fc]) rollingData[fc] = data[fc];
			});

			const res = await fetch('/api/freightlens/forecast-summary', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ rollingData, selectedFCs: selectedFcs }),
			});

			if (!res.ok) throw new Error('Failed');
			const json = await res.json();
			setResult(json);
			setResponseTime(Date.now() - start);
		} catch {
			setError(true);
		} finally {
			setLoading(false);
		}
	}, [data, selectedFcs]);

	// Auto-load on mount
	useEffect(() => {
		fetchForecast();
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const colors = result ? HEALTH_COLORS[result.health] || HEALTH_COLORS.HEALTHY : HEALTH_COLORS.HEALTHY;

	return (
		<Paper
			variant="outlined"
			sx={{
				p: 2,
				mb: 2,
				backgroundColor: result ? colors.bg : undefined,
				borderColor: result ? colors.border : undefined,
			}}
		>
			<Box className="flex items-center justify-between mb-1">
				<Box className="flex items-center gap-2">
					<Chip
						icon={<AutoAwesomeIcon />}
						label="AI-Enhanced"
						size="small"
						color="secondary"
						variant="outlined"
					/>
					<Typography variant="subtitle2" className="font-bold">
						Capacity Intel
					</Typography>
				</Box>
				<IconButton size="small" onClick={fetchForecast} disabled={loading} title="Refresh">
					<RefreshIcon sx={{ fontSize: 16 }} />
				</IconButton>
			</Box>

			{loading && (
				<Box>
					<Skeleton variant="text" width="30%" height={28} />
					<Skeleton variant="text" width="100%" />
					<Skeleton variant="text" width="80%" />
				</Box>
			)}

			{error && !loading && (
				<Box className="flex items-center gap-2">
					<Typography variant="body2" color="error">
						Failed to load forecast
					</Typography>
					<Button size="small" variant="outlined" onClick={fetchForecast}>
						Retry
					</Button>
				</Box>
			)}

			{result && !loading && (
				<Box>
					<Box className="flex items-center gap-2 mb-1">
						<Chip
							label={colors.label}
							size="small"
							sx={{
								backgroundColor: colors.text,
								color: '#fff',
								fontWeight: 700,
								fontSize: '0.7rem',
							}}
						/>
						{responseTime !== null && (
							<Typography variant="caption" color="text.secondary">
								{(responseTime / 1000).toFixed(1)}s
							</Typography>
						)}
					</Box>
					<Typography variant="body2" sx={{ fontSize: '0.8rem', mb: 0.5 }}>
						<strong>Concern:</strong> {result.topConcern}
					</Typography>
					<Typography variant="body2" sx={{ fontSize: '0.8rem' }} color="text.secondary">
						<strong>Recommendation:</strong> {result.recommendation}
					</Typography>
				</Box>
			)}
		</Paper>
	);
}

export default ForecastSummary;
