'use client';

import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import DataTable from 'src/components/data-table/DataTable';
import { type MRT_ColumnDef } from 'material-react-table';
import type { DelayAlert } from '../types';

interface DelayAlertTableProps {
	alerts: DelayAlert[];
}

function formatIso(iso: string | null): string {
	if (!iso) return '—';
	const d = new Date(iso);
	return d.toLocaleString('en-GB', {
		month: 'short',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
	});
}

const columns: MRT_ColumnDef<DelayAlert>[] = [
	{
		accessorKey: 'vrid',
		header: 'VRID',
		size: 120,
		Cell: ({ cell }) => (
			<Typography variant="body2" sx={{ color: '#2196f3', fontWeight: 600, cursor: 'pointer' }}>
				{cell.getValue<string>()}
			</Typography>
		),
	},
	{ accessorKey: 'lane', header: 'Lane', size: 130 },
	{ accessorKey: 'destination', header: 'Destination', size: 120 },
	{ accessorKey: 'zone', header: 'Zone', size: 80 },
	{ accessorKey: 'scac', header: 'SCAC', size: 80 },
	{ accessorKey: 'reasonCodedBy', header: 'Reason Coded By', size: 140 },
	{
		accessorKey: 'delayHours',
		header: 'Delay Hours',
		size: 120,
		Cell: ({ cell }) => {
			const val = cell.getValue<number>();
			const isGreen = val === 0;
			return (
				<Chip
					label={val.toFixed(2)}
					size="small"
					sx={{
						fontSize: '0.7rem',
						height: 22,
						fontWeight: 600,
						bgcolor: isGreen ? '#e8f5e9' : '#ffebee',
						color: isGreen ? '#2e7d32' : '#c62828',
					}}
				/>
			);
		},
	},
	{
		accessorKey: 'plannedYardTime',
		header: 'Planned Yard Time',
		size: 150,
		Cell: ({ cell }) => formatIso(cell.getValue<string>()),
	},
	{
		accessorKey: 'eta',
		header: 'ETA',
		size: 140,
		Cell: ({ cell }) => formatIso(cell.getValue<string | null>()),
	},
];

/**
 * Delay alert data table using Fuse DataTable (Material React Table).
 */
function DelayAlertTable({ alerts }: DelayAlertTableProps) {
	return (
		<DataTable
			columns={columns as MRT_ColumnDef<DelayAlert>[]}
			data={alerts}
			enableRowSelection={false}
			enableRowActions={false}
			enableColumnOrdering={false}
			enableGrouping={false}
			enableColumnPinning={false}
			enableDensityToggle={false}
			enableHiding={false}
			enableStickyHeader
			initialState={{ density: 'compact', sorting: [{ id: 'delayHours', desc: true }] }}
		/>
	);
}

export default DelayAlertTable;
