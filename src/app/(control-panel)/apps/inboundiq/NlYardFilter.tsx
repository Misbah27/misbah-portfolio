'use client';

import { useState } from 'react';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';
import type { Truck } from './types';

interface NlYardFilterProps {
	yardTrucks: Truck[];
	onFilter: (matchingVrids: string[] | null, query: string) => void;
	activeQuery: string | null;
	matchCount: number;
	totalCount: number;
}

/**
 * Natural Language Yard Filter — text input that calls the LLM to filter trucks by query.
 */
function NlYardFilter({ yardTrucks, onFilter, activeQuery, matchCount, totalCount }: NlYardFilterProps) {
	const [query, setQuery] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(false);
	const [responseTime, setResponseTime] = useState<number | null>(null);

	const handleSubmit = async () => {
		if (!query.trim()) return;
		setLoading(true);
		setError(false);
		const start = Date.now();

		try {
			const res = await fetch('/api/inboundiq/nl-filter', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					query: query.trim(),
					yardTrucks: yardTrucks.map((t) => ({
						isaVrid: t.isaVrid,
						vehicleNo: t.vehicleNo,
						apptType: t.apptType,
						lowInstockPct: t.lowInstockPct,
						dwellHours: t.dwellHours,
						arrivalStatus: t.arrivalStatus,
						units: t.units,
						rank: t.rank,
						sidelineRemarks: t.sidelineRemarks,
					})),
				}),
			});

			if (!res.ok) throw new Error('Failed');
			const data = await res.json();
			setResponseTime(Date.now() - start);
			onFilter(data.result, query.trim());
		} catch {
			setError(true);
		} finally {
			setLoading(false);
		}
	};

	const handleClear = () => {
		setQuery('');
		setResponseTime(null);
		onFilter(null, '');
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') handleSubmit();
	};

	return (
		<Box className="flex flex-col gap-1">
			<Box className="flex items-center gap-2">
				<TextField
					size="small"
					placeholder='e.g. show HOT trucks with instock below 20%, or trucks dwelling over 12 hours'
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onKeyDown={handleKeyDown}
					disabled={loading}
					sx={{ minWidth: 420, flex: 1 }}
					slotProps={{
						input: {
							startAdornment: (
								<InputAdornment position="start">
									<AutoAwesomeIcon fontSize="small" sx={{ color: 'primary.main' }} />
								</InputAdornment>
							),
							endAdornment: activeQuery ? (
								<InputAdornment position="end">
									<IconButton size="small" onClick={handleClear}>
										<CloseIcon fontSize="small" />
									</IconButton>
								</InputAdornment>
							) : undefined,
						},
					}}
				/>
				<Button
					size="small"
					variant="contained"
					onClick={handleSubmit}
					disabled={loading || !query.trim()}
					startIcon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
				>
					{loading ? 'Filtering...' : 'AI Filter ✦'}
				</Button>
			</Box>

			{loading && <Skeleton variant="text" width={200} height={20} />}

			{error && (
				<Box className="flex items-center gap-2">
					<Typography variant="caption" color="error">
						Filter failed
					</Typography>
					<Button size="small" onClick={handleSubmit}>
						Retry
					</Button>
				</Box>
			)}

			{activeQuery && !loading && (
				<Box className="flex items-center gap-2">
					<Typography variant="caption" color="text.secondary">
						AI-Enhanced ✦ Showing {matchCount} of {totalCount} trucks matching: &quot;{activeQuery}&quot;
					</Typography>
					{responseTime !== null && (
						<Typography variant="caption" color="text.secondary">
							({(responseTime / 1000).toFixed(1)}s)
						</Typography>
					)}
					<Button size="small" onClick={handleClear}>
						Clear
					</Button>
				</Box>
			)}
		</Box>
	);
}

export default NlYardFilter;
