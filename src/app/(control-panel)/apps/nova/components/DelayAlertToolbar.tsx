'use client';

import { useState } from 'react';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import {
	ZONE_OPTIONS,
	SCAC_OPTIONS,
	REASON_OPTIONS,
	type DelayAlertFilters,
	type Zone,
	type Scac,
	type ReasonCodedBy,
} from '../types';

interface DelayAlertToolbarProps {
	searchQuery: string;
	onSearchChange: (query: string) => void;
	filters: DelayAlertFilters;
	onFiltersChange: (filters: DelayAlertFilters) => void;
	onExport: () => void;
}

/**
 * Toolbar with search, filter popover, and download button.
 */
function DelayAlertToolbar({
	searchQuery,
	onSearchChange,
	filters,
	onFiltersChange,
	onExport,
}: DelayAlertToolbarProps) {
	const [filterAnchor, setFilterAnchor] = useState<HTMLButtonElement | null>(null);

	return (
		<div className="flex flex-wrap items-center gap-3">
			<TextField
				size="small"
				placeholder="Search VRID or Destination..."
				value={searchQuery}
				onChange={(e) => onSearchChange(e.target.value)}
				sx={{ minWidth: 260 }}
				slotProps={{
					input: {
						startAdornment: (
							<InputAdornment position="start">
								<FuseSvgIcon size={18}>heroicons-outline:magnifying-glass</FuseSvgIcon>
							</InputAdornment>
						),
					},
				}}
			/>

			<IconButton
				size="small"
				onClick={(e) => setFilterAnchor(e.currentTarget)}
				title="Filters"
			>
				<FuseSvgIcon size={20}>heroicons-outline:funnel</FuseSvgIcon>
			</IconButton>

			<div className="flex-1" />

			<Button
				size="small"
				variant="contained"
				onClick={onExport}
				startIcon={<FuseSvgIcon size={18}>heroicons-outline:arrow-down-tray</FuseSvgIcon>}
				sx={{ bgcolor: '#0d9488', '&:hover': { bgcolor: '#0f766e' }, textTransform: 'none' }}
			>
				Download Report
			</Button>

			<Popover
				open={Boolean(filterAnchor)}
				anchorEl={filterAnchor}
				onClose={() => setFilterAnchor(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
			>
				<div className="p-4 flex flex-col gap-3" style={{ minWidth: 240 }}>
					<Typography variant="subtitle2" className="font-semibold">
						Filters
					</Typography>
					<TextField
						select
						size="small"
						label="Zone"
						value={filters.zone}
						onChange={(e) => onFiltersChange({ ...filters, zone: e.target.value as Zone | 'ALL' })}
						fullWidth
					>
						<MenuItem value="ALL">All Zones</MenuItem>
						{ZONE_OPTIONS.map((z) => (
							<MenuItem key={z} value={z}>{z}</MenuItem>
						))}
					</TextField>
					<TextField
						select
						size="small"
						label="SCAC"
						value={filters.scac}
						onChange={(e) => onFiltersChange({ ...filters, scac: e.target.value as Scac | 'ALL' })}
						fullWidth
					>
						<MenuItem value="ALL">All SCACs</MenuItem>
						{SCAC_OPTIONS.map((s) => (
							<MenuItem key={s} value={s}>{s}</MenuItem>
						))}
					</TextField>
					<TextField
						select
						size="small"
						label="Reason Coded By"
						value={filters.reason}
						onChange={(e) => onFiltersChange({ ...filters, reason: e.target.value as ReasonCodedBy | 'ALL' })}
						fullWidth
					>
						<MenuItem value="ALL">All Reasons</MenuItem>
						{REASON_OPTIONS.map((r) => (
							<MenuItem key={r} value={r}>{r}</MenuItem>
						))}
					</TextField>
				</div>
			</Popover>
		</div>
	);
}

export default DelayAlertToolbar;
