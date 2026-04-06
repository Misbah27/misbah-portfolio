'use client';

import { useState, useCallback } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { Rolling21Data, FcId } from './types';

interface RiskItem {
	fc: string;
	dateRange: string;
	severity: 'HIGH' | 'MEDIUM';
	description: string;
	recommendedAction: string;
}

interface RiskAnalysisPanelProps {
	data: Rolling21Data;
	selectedFcs: FcId[];
}

/**
 * "Analyze Risks" button + modal displaying top 3 over-scheduling risks.
 * Each risk rendered as a severity-colored card.
 */
function RiskAnalysisPanel({ data, selectedFcs }: RiskAnalysisPanelProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [risks, setRisks] = useState<RiskItem[] | null>(null);
	const [error, setError] = useState(false);
	const [responseTime, setResponseTime] = useState<number | null>(null);

	const fetchRisks = useCallback(async () => {
		setLoading(true);
		setError(false);
		const start = Date.now();

		try {
			// Build a compact payload with only selected FCs
			const rollingData: Record<string, unknown[]> = {};
			selectedFcs.forEach((fc) => {
				if (data[fc]) rollingData[fc] = data[fc];
			});

			const res = await fetch('/api/freightlens/risk-analysis', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ rollingData, selectedFCs: selectedFcs }),
			});

			if (!res.ok) throw new Error('Failed');
			const json = await res.json();
			setRisks(json.result);
			setResponseTime(Date.now() - start);
		} catch {
			setError(true);
		} finally {
			setLoading(false);
		}
	}, [data, selectedFcs]);

	const handleOpen = () => {
		setOpen(true);
		if (!risks) fetchRisks();
	};

	return (
		<>
			<Button
				size="small"
				variant="outlined"
				color="secondary"
				startIcon={<AutoAwesomeIcon />}
				onClick={handleOpen}
			>
				Analyze Risks
			</Button>

			<Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
				<DialogTitle className="flex items-center justify-between">
					<Box className="flex items-center gap-2">
						<Typography variant="h6" className="font-semibold">
							Scheduling Risk Analysis
						</Typography>
						<Chip
							icon={<AutoAwesomeIcon />}
							label="AI-Enhanced"
							size="small"
							color="secondary"
							variant="outlined"
						/>
					</Box>
					<Box className="flex items-center gap-1">
						<IconButton size="small" onClick={fetchRisks} disabled={loading} title="Refresh">
							<RefreshIcon />
						</IconButton>
						<IconButton size="small" onClick={() => setOpen(false)}>
							<CloseIcon />
						</IconButton>
					</Box>
				</DialogTitle>
				<DialogContent>
					{loading && (
						<Box className="flex flex-col gap-3">
							{[0, 1, 2].map((i) => (
								<Paper key={i} variant="outlined" className="p-4">
									<Skeleton variant="text" width="40%" height={24} />
									<Skeleton variant="text" width="100%" />
									<Skeleton variant="text" width="90%" />
								</Paper>
							))}
						</Box>
					)}

					{error && !loading && (
						<Box className="text-center py-6">
							<Typography color="error" className="mb-2">
								Failed to analyze scheduling risks
							</Typography>
							<Button variant="outlined" onClick={fetchRisks}>
								Retry
							</Button>
						</Box>
					)}

					{risks && !loading && (
						<Box className="flex flex-col gap-3">
							{risks.map((risk, i) => {
								const isHigh = risk.severity === 'HIGH';
								return (
									<Paper
										key={i}
										variant="outlined"
										sx={{
											p: 2,
											borderLeft: `4px solid ${isHigh ? '#d32f2f' : '#ed6c02'}`,
											backgroundColor: isHigh
												? 'rgba(211,47,47,0.04)'
												: 'rgba(237,108,2,0.04)',
										}}
									>
										<Box className="flex items-center gap-2 mb-1">
											<Chip
												label={risk.severity}
												size="small"
												sx={{
													backgroundColor: isHigh ? '#d32f2f' : '#ed6c02',
													color: '#fff',
													fontWeight: 700,
													fontSize: '0.7rem',
												}}
											/>
											<Typography variant="subtitle2" className="font-bold">
												{risk.fc}
											</Typography>
											<Typography variant="caption" color="text.secondary">
												{risk.dateRange}
											</Typography>
										</Box>
										<Typography variant="body2" className="mb-1">
											{risk.description}
										</Typography>
										<Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
											<strong>Action:</strong> {risk.recommendedAction}
										</Typography>
									</Paper>
								);
							})}
							{responseTime !== null && (
								<Typography variant="caption" color="text.secondary" className="text-right">
									Generated in {(responseTime / 1000).toFixed(1)}s
								</Typography>
							)}
						</Box>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}

export default RiskAnalysisPanel;
