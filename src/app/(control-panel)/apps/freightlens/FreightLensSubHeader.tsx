'use client';

import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SearchIcon from '@mui/icons-material/Search';
import {
	FC_IDS,
	FC_TYPE_OPTIONS,
	ZONE_OPTIONS,
	WAREHOUSE_TYPE_OPTIONS,
	type FcId,
	type FcType,
	type Zone,
	type WarehouseType,
} from './types';

interface FreightLensSubHeaderProps {
	title: string;
	subtitle: string;
	selectedFcs: FcId[];
	onFcsChange: (fcs: FcId[]) => void;
	fcType: FcType;
	onFcTypeChange: (v: FcType) => void;
	zone: Zone;
	onZoneChange: (v: Zone) => void;
	warehouseType: WarehouseType;
	onWarehouseTypeChange: (v: WarehouseType) => void;
	pageIndex: number;
	totalPages: number;
	onPageChange: (p: number) => void;
	onExportCsv: () => void;
	onSubmit: () => void;
	searchQuery?: string;
	onSearchChange?: (q: string) => void;
	searchPlaceholder?: string;
}

/**
 * Shared header component for FreightLens sub-pages.
 * Includes title, filter bar, FC chips, pagination, optional search, and CSV export.
 */
function FreightLensSubHeader({
	title,
	subtitle,
	selectedFcs,
	onFcsChange,
	fcType,
	onFcTypeChange,
	zone,
	onZoneChange,
	warehouseType,
	onWarehouseTypeChange,
	pageIndex,
	totalPages,
	onPageChange,
	onExportCsv,
	onSubmit,
	searchQuery,
	onSearchChange,
	searchPlaceholder,
}: FreightLensSubHeaderProps) {
	const handleFcToggle = (fc: FcId) => {
		if (selectedFcs.includes(fc)) {
			if (selectedFcs.length > 1) {
				onFcsChange(selectedFcs.filter((f) => f !== fc));
			}
		} else {
			onFcsChange([...selectedFcs, fc]);
		}
	};

	return (
		<div className="flex flex-col gap-1 py-2 px-6 w-full">
			<div className="flex items-center gap-3">
				<Typography className="text-lg font-bold tracking-tight">
					FreightLens
				</Typography>
				<Typography variant="caption" color="text.secondary">
					{subtitle}
				</Typography>
			</div>

			{/* Filter bar */}
			<div className="flex flex-wrap items-center gap-2">
				<TextField
					select
					size="small"
					label="FC Type"
					value={fcType}
					onChange={(e) => onFcTypeChange(e.target.value as FcType)}
					sx={{ minWidth: 130 }}
				>
					{FC_TYPE_OPTIONS.map((opt) => (
						<MenuItem key={opt} value={opt}>{opt}</MenuItem>
					))}
				</TextField>

				<TextField
					select
					size="small"
					label="Zone"
					value={zone}
					onChange={(e) => onZoneChange(e.target.value as Zone)}
					sx={{ minWidth: 120 }}
				>
					{ZONE_OPTIONS.map((opt) => (
						<MenuItem key={opt} value={opt}>{opt}</MenuItem>
					))}
				</TextField>

				<TextField
					select
					size="small"
					label="Warehouse Type"
					value={warehouseType}
					onChange={(e) => onWarehouseTypeChange(e.target.value as WarehouseType)}
					sx={{ minWidth: 150 }}
				>
					{WAREHOUSE_TYPE_OPTIONS.map((opt) => (
						<MenuItem key={opt} value={opt}>{opt}</MenuItem>
					))}
				</TextField>

				{onSearchChange !== undefined && (
					<TextField
						size="small"
						placeholder={searchPlaceholder || 'Search...'}
						value={searchQuery || ''}
						onChange={(e) => onSearchChange(e.target.value)}
						sx={{ minWidth: 200 }}
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
				)}

				<Button size="small" variant="contained" onClick={onSubmit}>
					Submit
				</Button>
			</div>

			{/* FC selector chips + pagination + CSV */}
			<div className="flex flex-wrap items-center gap-2">
				<div className="flex flex-wrap gap-1 flex-1">
					{FC_IDS.map((fc) => (
						<Chip
							key={fc}
							label={fc}
							size="small"
							color={selectedFcs.includes(fc) ? 'primary' : 'default'}
							variant={selectedFcs.includes(fc) ? 'filled' : 'outlined'}
							onClick={() => handleFcToggle(fc)}
						/>
					))}
				</div>

				<div className="flex items-center gap-1">
					<IconButton
						size="small"
						disabled={pageIndex === 0}
						onClick={() => onPageChange(pageIndex - 1)}
					>
						<NavigateBeforeIcon />
					</IconButton>
					<Typography variant="body2" className="min-w-[40px] text-center">
						{pageIndex + 1} / {totalPages}
					</Typography>
					<IconButton
						size="small"
						disabled={pageIndex >= totalPages - 1}
						onClick={() => onPageChange(pageIndex + 1)}
					>
						<NavigateNextIcon />
					</IconButton>
				</div>

				<IconButton size="small" onClick={onExportCsv} title="Download CSV">
					<FileDownloadIcon />
				</IconButton>
			</div>
		</div>
	);
}

export default FreightLensSubHeader;
