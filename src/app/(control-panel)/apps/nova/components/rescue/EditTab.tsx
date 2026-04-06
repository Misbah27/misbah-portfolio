'use client';

import { useState, useEffect } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useSnackbar } from 'notistack';
import type { RescueRecord } from '../../types';

interface EditTabProps {
	rescue: RescueRecord | null;
	onSave: (rescueId: string, updates: { retrievalTime: string; reasonForDelay: string }) => void;
}

const REASON_PRESETS = [
	'Weather delay',
	'Mechanical breakdown',
	'Driver HOS exceeded',
	'Carrier no-show',
	'Traffic congestion',
	'Equipment shortage',
	'Load rejection',
	'Accident blocking highway',
	'Routing error',
	'Relay driver unavailable',
] as const;

/**
 * Edit tab — update retrieval time and reason for a selected rescue.
 */
function EditTab({ rescue, onSave }: EditTabProps) {
	const { enqueueSnackbar } = useSnackbar();
	const [retrievalTime, setRetrievalTime] = useState('');
	const [reasonPreset, setReasonPreset] = useState('');
	const [reasonCustom, setReasonCustom] = useState('');

	useEffect(() => {
		if (rescue) {
			const dt = new Date(rescue.retrievalTime);
			const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
			setRetrievalTime(local);
			const match = REASON_PRESETS.find((p) => rescue.reasonForDelay.startsWith(p));
			setReasonPreset(match ?? 'custom');
			setReasonCustom(match ? '' : rescue.reasonForDelay);
		}
	}, [rescue]);

	if (!rescue) {
		return (
			<Paper variant="outlined" className="p-8 text-center">
				<FuseSvgIcon size={40} color="disabled" className="mx-auto mb-2">heroicons-outline:pencil-square</FuseSvgIcon>
				<Typography color="text.secondary">Select a rescue from the Home tab to edit</Typography>
			</Paper>
		);
	}

	const finalReason = reasonPreset === 'custom' ? reasonCustom : reasonPreset;
	const valid = retrievalTime && finalReason.trim().length > 0;

	function handleSave() {
		if (!valid) return;
		onSave(rescue.rescueId, { retrievalTime: new Date(retrievalTime).toISOString(), reasonForDelay: finalReason });
		enqueueSnackbar(`Rescue ${rescue.rescueId} updated`, { variant: 'success' });
	}

	return (
		<div className="flex flex-col gap-4 max-w-xl">
			<Alert severity="info" icon={<FuseSvgIcon size={18}>heroicons-outline:information-circle</FuseSvgIcon>}>
				Editing rescue <strong>{rescue.rescueId}</strong> — {rescue.odPair} ({rescue.vrid})
			</Alert>

			<Paper variant="outlined" className="p-4 flex flex-col gap-3">
				<Typography variant="subtitle2" className="font-semibold">Retrieval Time</Typography>
				<TextField
					size="small"
					type="datetime-local"
					value={retrievalTime}
					onChange={(e) => setRetrievalTime(e.target.value)}
					fullWidth
					slotProps={{ inputLabel: { shrink: true } }}
				/>

				<Typography variant="subtitle2" className="font-semibold mt-2">Reason for Delay</Typography>
				<TextField
					select
					size="small"
					label="Reason preset"
					value={reasonPreset}
					onChange={(e) => setReasonPreset(e.target.value)}
					fullWidth
				>
					{REASON_PRESETS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
					<MenuItem value="custom">Custom reason...</MenuItem>
				</TextField>
				{reasonPreset === 'custom' && (
					<TextField
						size="small"
						label="Custom reason"
						value={reasonCustom}
						onChange={(e) => setReasonCustom(e.target.value)}
						multiline
						rows={2}
						fullWidth
					/>
				)}
			</Paper>

			<div className="flex gap-2">
				<Button
					variant="contained"
					size="small"
					disabled={!valid}
					onClick={handleSave}
					startIcon={<FuseSvgIcon size={18}>heroicons-outline:check</FuseSvgIcon>}
					sx={{ textTransform: 'none' }}
				>
					Save Changes
				</Button>
			</div>
		</div>
	);
}

export default EditTab;
