'use client';

import { useMemo } from 'react';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import DataTable from 'src/components/data-table/DataTable';
import { type MRT_ColumnDef } from 'material-react-table';
import type { RescueRecord } from '../../types';

interface FollowUpTabProps {
	rescues: RescueRecord[];
}

const STATUS_COLORS: Record<string, 'info' | 'warning' | 'success' | 'default'> = {
	PENDING: 'warning',
	IN_PROGRESS: 'info',
	COMPLETED: 'success',
	CANCELLED: 'default',
};

/**
 * Follow Up tab — table of rescues with VRID, status, EDD count, lane, haul type.
 */
function FollowUpTab({ rescues }: FollowUpTabProps) {
	const activeRescues = useMemo(
		() => rescues.filter((r) => r.status === 'PENDING' || r.status === 'IN_PROGRESS'),
		[rescues]
	);

	const columns: MRT_ColumnDef<RescueRecord>[] = useMemo(() => [
		{
			accessorKey: 'vrid', header: 'VRID', size: 110,
			Cell: ({ cell }) => <Typography variant="body2" sx={{ color: '#2196f3', fontWeight: 600 }}>{cell.getValue<string>()}</Typography>,
		},
		{
			accessorKey: 'status', header: 'Status', size: 120,
			Cell: ({ cell }) => <Chip label={cell.getValue<string>().replace('_', ' ')} size="small" color={STATUS_COLORS[cell.getValue<string>()]} sx={{ fontSize: '0.65rem', height: 20 }} />,
		},
		{ accessorKey: 'eddPackageCount', header: 'EDD Count', size: 90 },
		{ accessorKey: 'lane', header: 'Lane', size: 130 },
		{ accessorKey: 'haulType', header: 'Haul Type', size: 80, Cell: ({ cell }) => <Chip label={cell.getValue<string>()} size="small" sx={{ fontSize: '0.65rem', height: 20 }} /> },
		{ accessorKey: 'eddSplit', header: 'EDD Split', size: 100 },
		{ accessorKey: 'vehicleSize', header: 'Vehicle', size: 90 },
	], []);

	return (
		<div className="flex flex-col gap-3">
			<Typography variant="body2" color="text.secondary">
				{activeRescues.length} active rescues requiring follow-up
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
				initialState={{ density: 'compact' }}
			/>
		</div>
	);
}

export default FollowUpTab;
