'use client';

import { useState } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import type { RescueRecord } from '../../types';

interface CheckTabProps {
	rescues: RescueRecord[];
}

function formatIso(iso: string): string {
	return new Date(iso).toLocaleString('en-GB', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
}

const STATUS_COLORS: Record<string, 'info' | 'warning' | 'success' | 'default'> = {
	PENDING: 'warning',
	IN_PROGRESS: 'info',
	COMPLETED: 'success',
	CANCELLED: 'default',
};

const REC_COLORS: Record<string, { bg: string; color: string }> = {
	RESCUE: { bg: '#e8f5e9', color: '#2e7d32' },
	DROP: { bg: '#ffebee', color: '#c62828' },
	MERGE: { bg: '#fff8e1', color: '#f57f17' },
};

/**
 * Check tab — look up a vehicle by VRID to view rescue details.
 */
function CheckTab({ rescues }: CheckTabProps) {
	const [vrid, setVrid] = useState('');
	const [result, setResult] = useState<RescueRecord | null | 'NOT_FOUND'>(null);

	function handleSubmit() {
		const q = vrid.trim().toUpperCase();
		if (!q) return;
		const found = rescues.find((r) => r.vrid === q);
		setResult(found ?? 'NOT_FOUND');
	}

	return (
		<div className="flex flex-col gap-4 max-w-lg">
			<Paper variant="outlined" className="p-4">
				<Typography variant="subtitle2" className="font-semibold mb-3">Vehicle Lookup</Typography>
				<div className="flex gap-2">
					<TextField
						size="small"
						placeholder="Enter VRID..."
						value={vrid}
						onChange={(e) => setVrid(e.target.value.toUpperCase())}
						onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
						fullWidth
						slotProps={{ input: { startAdornment: <InputAdornment position="start"><FuseSvgIcon size={18}>heroicons-outline:magnifying-glass</FuseSvgIcon></InputAdornment> } }}
					/>
					<Button variant="contained" size="small" onClick={handleSubmit} sx={{ textTransform: 'none' }}>
						Check
					</Button>
				</div>
			</Paper>

			{result === 'NOT_FOUND' && (
				<Alert severity="warning" icon={<FuseSvgIcon size={18}>heroicons-outline:exclamation-triangle</FuseSvgIcon>}>
					No rescue record found for VRID <strong>{vrid}</strong>
				</Alert>
			)}

			{result && result !== 'NOT_FOUND' && (
				<Paper variant="outlined" className="p-4">
					<div className="flex items-center justify-between mb-3">
						<Typography variant="subtitle1" className="font-bold">{result.rescueId}</Typography>
						<Chip label={result.status.replace('_', ' ')} size="small" color={STATUS_COLORS[result.status]} />
					</div>
					<Divider className="mb-3" />
					<div className="grid grid-cols-2 gap-y-2 gap-x-6">
						{([
							['VRID', result.vrid],
							['OD Pair', result.odPair],
							['Lane', result.lane],
							['Haul Type', result.haulType],
							['Vehicle Size', result.vehicleSize],
							['EDD Packages', String(result.eddPackageCount)],
							['EDD Split', result.eddSplit],
							['Rescue Date', formatIso(result.rescueDate)],
							['Retrieval Time', formatIso(result.retrievalTime)],
							['ETA', formatIso(result.eta)],
						] as const).map(([label, value]) => (
							<div key={label}>
								<Typography variant="caption" color="text.secondary">{label}</Typography>
								<Typography variant="body2" className="font-medium">{value}</Typography>
							</div>
						))}
					</div>
					<Divider className="my-3" />
					<div className="flex items-center gap-2">
						<Typography variant="caption" color="text.secondary">Algorithm:</Typography>
						{(() => { const c = REC_COLORS[result.algorithmRecommendation]; return <Chip label={result.algorithmRecommendation} size="small" sx={{ fontSize: '0.65rem', height: 22, fontWeight: 600, bgcolor: c.bg, color: c.color }} />; })()}
					</div>
					<Typography variant="caption" color="text.secondary" className="block mt-2">
						Reason: {result.reasonForDelay}
					</Typography>
				</Paper>
			)}
		</div>
	);
}

export default CheckTab;
