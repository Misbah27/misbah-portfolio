'use client';

import { useState, useMemo } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import DataTable from 'src/components/data-table/DataTable';
import { type MRT_ColumnDef } from 'material-react-table';
import { motion } from 'motion/react';
import type { RescueRecord, RescueRole } from '../../types';
import { ROLE_ACTIONS } from '../../types';
import CreateRescueModal from './CreateRescueModal';

interface HomeTabProps {
	rescues: RescueRecord[];
	role: RescueRole;
	onSelectRescue: (rescue: RescueRecord) => void;
	onDeleteRescue: (rescueId: string) => void;
	onCreateRescue: (data: { origin: string; destination: string; vrid: string; rescueDate: string; retrievalTime: string; eddSplit: string; reason: string }) => void;
}

const STATUS_COLORS: Record<string, 'info' | 'warning' | 'success' | 'default'> = {
	PENDING: 'warning',
	IN_PROGRESS: 'info',
	COMPLETED: 'success',
	CANCELLED: 'default',
};

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

function formatIso(iso: string): string {
	return new Date(iso).toLocaleString('en-GB', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Home tab — metrics bar, create rescue button, searchable rescue list table.
 */
function HomeTab({ rescues, role, onSelectRescue, onDeleteRescue, onCreateRescue }: HomeTabProps) {
	const [search, setSearch] = useState('');
	const [modalOpen, setModalOpen] = useState(false);
	const actions = ROLE_ACTIONS[role];

	const completed = rescues.filter((r) => r.status === 'COMPLETED').length;
	const efficiency = rescues.length > 0 ? Math.round((completed / rescues.length) * 100) : 0;
	const lhCount = rescues.filter((r) => r.haulType === 'LH').length;
	const rhCount = rescues.filter((r) => r.haulType === 'RH').length;
	const ahCount = rescues.filter((r) => r.haulType === 'AH').length;

	const filtered = useMemo(() => {
		if (!search.trim()) return rescues;
		const q = search.toLowerCase();
		return rescues.filter((r) => r.odPair.toLowerCase().includes(q) || r.lane.toLowerCase().includes(q) || r.vrid.toLowerCase().includes(q));
	}, [rescues, search]);

	const columns: MRT_ColumnDef<RescueRecord>[] = useMemo(() => [
		{ accessorKey: 'haulType', header: 'Haul', size: 70, Cell: ({ cell }) => <Chip label={cell.getValue<string>()} size="small" sx={{ fontSize: '0.65rem', height: 20 }} /> },
		{ accessorKey: 'lane', header: 'Lane', size: 130 },
		{ accessorKey: 'vrid', header: 'VRID', size: 100, Cell: ({ cell }) => <Typography variant="body2" sx={{ color: '#2196f3', fontWeight: 600 }}>{cell.getValue<string>()}</Typography> },
		{ accessorKey: 'status', header: 'Status', size: 120, Cell: ({ cell }) => <Chip label={cell.getValue<string>().replace('_', ' ')} size="small" color={STATUS_COLORS[cell.getValue<string>()]} sx={{ fontSize: '0.65rem', height: 20 }} /> },
		{ accessorKey: 'eta', header: 'ETA', size: 140, Cell: ({ cell }) => formatIso(cell.getValue<string>()) },
		{ accessorKey: 'eddPackageCount', header: 'EDD Pkgs', size: 80 },
		{
			id: 'actions', header: '', size: 50,
			Cell: ({ row }) => actions.canEdit ? (
				<IconButton size="small" onClick={(e) => { e.stopPropagation(); onDeleteRescue(row.original.rescueId); }} title="Delete">
					<FuseSvgIcon size={16}>heroicons-outline:trash</FuseSvgIcon>
				</IconButton>
			) : null,
		},
	], [actions.canEdit, onDeleteRescue]);

	return (
		<div className="flex flex-col gap-4">
			<motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-4" variants={containerVariants} initial="hidden" animate="visible">
				{[
					{ label: 'Rescue Efficiency', value: `${efficiency}%`, icon: 'heroicons-outline:chart-bar', color: '#10b981' },
					{ label: 'LH Rescues', value: String(lhCount), icon: 'heroicons-outline:truck', color: '#3b82f6' },
					{ label: 'RH Rescues', value: String(rhCount), icon: 'heroicons-outline:arrow-path', color: '#f59e0b' },
					{ label: 'AH Rescues', value: String(ahCount), icon: 'heroicons-outline:bolt', color: '#8b5cf6' },
				].map((m) => (
					<motion.div key={m.label} variants={itemVariants}>
						<Paper variant="outlined" className="p-3">
							<div className="flex items-center gap-2 mb-1">
								<FuseSvgIcon size={18} sx={{ color: m.color }}>{m.icon}</FuseSvgIcon>
								<Typography variant="caption" color="text.secondary">{m.label}</Typography>
							</div>
							<Typography className="text-xl font-bold" sx={{ color: m.color }}>{m.value}</Typography>
						</Paper>
					</motion.div>
				))}
			</motion.div>

			<div className="flex items-center gap-3">
				<TextField size="small" placeholder="Search origin, destination, VRID..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 280 }}
					slotProps={{ input: { startAdornment: <InputAdornment position="start"><FuseSvgIcon size={18}>heroicons-outline:magnifying-glass</FuseSvgIcon></InputAdornment> } }} />
				<div className="flex-1" />
				{actions.canCreate && (
					<Button size="small" variant="contained" startIcon={<FuseSvgIcon size={18}>heroicons-outline:plus</FuseSvgIcon>} onClick={() => setModalOpen(true)} sx={{ textTransform: 'none' }}>
						Create Rescue
					</Button>
				)}
			</div>

			<DataTable
				columns={columns}
				data={filtered}
				enableRowSelection={false}
				enableRowActions={false}
				enableColumnOrdering={false}
				enableGrouping={false}
				enableColumnPinning={false}
				enableDensityToggle={false}
				enableHiding={false}
				enableStickyHeader
				initialState={{ density: 'compact' }}
				muiTableBodyRowProps={({ row }) => ({
					onClick: () => onSelectRescue(row.original),
					sx: { cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } },
				})}
			/>

			<CreateRescueModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={onCreateRescue} />
		</div>
	);
}

export default HomeTab;
