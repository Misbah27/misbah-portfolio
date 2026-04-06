'use client';

import { useMemo } from 'react';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import {
	INDUSTRY_TAGS,
	INDUSTRY_LABELS,
	INDUSTRY_COLORS,
	type IndustryTag,
	type DataClassification,
	type RegulatoryFlag,
} from '../../types';

export type SortOption = 'relevance' | 'name' | 'lastUpdated' | 'qualityScore' | 'rowCount';

export interface CatalogFilters {
	search: string;
	industries: IndustryTag[];
	classifications: DataClassification[];
	regulatoryFlags: RegulatoryFlag[];
	hasImages: boolean;
	piiOnly: boolean;
	sortBy: SortOption;
}

export const INITIAL_FILTERS: CatalogFilters = {
	search: '',
	industries: [...INDUSTRY_TAGS].filter((t) => t !== 'OTHER') as IndustryTag[],
	classifications: [],
	regulatoryFlags: [],
	hasImages: false,
	piiOnly: false,
	sortBy: 'relevance',
};

interface Props {
	filters: CatalogFilters;
	onChange: (f: CatalogFilters) => void;
}

const CLASSIFICATIONS: DataClassification[] = ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'PII'];
const REGULATORY: RegulatoryFlag[] = ['GDPR', 'HIPAA', 'PCI_DSS', 'SOX', 'FERPA'];
const classColors: Record<DataClassification, string> = { PUBLIC: '#4CAF50', INTERNAL: '#2196F3', CONFIDENTIAL: '#FF9800', PII: '#F44336' };

/**
 * Left sidebar with search and filters for the Data Catalog.
 */
export default function CatalogSidebar({ filters, onChange }: Props) {
	const filtersActive = useMemo(() => {
		return (
			filters.search !== '' ||
			filters.industries.length !== INDUSTRY_TAGS.length - 1 ||
			filters.classifications.length > 0 ||
			filters.regulatoryFlags.length > 0 ||
			filters.hasImages ||
			filters.piiOnly ||
			filters.sortBy !== 'relevance'
		);
	}, [filters]);

	const toggle = <T,>(arr: T[], val: T): T[] =>
		arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

	return (
		<div className="w-[280px] p-4 space-y-4 overflow-y-auto h-full">
			<TextField
				size="small"
				fullWidth
				placeholder="Search datasets..."
				value={filters.search}
				onChange={(e) => onChange({ ...filters, search: e.target.value })}
				InputProps={{
					startAdornment: (
						<InputAdornment position="start">
							<FuseSvgIcon size={18}>heroicons-outline:magnifying-glass</FuseSvgIcon>
						</InputAdornment>
					),
				}}
			/>

			<div>
				<Typography variant="caption" color="text.secondary" className="mb-1 block font-semibold">
					Industry
				</Typography>
				<div className="flex flex-wrap gap-1">
					{INDUSTRY_TAGS.filter((t) => t !== 'OTHER').map((tag) => (
						<Chip
							key={tag}
							label={INDUSTRY_LABELS[tag]}
							size="small"
							onClick={() => onChange({ ...filters, industries: toggle(filters.industries, tag) })}
							sx={{
								backgroundColor: filters.industries.includes(tag) ? INDUSTRY_COLORS[tag] : undefined,
								color: filters.industries.includes(tag) ? '#fff' : undefined,
								fontSize: '0.7rem',
							}}
							variant={filters.industries.includes(tag) ? 'filled' : 'outlined'}
						/>
					))}
				</div>
			</div>

			<div>
				<Typography variant="caption" color="text.secondary" className="mb-1 block font-semibold">
					Classification
				</Typography>
				<div className="flex flex-wrap gap-1">
					{CLASSIFICATIONS.map((c) => (
						<Chip
							key={c}
							label={c}
							size="small"
							onClick={() => onChange({ ...filters, classifications: toggle(filters.classifications, c) })}
							sx={{
								backgroundColor: filters.classifications.includes(c) ? classColors[c] : undefined,
								color: filters.classifications.includes(c) ? '#fff' : undefined,
								fontSize: '0.7rem',
							}}
							variant={filters.classifications.includes(c) ? 'filled' : 'outlined'}
						/>
					))}
				</div>
			</div>

			<div>
				<Typography variant="caption" color="text.secondary" className="mb-1 block font-semibold">
					Regulatory
				</Typography>
				<div className="flex flex-wrap gap-1">
					{REGULATORY.map((r) => (
						<Chip
							key={r}
							label={r}
							size="small"
							onClick={() => onChange({ ...filters, regulatoryFlags: toggle(filters.regulatoryFlags, r) })}
							variant={filters.regulatoryFlags.includes(r) ? 'filled' : 'outlined'}
							color={filters.regulatoryFlags.includes(r) ? 'primary' : 'default'}
						/>
					))}
				</div>
			</div>

			<FormControlLabel
				control={<Switch size="small" checked={filters.hasImages} onChange={(_, v) => onChange({ ...filters, hasImages: v })} />}
				label={<Typography variant="body2">Has Images</Typography>}
			/>
			<FormControlLabel
				control={<Switch size="small" checked={filters.piiOnly} onChange={(_, v) => onChange({ ...filters, piiOnly: v })} />}
				label={<Typography variant="body2">PII Only</Typography>}
			/>

			<FormControl size="small" fullWidth>
				<InputLabel>Sort By</InputLabel>
				<Select
					value={filters.sortBy}
					label="Sort By"
					onChange={(e) => onChange({ ...filters, sortBy: e.target.value as SortOption })}
				>
					<MenuItem value="relevance">Relevance</MenuItem>
					<MenuItem value="name">Name</MenuItem>
					<MenuItem value="lastUpdated">Last Updated</MenuItem>
					<MenuItem value="qualityScore">Quality Score</MenuItem>
					<MenuItem value="rowCount">Row Count</MenuItem>
				</Select>
			</FormControl>

			{filtersActive && (
				<Button variant="text" size="small" fullWidth onClick={() => onChange(INITIAL_FILTERS)}>
					Clear Filters
				</Button>
			)}
		</div>
	);
}
