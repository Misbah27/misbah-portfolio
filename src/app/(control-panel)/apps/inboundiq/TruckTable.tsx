'use client';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import TablePagination from '@mui/material/TablePagination';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import { YARD_QUEUE_COLUMNS, type Truck, type SortConfig } from './types';

interface TruckTableProps {
	trucks: Truck[];
	visibleColumns: Set<keyof Truck>;
	sort: SortConfig;
	onSort: (field: keyof Truck) => void;
	page: number;
	rowsPerPage: number;
	onPageChange: (page: number) => void;
	onRowsPerPageChange: (rpp: number) => void;
}

const ARRIVAL_COLORS: Record<string, string> = {
	ON_TIME: '#4caf50',
	EARLY: '#2196f3',
	LATE: '#ff9800',
	DELAYED: '#f44336',
};

const RANK_COLORS: Record<number, string> = {
	1: '#f59e0b',
	2: '#94a3b8',
	3: '#cd7f32',
};

function formatTime24(iso: string | null): string {
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

function formatDwell(hours: number | null): string {
	if (hours === null) return '—';
	const h = Math.floor(hours);
	const m = Math.round((hours - h) * 60);
	return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function getCellValue(truck: Truck, key: keyof Truck): string {
	const val = truck[key];
	if (val === null || val === undefined) return '—';

	if (key === 'scheduleTime' || key === 'precheckinTime') {
		return formatTime24(val as string);
	}

	return String(val);
}

/**
 * Yard Queue table — shows only Arrived/PreCheckin trucks ranked by priority.
 */
function TruckTable({
	trucks,
	visibleColumns,
	sort,
	onSort,
	page,
	rowsPerPage,
	onPageChange,
	onRowsPerPageChange,
}: TruckTableProps) {
	const cols = YARD_QUEUE_COLUMNS.filter((c) => visibleColumns.has(c.key));
	const paginated = trucks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

	return (
		<Paper className="w-full overflow-hidden" elevation={0}>
			<TableContainer sx={{ maxHeight: 'calc(100vh - 320px)', overflowX: 'auto' }}>
				<Table stickyHeader size="small" sx={{ tableLayout: 'auto', minWidth: '100%' }}>
					<TableHead>
						<TableRow>
							{cols.map((col) => (
								<TableCell
									key={col.key}
									sx={{
										fontWeight: 700,
										whiteSpace: 'nowrap',
										backgroundColor: 'background.paper',
									}}
								>
									<TableSortLabel
										active={sort.field === col.key}
										direction={sort.field === col.key ? sort.direction : 'asc'}
										onClick={() => onSort(col.key)}
									>
										{col.label}
									</TableSortLabel>
								</TableCell>
							))}
						</TableRow>
					</TableHead>
					<TableBody>
						{paginated.map((truck) => (
							<TableRow
								key={`${truck.vehicleNo}-${truck.isaVrid}`}
								hover
								sx={{
									'&:nth-of-type(odd)': {
										backgroundColor: 'action.hover',
									},
								}}
							>
								{cols.map((col) => (
									<TableCell key={col.key} sx={{ whiteSpace: 'nowrap' }}>
										{col.key === 'rank' ? (
											<Typography
												variant="body2"
												sx={{
													fontWeight: 700,
													color: RANK_COLORS[truck.rank as number] ?? 'text.primary',
													fontSize: (truck.rank as number) <= 3 ? '0.95rem' : undefined,
												}}
											>
												#{truck.rank}
											</Typography>
										) : col.key === 'arrivalStatus' ? (
											<Typography
												variant="body2"
												sx={{
													color: ARRIVAL_COLORS[truck.arrivalStatus] ?? 'text.primary',
													fontWeight: 600,
												}}
											>
												{truck.arrivalStatus.replace('_', ' ')}
											</Typography>
										) : col.key === 'apptType' ? (
											truck.apptType === 'HOT' ? (
												<Chip label="HOT" color="error" size="small" />
											) : (
												<Chip label={truck.apptType} size="small" variant="outlined" />
											)
										) : col.key === 'lowInstockPct' ? (
											<Typography
												variant="body2"
												sx={{
													fontWeight: 600,
													color:
														truck.lowInstockPct >= 55
															? '#f44336'
															: truck.lowInstockPct >= 30
																? '#ff9800'
																: '#4caf50',
												}}
											>
												{truck.lowInstockPct}%
											</Typography>
										) : col.key === 'dwellHours' ? (
											<Typography
												variant="body2"
												sx={{
													fontWeight: truck.dwellHours !== null && truck.dwellHours > 12 ? 600 : 400,
													color:
														truck.dwellHours !== null && truck.dwellHours > 24
															? '#f44336'
															: truck.dwellHours !== null && truck.dwellHours > 12
																? '#ff9800'
																: 'text.primary',
												}}
											>
												{formatDwell(truck.dwellHours)}
											</Typography>
										) : (
											<Typography variant="body2">
												{getCellValue(truck, col.key)}
											</Typography>
										)}
									</TableCell>
								))}
							</TableRow>
						))}
						{paginated.length === 0 && (
							<TableRow>
								<TableCell colSpan={cols.length} align="center" sx={{ py: 6 }}>
									<Typography color="text.secondary">
										No trucks match current filters
									</Typography>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</TableContainer>
			<TablePagination
				component="div"
				count={trucks.length}
				page={page}
				onPageChange={(_, p) => onPageChange(p)}
				rowsPerPage={rowsPerPage}
				onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
				rowsPerPageOptions={[10, 25, 50, 100]}
			/>
		</Paper>
	);
}

export default TruckTable;
