'use client';

import { useState, useEffect, useCallback } from 'react';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Switch from '@mui/material/Switch';
import RefreshIcon from '@mui/icons-material/Refresh';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import type { Truck } from './types';

interface DockIntelligenceProps {
	yardQueue: Truck[];
	dockedTrucks: Truck[];
	fcId: string;
	totalDoors: number;
}

/**
 * AI-Enhanced Dock Intelligence panel — generates actionable recommendations
 * for the next 30 minutes of dock operations.
 */
function DockIntelligence({ yardQueue, dockedTrucks, fcId, totalDoors }: DockIntelligenceProps) {
	const [enabled, setEnabled] = useState(false);
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<string | null>(null);
	const [error, setError] = useState(false);
	const [responseTime, setResponseTime] = useState<number | null>(null);
	const [timestamp, setTimestamp] = useState<string | null>(null);

	const fetchIntel = useCallback(async () => {
		setLoading(true);
		setError(false);
		const start = Date.now();

		try {
			const res = await fetch('/api/inboundiq/dock-intelligence', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ yardQueue, dockedTrucks, fcId, totalDoors }),
			});

			if (!res.ok) throw new Error('Failed');
			const data = await res.json();
			setResult(data.result);
			setResponseTime(Date.now() - start);
			setTimestamp(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
		} catch {
			setError(true);
		} finally {
			setLoading(false);
		}
	}, [yardQueue, dockedTrucks, fcId, totalDoors]);

	// Re-generate when FC changes while enabled
	useEffect(() => {
		if (enabled) {
			fetchIntel();
		} else {
			setResult(null);
			setResponseTime(null);
			setTimestamp(null);
		}
	}, [enabled, fcId]); // eslint-disable-line react-hooks/exhaustive-deps

	const handleToggle = () => {
		setEnabled((prev) => !prev);
	};

	if (!enabled) {
		return (
			<Paper
				variant="outlined"
				sx={{
					p: 1.5,
					mt: 2,
					borderColor: 'divider',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
				}}
			>
				<Box className="flex items-center gap-1">
					<AutoAwesomeIcon sx={{ fontSize: 16, color: 'primary.main' }} />
					<Typography variant="caption" className="font-semibold">
						AI Dock Intel ✦
					</Typography>
				</Box>
				<Switch size="small" checked={enabled} onChange={handleToggle} />
			</Paper>
		);
	}

	return (
		<Paper
			variant="outlined"
			sx={{
				p: 2,
				mt: 2,
				backgroundColor: 'rgba(0, 150, 136, 0.06)',
				borderColor: 'rgba(0, 150, 136, 0.3)',
			}}
		>
			<Box className="flex items-center justify-between mb-2">
				<Box className="flex items-center gap-1">
					<AutoAwesomeIcon sx={{ fontSize: 16, color: '#009688' }} />
					<Typography variant="caption" className="font-bold" sx={{ color: '#009688' }}>
						AI-Enhanced ✦ Dock Intel
					</Typography>
				</Box>
				<Box className="flex items-center gap-1">
					<IconButton size="small" onClick={fetchIntel} disabled={loading} title="Refresh">
						<RefreshIcon sx={{ fontSize: 16 }} />
					</IconButton>
					<Switch size="small" checked={enabled} onChange={handleToggle} />
				</Box>
			</Box>

			{loading && (
				<Box>
					<Skeleton variant="text" width="100%" />
					<Skeleton variant="text" width="95%" />
					<Skeleton variant="text" width="85%" />
				</Box>
			)}

			{error && !loading && (
				<Box className="text-center py-2">
					<Typography variant="caption" color="error" className="block mb-1">
						Failed to generate recommendations
					</Typography>
					<Button size="small" variant="outlined" onClick={fetchIntel}>
						Retry
					</Button>
				</Box>
			)}

			{result && !loading && (
				<>
					<Typography
						variant="body2"
						sx={{ lineHeight: 1.6, whiteSpace: 'pre-line', fontSize: '0.8rem' }}
					>
						{result}
					</Typography>
					<Box className="flex items-center justify-between mt-2">
						{timestamp && (
							<Typography variant="caption" color="text.secondary">
								Generated at {timestamp}
							</Typography>
						)}
						{responseTime !== null && (
							<Typography variant="caption" color="text.secondary">
								{(responseTime / 1000).toFixed(1)}s
							</Typography>
						)}
					</Box>
				</>
			)}
		</Paper>
	);
}

export default DockIntelligence;
