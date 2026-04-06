'use client';

import { useState, useMemo } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import DataTable from 'src/components/data-table/DataTable';
import { type MRT_ColumnDef } from 'material-react-table';
import { motion } from 'motion/react';
import { useSnackbar } from 'notistack';
import type { RescueRecord, RescueRole } from '../../types';
import { ROLE_ACTIONS } from '../../types';
import AiRecommendPanel from './AiRecommendPanel';

interface PlanTabProps {
	rescues: RescueRecord[];
	role: RescueRole;
	selectedRescue: RescueRecord | null;
	onUpdateApprovals: (rescueId: string, approvals: [boolean, boolean, boolean]) => void;
}

const REC_COLORS: Record<string, { bg: string; color: string }> = {
	RESCUE: { bg: '#e8f5e9', color: '#2e7d32' },
	DROP: { bg: '#ffebee', color: '#c62828' },
	MERGE: { bg: '#fff8e1', color: '#f57f17' },
};

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

const CLIENT_LABELS = ['Client A', 'Client B', 'Client C'] as const;

/**
 * Plan tab — connecting lanes table with AI recommendations and client approvals.
 */
function PlanTab({ rescues, role, selectedRescue, onUpdateApprovals }: PlanTabProps) {
	const { enqueueSnackbar } = useSnackbar();
	const [mergeSplit, setMergeSplit] = useState(false);
	const actions = ROLE_ACTIONS[role];

	const activeRescues = useMemo(() => rescues.filter((r) => r.status !== 'CANCELLED'), [rescues]);
	const adhocCount = activeRescues.filter((r) => r.algorithmRecommendation === 'RESCUE').length;
	const dropCount = activeRescues.filter((r) => r.algorithmRecommendation === 'DROP').length;
	const mergeCount = activeRescues.filter((r) => r.algorithmRecommendation === 'MERGE').length;

	const columns: MRT_ColumnDef<RescueRecord>[] = useMemo(() => [
		{ accessorKey: 'lane', header: 'Lane', size: 130 },
		{ accessorKey: 'eddPackageCount', header: 'EDD Pkgs', size: 90 },
		{ accessorKey: 'vehicleSize', header: 'Vehicle Size', size: 100 },
		{
			accessorKey: 'algorithmRecommendation', header: 'Recommendation', size: 140,
			Cell: ({ cell }) => {
				const val = cell.getValue<string>();
				const c = REC_COLORS[val];
				return <Chip label={val} size="small" sx={{ fontSize: '0.65rem', height: 22, fontWeight: 600, bgcolor: c.bg, color: c.color }} />;
			},
		},
		{ accessorKey: 'eddSplit', header: 'EDD Split', size: 100 },
		{ accessorKey: 'haulType', header: 'Haul', size: 60 },
	], []);

	return (
		<div className="flex flex-col gap-4">
			<motion.div className="grid grid-cols-3 gap-4" variants={containerVariants} initial="hidden" animate="visible">
				{[
					{ label: 'Adhoc Rescue', value: adhocCount, color: '#2e7d32' },
					{ label: 'Drop', value: dropCount, color: '#c62828' },
					{ label: 'Merge', value: mergeCount, color: '#f57f17' },
				].map((m) => (
					<motion.div key={m.label} variants={itemVariants}>
						<Paper variant="outlined" className="p-3 text-center">
							<Typography variant="caption" color="text.secondary">{m.label}</Typography>
							<Typography className="text-xl font-bold" sx={{ color: m.color }}>{m.value}</Typography>
						</Paper>
					</motion.div>
				))}
			</motion.div>

			<Typography variant="subtitle2" className="font-semibold">
				{adhocCount} lanes adhoc, {dropCount} drop, {mergeCount} merge
			</Typography>

			<DataTable
				columns={columns}
				data={activeRescues}
				enableRowSelection={false}
				enableRowActions={false}
				enableColumnOrdering={false}
				enableGrouping={false}
				enableColumnPinning={false}
				enableDensityToggle={false}
				enableHiding={false}
				enableStickyHeader
				enableExpanding
				initialState={{ density: 'compact' }}
				renderDetailPanel={({ row }) => (
					<div className="px-4 py-2">
						<AiRecommendPanel rescue={row.original} />
					</div>
				)}
			/>

			<Paper variant="outlined" className="p-4 flex flex-col gap-3">
				<div className="flex items-center justify-between">
					<Typography variant="subtitle2" className="font-semibold">Plan Controls</Typography>
					<FormControlLabel
						control={<Switch size="small" checked={mergeSplit} onChange={(e) => setMergeSplit(e.target.checked)} />}
						label={<Typography variant="body2">{mergeSplit ? 'Split Mode' : 'Merge Mode'}</Typography>}
					/>
				</div>

				{selectedRescue && actions.canApprove && (
					<div className="flex flex-col gap-2">
						<Typography variant="body2" color="text.secondary">
							Client Approvals for <strong>{selectedRescue.rescueId}</strong>
						</Typography>
						<div className="flex gap-2">
							{CLIENT_LABELS.map((client, idx) => {
								const approved = selectedRescue.clientApprovals[idx];
								return (
									<Button
										key={client}
										size="small"
										variant={approved ? 'contained' : 'outlined'}
										color={approved ? 'success' : 'error'}
										onClick={() => {
											const next: [boolean, boolean, boolean] = [...selectedRescue.clientApprovals];
											next[idx] = !next[idx];
											onUpdateApprovals(selectedRescue.rescueId, next);
											enqueueSnackbar(`${client} ${next[idx] ? 'approved' : 'disapproved'}`, { variant: next[idx] ? 'success' : 'warning' });
										}}
										startIcon={<FuseSvgIcon size={16}>{approved ? 'heroicons-outline:check-circle' : 'heroicons-outline:x-circle'}</FuseSvgIcon>}
										sx={{ textTransform: 'none' }}
									>
										{client}
									</Button>
								);
							})}
						</div>
					</div>
				)}

				{!selectedRescue && (
					<Typography variant="body2" color="text.secondary">
						Select a rescue from the Home tab to manage client approvals
					</Typography>
				)}
			</Paper>
		</div>
	);
}

export default PlanTab;
