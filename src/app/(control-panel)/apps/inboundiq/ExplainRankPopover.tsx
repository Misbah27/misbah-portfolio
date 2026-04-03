'use client';

import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import type { Truck } from './types';

interface ExplainRankPopoverProps {
	truck: Truck;
}

/**
 * "Why Ranked #N? ✦" icon button + popover that calls the LLM to explain ranking.
 */
function ExplainRankPopover({ truck }: ExplainRankPopoverProps) {
	const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<string | null>(null);
	const [error, setError] = useState(false);
	const [responseTime, setResponseTime] = useState<number | null>(null);

	const fetchExplanation = async () => {
		setLoading(true);
		setError(false);
		setResult(null);
		const start = Date.now();

		try {
			const res = await fetch('/api/inboundiq/explain-rank', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ truck }),
			});

			if (!res.ok) throw new Error('Failed');
			const data = await res.json();
			setResult(data.result);
			setResponseTime(Date.now() - start);
		} catch {
			setError(true);
		} finally {
			setLoading(false);
		}
	};

	const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(e.currentTarget);
		if (!result && !loading) {
			fetchExplanation();
		}
	};

	return (
		<>
			<IconButton
				size="small"
				onClick={handleClick}
				title="Why this rank? ✦"
				sx={{ color: 'primary.main' }}
			>
				<AutoAwesomeIcon sx={{ fontSize: 16 }} />
			</IconButton>
			<Popover
				open={Boolean(anchorEl)}
				anchorEl={anchorEl}
				onClose={() => setAnchorEl(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				transformOrigin={{ vertical: 'top', horizontal: 'left' }}
				slotProps={{ paper: { sx: { maxWidth: 400, p: 2 } } }}
			>
				<Box className="flex items-center gap-2 mb-2">
					<Typography
						variant="subtitle2"
						className="font-bold"
						sx={{
							color:
								truck.rank === 1
									? '#f59e0b'
									: truck.rank === 2
										? '#94a3b8'
										: truck.rank === 3
											? '#cd7f32'
											: 'text.primary',
						}}
					>
						#{truck.rank}
					</Typography>
					<Typography variant="subtitle2" className="font-bold">
						{truck.vehicleNo}
					</Typography>
					<Typography
						variant="caption"
						sx={{
							ml: 'auto',
							color: 'primary.main',
							display: 'flex',
							alignItems: 'center',
							gap: 0.5,
						}}
					>
						<AutoAwesomeIcon sx={{ fontSize: 12 }} />
						AI-Enhanced ✦
					</Typography>
				</Box>

				{loading && (
					<Box>
						<Skeleton variant="text" width="100%" />
						<Skeleton variant="text" width="90%" />
						<Skeleton variant="text" width="95%" />
						<Skeleton variant="text" width="60%" />
					</Box>
				)}

				{error && (
					<Box className="text-center py-2">
						<Typography variant="body2" color="error" className="mb-2">
							Failed to generate explanation
						</Typography>
						<Button size="small" variant="outlined" onClick={fetchExplanation}>
							Retry
						</Button>
					</Box>
				)}

				{result && (
					<>
						<Typography variant="body2" sx={{ lineHeight: 1.6 }}>
							{result}
						</Typography>
						{responseTime !== null && (
							<Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
								Response time: {(responseTime / 1000).toFixed(1)}s
							</Typography>
						)}
					</>
				)}
			</Popover>
		</>
	);
}

export default ExplainRankPopover;
