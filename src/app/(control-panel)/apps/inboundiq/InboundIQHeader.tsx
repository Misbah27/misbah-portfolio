'use client';

import { useState } from 'react';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Popover from '@mui/material/Popover';
import FormGroup from '@mui/material/FormGroup';
import Switch from '@mui/material/Switch';
import Box from '@mui/material/Box';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import FilterListIcon from '@mui/icons-material/FilterList';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { FC_OPTIONS, YARD_QUEUE_COLUMNS, type FcOption, type Truck } from './types';

interface InboundIQHeaderProps {
	selectedFc: FcOption;
	onFcChange: (fc: FcOption) => void;
	searchQuery: string;
	onSearchChange: (query: string) => void;
	fastLane: boolean;
	onFastLaneChange: (checked: boolean) => void;
	visibleColumns: Set<keyof Truck>;
	onToggleColumn: (col: keyof Truck) => void;
	onClear: () => void;
	onRefresh: () => void;
	onExportCsv: () => void;
	arrivalFilter: string;
	onArrivalFilterChange: (val: string) => void;
	yardCount: number;
	totalCount: number;
}

/**
 * Header toolbar for InboundIQ yard queue with FC selector, search, and filters.
 */
function InboundIQHeader({
	selectedFc,
	onFcChange,
	searchQuery,
	onSearchChange,
	fastLane,
	onFastLaneChange,
	visibleColumns,
	onToggleColumn,
	onClear,
	onRefresh,
	onExportCsv,
	arrivalFilter,
	onArrivalFilterChange,
	yardCount,
	totalCount,
}: InboundIQHeaderProps) {
	const [colAnchor, setColAnchor] = useState<HTMLButtonElement | null>(null);
	const [filterAnchor, setFilterAnchor] = useState<HTMLButtonElement | null>(null);

	return (
		<div className="flex flex-col gap-4 p-6 w-full">
			<div className="flex items-center justify-between">
				<div>
					<Typography className="text-3xl font-bold tracking-tight">
						InboundIQ
					</Typography>
					<Typography className="text-sm" color="text.secondary">
						Heimdall — Yard Queue ({yardCount} of {totalCount} trucks waiting for dock)
					</Typography>
				</div>
				<Typography variant="caption" color="text.secondary">
					All timestamps in 24-hour format
				</Typography>
			</div>

			<div className="flex flex-wrap items-center gap-3">
				<TextField
					select
					size="small"
					label="Fulfillment Center"
					value={selectedFc}
					onChange={(e) => onFcChange(e.target.value as FcOption)}
					sx={{ minWidth: 180 }}
				>
					{FC_OPTIONS.map((fc) => (
						<MenuItem key={fc} value={fc}>
							{fc}
						</MenuItem>
					))}
				</TextField>

				<TextField
					size="small"
					placeholder="Search ISA/VRID/Vehicle No..."
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
					sx={{ minWidth: 260 }}
					slotProps={{
						input: {
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon fontSize="small" />
								</InputAdornment>
							),
						},
					}}
				/>

				<FormControlLabel
					control={
						<Checkbox
							checked={fastLane}
							onChange={(e) => onFastLaneChange(e.target.checked)}
							size="small"
						/>
					}
					label={<Typography variant="body2">Fast Lane</Typography>}
				/>

				<Box className="flex-1" />

				<Button
					size="small"
					variant="outlined"
					startIcon={<ClearAllIcon />}
					onClick={onClear}
				>
					Clear
				</Button>

				<IconButton
					size="small"
					onClick={(e) => setFilterAnchor(e.currentTarget)}
					title="Filters"
				>
					<FilterListIcon />
				</IconButton>

				<IconButton
					size="small"
					onClick={(e) => setColAnchor(e.currentTarget)}
					title="Toggle Columns"
				>
					<ViewColumnIcon />
				</IconButton>

				<IconButton size="small" onClick={onExportCsv} title="Download CSV">
					<FileDownloadIcon />
				</IconButton>

				<IconButton size="small" onClick={onRefresh} title="Refresh">
					<RefreshIcon />
				</IconButton>
			</div>

			{/* Column toggle popover */}
			<Popover
				open={Boolean(colAnchor)}
				anchorEl={colAnchor}
				onClose={() => setColAnchor(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
			>
				<FormGroup className="p-4 max-h-96 overflow-auto">
					<Typography variant="subtitle2" className="mb-2 font-semibold">
						Toggle Columns
					</Typography>
					{YARD_QUEUE_COLUMNS.map((col) => (
						<FormControlLabel
							key={col.key}
							control={
								<Switch
									size="small"
									checked={visibleColumns.has(col.key)}
									onChange={() => onToggleColumn(col.key)}
								/>
							}
							label={<Typography variant="body2">{col.label}</Typography>}
						/>
					))}
				</FormGroup>
			</Popover>

			{/* Filter popover */}
			<Popover
				open={Boolean(filterAnchor)}
				anchorEl={filterAnchor}
				onClose={() => setFilterAnchor(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
			>
				<div className="p-4 flex flex-col gap-3" style={{ minWidth: 220 }}>
					<Typography variant="subtitle2" className="font-semibold">
						Filters
					</Typography>
					<TextField
						select
						size="small"
						label="Arrival Status"
						value={arrivalFilter}
						onChange={(e) => onArrivalFilterChange(e.target.value)}
						fullWidth
					>
						<MenuItem value="ALL">All</MenuItem>
						<MenuItem value="ON_TIME">On Time</MenuItem>
						<MenuItem value="LATE">Late</MenuItem>
						<MenuItem value="DELAYED">Delayed</MenuItem>
						<MenuItem value="EARLY">Early</MenuItem>
					</TextField>
				</div>
			</Popover>
		</div>
	);
}

export default InboundIQHeader;
