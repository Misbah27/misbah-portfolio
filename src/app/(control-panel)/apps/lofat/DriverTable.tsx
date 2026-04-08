'use client';

import { memo, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import DataTable from 'src/components/data-table/DataTable';
import { type MRT_ColumnDef } from 'material-react-table';
import type { Driver, FraudPattern, DriverStatus, Zone } from './types';
import { STATUS_COLORS, FRAUD_SCORE_COLOR, PATTERN_LABELS, ZONE_CITY_MAP } from './types';

interface DriverTableProps {
	drivers: Driver[];
	selectedZone: string;
	selectedPattern: string;
	nlFilterIds?: string[] | null;
}

const STATUS_LABEL: Record<DriverStatus, string> = {
	ACTIVE: 'Active',
	FLAGGED: 'Flagged',
	SUSPENDED: 'Suspended',
	UNDER_INVESTIGATION: 'Investigating',
	CLEARED: 'Cleared',
};

/**
 * Driver DataTable for the Live Monitoring Dashboard.
 * Columns: ID, Name, Zone, Vehicle, Shift Hours, Orders Assigned,
 * Orders Completed, Fraud Score bar, Primary Flag, Status badge, Actions.
 */
function DriverTable({ drivers, selectedZone, selectedPattern, nlFilterIds }: DriverTableProps) {
	const router = useRouter();

	const filtered = useMemo(() => {
		let result = drivers;
		if (nlFilterIds && nlFilterIds.length > 0) {
			result = result.filter((d) => nlFilterIds.includes(d.driverId));
		}
		if (selectedZone !== 'All') {
			result = result.filter((d) => ZONE_CITY_MAP[d.zone] === selectedZone);
		}
		if (selectedPattern !== 'All') {
			result = result.filter((d) => d.primaryFraudPattern === selectedPattern);
		}
		return result.sort((a, b) => b.fraudScore - a.fraudScore);
	}, [drivers, selectedZone, selectedPattern, nlFilterIds]);

	const columns = useMemo<MRT_ColumnDef<Driver>[]>(
		() => [
			{
				accessorKey: 'driverId',
				header: 'Driver ID',
				size: 110,
				Cell: ({ row }) => (
					<Typography
						variant="body2"
						className="font-mono font-medium"
					>
						{row.original.driverId}
					</Typography>
				),
			},
			{
				accessorKey: 'name',
				header: 'Name',
				size: 140,
			},
			{
				accessorKey: 'zone',
				header: 'Zone',
				size: 120,
				Cell: ({ row }) => (
					<Chip
						label={row.original.zone}
						size="small"
						variant="outlined"
						sx={{ fontSize: '0.7rem' }}
					/>
				),
			},
			{
				accessorKey: 'vehicleType',
				header: 'Vehicle',
				size: 80,
				Cell: ({ row }) => {
					const icons: Record<string, string> = {
						CAR: 'heroicons-outline:truck',
						VAN: 'heroicons-outline:truck',
						BIKE: 'heroicons-outline:bolt',
						SCOOTER: 'heroicons-outline:bolt',
					};
					return (
						<div className="flex items-center gap-1">
							<FuseSvgIcon size={14}>{icons[row.original.vehicleType]}</FuseSvgIcon>
							<span className="text-xs">{row.original.vehicleType}</span>
						</div>
					);
				},
			},
			{
				id: 'shiftHours',
				header: 'Shift Hrs',
				size: 80,
				Cell: ({ row }) => {
					const start = new Date(row.original.shiftStart);
					const end = new Date(row.original.shiftEnd);
					const hrs = ((end.getTime() - start.getTime()) / 3600000).toFixed(1);
					return <span className="text-xs">{hrs}h</span>;
				},
			},
			{
				accessorKey: 'deliveriesAttempted',
				header: 'Assigned',
				size: 75,
			},
			{
				accessorKey: 'deliveriesCompleted',
				header: 'Completed',
				size: 80,
			},
			{
				accessorKey: 'fraudScore',
				header: 'Fraud Score',
				size: 130,
				Cell: ({ row }) => {
					const score = row.original.fraudScore;
					const color = FRAUD_SCORE_COLOR(score);
					return (
						<Box className="flex items-center gap-2 w-full">
							<LinearProgress
								variant="determinate"
								value={score}
								sx={{
									flex: 1,
									height: 6,
									borderRadius: 3,
									backgroundColor: '#e0e0e0',
									'& .MuiLinearProgress-bar': {
										backgroundColor: color,
										borderRadius: 3,
									},
								}}
							/>
							<Typography
								variant="caption"
								className="font-bold min-w-[28px] text-right"
								sx={{ color }}
							>
								{score}
							</Typography>
						</Box>
					);
				},
				sortingFn: (a, b) => a.original.fraudScore - b.original.fraudScore,
			},
			{
				id: 'primaryFlag',
				header: 'Primary Flag',
				size: 120,
				Cell: ({ row }) => {
					const pattern = row.original.primaryFraudPattern;
					if (!pattern) {
						return (
							<Typography
								variant="caption"
								color="text.disabled"
							>
								None
							</Typography>
						);
					}
					return (
						<Chip
							label={PATTERN_LABELS[pattern]}
							size="small"
							sx={{
								fontSize: '0.65rem',
								height: 22,
								backgroundColor: '#fff3e0',
								color: '#e65100',
							}}
						/>
					);
				},
			},
			{
				accessorKey: 'status',
				header: 'Status',
				size: 120,
				Cell: ({ row }) => {
					const status = row.original.status;
					return (
						<Chip
							label={STATUS_LABEL[status]}
							size="small"
							sx={{
								fontSize: '0.65rem',
								height: 22,
								backgroundColor: `${STATUS_COLORS[status]}15`,
								color: STATUS_COLORS[status],
								fontWeight: 600,
							}}
						/>
					);
				},
			},
			{
				id: 'actions',
				header: 'Actions',
				size: 120,
				enableSorting: false,
				Cell: ({ row }) => (
					<div className="flex items-center gap-0.5">
						<Tooltip title="Investigate">
							<IconButton
								size="small"
								onClick={(e) => {
									e.stopPropagation();
									router.push(`/apps/lofat/driver/${row.original.driverId}`);
								}}
							>
								<FuseSvgIcon size={16}>heroicons-outline:magnifying-glass</FuseSvgIcon>
							</IconButton>
						</Tooltip>
						<Tooltip title="Clear">
							<IconButton size="small">
								<FuseSvgIcon
									size={16}
									sx={{ color: '#4caf50' }}
								>
									heroicons-outline:check-circle
								</FuseSvgIcon>
							</IconButton>
						</Tooltip>
						<Tooltip title="Escalate">
							<IconButton size="small">
								<FuseSvgIcon
									size={16}
									sx={{ color: '#f44336' }}
								>
									heroicons-outline:arrow-up-circle
								</FuseSvgIcon>
							</IconButton>
						</Tooltip>
					</div>
				),
			},
		],
		[router]
	);

	return (
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
			initialState={{ density: 'compact', sorting: [{ id: 'fraudScore', desc: true }] }}
			muiTableBodyRowProps={({ row }) => ({
				onClick: () => router.push(`/apps/lofat/driver/${row.original.driverId}`),
				sx: {
					cursor: 'pointer',
					'&:hover': { backgroundColor: 'action.hover' },
					...(row.original.fraudScore >= 60 && {
						backgroundColor: 'rgba(244, 67, 54, 0.04)',
					}),
				},
			})}
		/>
	);
}

export default memo(DriverTable);
