'use client';

import { useState, useCallback } from 'react';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import type { DelayAlert } from '../types';

interface NlDelayFilterProps {
	alerts: DelayAlert[];
	onFilter: (vrids: string[] | null) => void;
}

/**
 * Natural language delay query bar with AI-powered filtering.
 */
function NlDelayFilter({ alerts, onFilter }: NlDelayFilterProps) {
	const [query, setQuery] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(false);
	const [explanation, setExplanation] = useState<string | null>(null);
	const [matchCount, setMatchCount] = useState<number | null>(null);
	const [responseTime, setResponseTime] = useState(0);

	const handleSubmit = useCallback(async () => {
		if (!query.trim()) {
			onFilter(null);
			setExplanation(null);
			setMatchCount(null);
			return;
		}
		setLoading(true);
		setError(false);
		const start = Date.now();
		try {
			const res = await fetch('/api/nova/nl-filter', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query, vehicles: alerts }),
			});
			if (!res.ok) throw new Error('API error');
			const data = await res.json();
			const vrids: string[] = data.result.matchingVrids ?? [];
			onFilter(vrids);
			setExplanation(data.result.explanation ?? null);
			setMatchCount(vrids.length);
			setResponseTime(Date.now() - start);
		} catch {
			setError(true);
		} finally {
			setLoading(false);
		}
	}, [query, alerts, onFilter]);

	const handleClear = useCallback(() => {
		setQuery('');
		onFilter(null);
		setExplanation(null);
		setMatchCount(null);
		setError(false);
	}, [onFilter]);

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center gap-2">
				<Chip icon={<AutoAwesomeIcon />} label="AI-Enhanced" size="small" color="secondary" variant="outlined" />
				<Typography variant="caption" color="text.secondary">Natural Language Query</Typography>
			</div>
			<div className="flex gap-2">
				<TextField
					size="small"
					placeholder='e.g. "Show North zone vehicles delayed 8+ hours with high EDD"'
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
					fullWidth
					slotProps={{
						input: {
							startAdornment: (
								<InputAdornment position="start">
									<FuseSvgIcon size={18}>heroicons-outline:sparkles</FuseSvgIcon>
								</InputAdornment>
							),
							endAdornment: loading ? (
								<InputAdornment position="end"><CircularProgress size={18} /></InputAdornment>
							) : undefined,
						},
					}}
				/>
				<Button size="small" variant="contained" onClick={handleSubmit} disabled={loading} sx={{ textTransform: 'none', minWidth: 80 }}>
					Query
				</Button>
				{(explanation || error) && (
					<Button size="small" variant="outlined" onClick={handleClear} sx={{ textTransform: 'none' }}>
						Clear
					</Button>
				)}
			</div>

			{error && (
				<Paper variant="outlined" className="p-2 flex items-center gap-2" sx={{ borderColor: '#ef4444' }}>
					<FuseSvgIcon size={16} sx={{ color: '#ef4444' }}>heroicons-outline:exclamation-triangle</FuseSvgIcon>
					<Typography variant="caption" color="error">Query failed</Typography>
					<Button size="small" onClick={handleSubmit} sx={{ ml: 'auto', textTransform: 'none' }}>Retry</Button>
				</Paper>
			)}

			{explanation && (
				<Paper variant="outlined" className="p-2 flex items-center gap-2">
					<FuseSvgIcon size={16} sx={{ color: '#10b981' }}>heroicons-outline:check-circle</FuseSvgIcon>
					<Typography variant="caption">
						{matchCount} match{matchCount !== 1 ? 'es' : ''} ({(responseTime / 1000).toFixed(1)}s) — {explanation}
					</Typography>
				</Paper>
			)}
		</div>
	);
}

export default NlDelayFilter;
