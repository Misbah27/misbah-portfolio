'use client';

import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { FC_OPTIONS } from '../../types';

interface CreateRescueModalProps {
	open: boolean;
	onClose: () => void;
	onSubmit: (data: {
		origin: string;
		destination: string;
		vrid: string;
		rescueDate: string;
		retrievalTime: string;
		eddSplit: string;
		reason: string;
	}) => void;
}

const REASON_PRESETS = [
	'Weather delay',
	'Mechanical breakdown',
	'Driver HOS exceeded',
	'Carrier no-show',
	'Traffic congestion',
	'Equipment shortage',
	'Load rejection',
] as const;

/**
 * Modal dialog for creating a new rescue record.
 */
function CreateRescueModal({ open, onClose, onSubmit }: CreateRescueModalProps) {
	const [origin, setOrigin] = useState('');
	const [destination, setDestination] = useState('');
	const [vrid, setVrid] = useState('');
	const [rescueDate, setRescueDate] = useState('');
	const [retrievalTime, setRetrievalTime] = useState('');
	const [eddSplit, setEddSplit] = useState('');
	const [reason, setReason] = useState('');

	const valid = origin && destination && origin !== destination && vrid && rescueDate && retrievalTime && eddSplit && reason;

	function handleSubmit() {
		if (!valid) return;
		onSubmit({ origin, destination, vrid, rescueDate, retrievalTime, eddSplit, reason });
		setOrigin('');
		setDestination('');
		setVrid('');
		setRescueDate('');
		setRetrievalTime('');
		setEddSplit('');
		setReason('');
		onClose();
	}

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle className="flex items-center gap-2">
				<FuseSvgIcon size={20}>heroicons-outline:plus-circle</FuseSvgIcon>
				Create Rescue
			</DialogTitle>
			<DialogContent className="flex flex-col gap-3 pt-2">
				<div className="flex gap-3">
					<TextField select size="small" label="Origin" value={origin} onChange={(e) => setOrigin(e.target.value)} fullWidth>
						{FC_OPTIONS.map((fc) => <MenuItem key={fc} value={fc}>{fc}</MenuItem>)}
					</TextField>
					<TextField select size="small" label="Destination" value={destination} onChange={(e) => setDestination(e.target.value)} fullWidth>
						{FC_OPTIONS.filter((fc) => fc !== origin).map((fc) => <MenuItem key={fc} value={fc}>{fc}</MenuItem>)}
					</TextField>
				</div>
				<TextField size="small" label="VRID" value={vrid} onChange={(e) => setVrid(e.target.value.toUpperCase())} placeholder="e.g. 1141XPHH" />
				<div className="flex gap-3">
					<TextField size="small" type="datetime-local" label="Rescue Date" value={rescueDate} onChange={(e) => setRescueDate(e.target.value)} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
					<TextField size="small" type="datetime-local" label="Retrieval Time" value={retrievalTime} onChange={(e) => setRetrievalTime(e.target.value)} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
				</div>
				<TextField size="small" label="EDD Split" value={eddSplit} onChange={(e) => setEddSplit(e.target.value)} placeholder="e.g. 60RH/40AH" />
				<TextField select size="small" label="Reason for Delay" value={reason} onChange={(e) => setReason(e.target.value)}>
					{REASON_PRESETS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
				</TextField>
			</DialogContent>
			<DialogActions className="px-6 pb-4">
				<Button onClick={onClose} size="small">Cancel</Button>
				<Button variant="contained" size="small" disabled={!valid} onClick={handleSubmit}>Create</Button>
			</DialogActions>
		</Dialog>
	);
}

export default CreateRescueModal;
