'use client';

import { useState, memo } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import type { Driver } from './types';

interface NlSearchBarProps {
	drivers: Driver[];
	onFilter: (driverIds: string[] | null) => void;
}

const SUGGESTIONS = [
	'Order dodgers in Seattle scoring above 70',
	'Suspended drivers with GPS spoofing',
	'Cluster fraud flagged in last 7 days',
];

/**
 * Natural language search bar for the Live Monitoring Dashboard.
 * Calls /api/lofat/nl-search and returns matching driverIds.
 */
function NlSearchBar({ drivers, onFilter }: NlSearchBarProps) {
	const [query, setQuery] = useState('');
	const [searching, setSearching] = useState(false);
	const [resultCount, setResultCount] = useState<number | null>(null);

	const handleSearch = async (q?: string) => {
		const searchQuery = q ?? query;
		if (!searchQuery.trim()) return;
		setSearching(true);
		setResultCount(null);
		try {
			const res = await fetch('/api/lofat/nl-search', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query: searchQuery, drivers }),
			});
			const data = await res.json();
			const ids = data.driverIds as string[];
			onFilter(ids);
			setResultCount(ids.length);
		} catch {
			onFilter(null);
			setResultCount(null);
		} finally {
			setSearching(false);
		}
	};

	const handleClear = () => {
		setQuery('');
		setResultCount(null);
		onFilter(null);
	};

	return (
		<div className="mb-2">
			<div className="flex items-center gap-1">
				<TextField
					size="small"
					placeholder="Search drivers with natural language..."
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
					fullWidth
					slotProps={{
						input: {
							startAdornment: (
								<InputAdornment position="start">
									<FuseSvgIcon size={16}>heroicons-outline:magnifying-glass</FuseSvgIcon>
								</InputAdornment>
							),
							endAdornment: searching ? (
								<InputAdornment position="end">
									<CircularProgress size={16} />
								</InputAdornment>
							) : undefined,
						},
					}}
					sx={{ '& .MuiInputBase-input': { fontSize: '0.8rem' } }}
				/>
				<Button
					size="small"
					variant="contained"
					onClick={() => handleSearch()}
					disabled={searching || !query.trim()}
					startIcon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
					sx={{ textTransform: 'none', fontSize: '0.7rem', whiteSpace: 'nowrap' }}
				>
					Search
				</Button>
				{resultCount !== null && (
					<Button
						size="small"
						variant="outlined"
						onClick={handleClear}
						sx={{ textTransform: 'none', fontSize: '0.7rem', whiteSpace: 'nowrap' }}
					>
						Clear ({resultCount})
					</Button>
				)}
			</div>
			<div className="flex flex-wrap gap-1 mt-1">
				{SUGGESTIONS.map((s) => (
					<Chip
						key={s}
						label={s}
						size="small"
						variant="outlined"
						onClick={() => { setQuery(s); handleSearch(s); }}
						sx={{ fontSize: '0.6rem', height: 22, cursor: 'pointer' }}
					/>
				))}
			</div>
		</div>
	);
}

export default memo(NlSearchBar);
