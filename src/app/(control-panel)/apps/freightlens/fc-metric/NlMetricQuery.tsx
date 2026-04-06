'use client';

import { useState, useCallback } from 'react';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import InputAdornment from '@mui/material/InputAdornment';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SendIcon from '@mui/icons-material/Send';
import type { FcMetricsData, FcId } from '../types';

interface NlMetricQueryProps {
	data: FcMetricsData;
	selectedFc: FcId;
	onHighlight: (fcs: string[]) => void;
}

/**
 * Natural language query input for FC Metric page.
 * Sends query to LLM, returns highlighted FCs and explanation.
 */
function NlMetricQuery({ data, selectedFc, onHighlight }: NlMetricQueryProps) {
	const [query, setQuery] = useState('');
	const [loading, setLoading] = useState(false);
	const [explanation, setExplanation] = useState<string | null>(null);
	const [highlightedFCs, setHighlightedFCs] = useState<string[]>([]);
	const [error, setError] = useState(false);
	const [responseTime, setResponseTime] = useState<number | null>(null);

	const handleQuery = useCallback(async () => {
		if (!query.trim()) return;
		setLoading(true);
		setError(false);
		const start = Date.now();

		try {
			const res = await fetch('/api/freightlens/nl-query', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query: query.trim(), metricsData: data, selectedFc }),
			});

			if (!res.ok) throw new Error('Failed');
			const json = await res.json();
			setHighlightedFCs(json.highlightedFCs || []);
			setExplanation(json.explanation || '');
			setResponseTime(Date.now() - start);
			onHighlight(json.highlightedFCs || []);
		} catch {
			setError(true);
		} finally {
			setLoading(false);
		}
	}, [query, data, selectedFc, onHighlight]);

	const handleClear = () => {
		setQuery('');
		setExplanation(null);
		setHighlightedFCs([]);
		setError(false);
		setResponseTime(null);
		onHighlight([]);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') handleQuery();
	};

	return (
		<Paper variant="outlined" className="p-3 mb-3">
			<Box className="flex items-center gap-2 mb-2">
				<Chip
					icon={<AutoAwesomeIcon />}
					label="AI-Enhanced"
					size="small"
					color="secondary"
					variant="outlined"
				/>
				<Typography variant="subtitle2" className="font-semibold">
					Natural Language Query
				</Typography>
			</Box>

			<Box className="flex items-center gap-2">
				<TextField
					size="small"
					fullWidth
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="e.g. Which FCs are over capacity next week?"
					disabled={loading}
					slotProps={{
						input: {
							startAdornment: (
								<InputAdornment position="start">
									<AutoAwesomeIcon fontSize="small" color="secondary" />
								</InputAdornment>
							),
						},
					}}
				/>
				<Button
					size="small"
					variant="contained"
					onClick={handleQuery}
					disabled={loading || !query.trim()}
					endIcon={<SendIcon />}
				>
					Ask
				</Button>
				{(explanation || highlightedFCs.length > 0) && (
					<Button size="small" variant="outlined" onClick={handleClear}>
						Clear
					</Button>
				)}
			</Box>

			{loading && (
				<Box className="mt-2">
					<Skeleton variant="text" width="100%" />
					<Skeleton variant="text" width="70%" />
				</Box>
			)}

			{error && !loading && (
				<Box className="mt-2 flex items-center gap-2">
					<Typography variant="body2" color="error">
						Query failed
					</Typography>
					<Button size="small" variant="outlined" onClick={handleQuery}>
						Retry
					</Button>
				</Box>
			)}

			{explanation && !loading && (
				<Box className="mt-2">
					<Box className="flex items-center gap-2 mb-1 flex-wrap">
						{highlightedFCs.map((fc) => (
							<Chip key={fc} label={fc} size="small" color="primary" variant="filled" />
						))}
						{responseTime !== null && (
							<Typography variant="caption" color="text.secondary">
								{(responseTime / 1000).toFixed(1)}s
							</Typography>
						)}
					</Box>
					<Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
						{explanation}
					</Typography>
				</Box>
			)}
		</Paper>
	);
}

export default NlMetricQuery;
