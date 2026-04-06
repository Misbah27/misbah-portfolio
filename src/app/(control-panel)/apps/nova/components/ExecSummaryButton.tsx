'use client';

import { useState, useCallback } from 'react';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import type { DelayAlert } from '../types';

interface ExecSummaryButtonProps {
	alerts: DelayAlert[];
}

interface ExecSummaryResult {
	reportTitle: string;
	generatedAt: string;
	totalDelayed: number;
	totalVehicles: number;
	totalEddAtRisk: string | number;
	avgDelayHours: string | number;
	criticalVehicles: { vrid: string; lane: string; delayHours: number; eddToday: number; reason: string }[];
	escalations: string[];
}

/**
 * "Generate Report" button that produces an executive summary and downloads it.
 */
function ExecSummaryButton({ alerts }: ExecSummaryButtonProps) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(false);
	const [responseTime, setResponseTime] = useState(0);

	const handleGenerate = useCallback(async () => {
		setLoading(true);
		setError(false);
		const start = Date.now();
		try {
			const res = await fetch('/api/nova/exec-summary', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ vehicles: alerts }),
			});
			if (!res.ok) throw new Error('API error');
			const data = await res.json();
			const r: ExecSummaryResult = data.result;
			setResponseTime(Date.now() - start);

			const lines = [
				r.reportTitle,
				'='.repeat(r.reportTitle.length),
				`Generated: ${new Date().toLocaleString()}`,
				'',
				'OVERVIEW',
				'--------',
				`Total Vehicles: ${r.totalVehicles}`,
				`Delayed Vehicles: ${r.totalDelayed}`,
				`Total EDD at Risk: ${r.totalEddAtRisk}`,
				`Average Delay: ${r.avgDelayHours} hours`,
				'',
				'TOP 5 CRITICAL VEHICLES',
				'-----------------------',
				'VRID          | Lane          | Delay Hrs | EDD Today | Reason',
				...r.criticalVehicles.map((v) =>
					`${v.vrid.padEnd(14)}| ${v.lane.padEnd(14)}| ${String(v.delayHours).padEnd(10)}| ${String(v.eddToday).padEnd(10)}| ${v.reason}`
				),
				'',
				'RECOMMENDED ESCALATIONS',
				'-----------------------',
				...r.escalations.map((e, i) => `${i + 1}. ${e}`),
				'',
				'--- End of Report ---',
			];

			const text = lines.join('\n');
			const blob = new Blob([text], { type: 'text/plain' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `nova-exec-summary-${new Date().toISOString().slice(0, 10)}.txt`;
			link.click();
			URL.revokeObjectURL(url);
		} catch {
			setError(true);
		} finally {
			setLoading(false);
		}
	}, [alerts]);

	return (
		<div className="flex items-center gap-2">
			<Button
				size="small"
				variant="outlined"
				color="secondary"
				onClick={handleGenerate}
				disabled={loading}
				startIcon={loading ? <CircularProgress size={16} /> : <AutoAwesomeIcon sx={{ fontSize: 16 }} />}
				sx={{ textTransform: 'none' }}
			>
				Generate Report
			</Button>
			{error && (
				<Paper variant="outlined" className="px-2 py-1 flex items-center gap-1" sx={{ borderColor: '#ef4444' }}>
					<FuseSvgIcon size={14} sx={{ color: '#ef4444' }}>heroicons-outline:exclamation-triangle</FuseSvgIcon>
					<Typography variant="caption" color="error">Failed</Typography>
					<Button size="small" onClick={handleGenerate} sx={{ ml: 0.5, minWidth: 0, p: 0, textTransform: 'none' }}>
						<Typography variant="caption" color="secondary">Retry</Typography>
					</Button>
				</Paper>
			)}
			{responseTime > 0 && !error && (
				<Chip label={`${(responseTime / 1000).toFixed(1)}s`} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
			)}
		</div>
	);
}

export default ExecSummaryButton;
