'use client';

import { useState, useMemo, useCallback } from 'react';
import FusePageSimple from '@fuse/core/FusePageSimple';
import { styled } from '@mui/material/styles';
import trucksData from '@/data/inboundiq/trucks.json';
import InboundIQHeader from './InboundIQHeader';
import TruckTable from './TruckTable';
import DockStatusPanel from './DockStatusPanel';
import NlYardFilter from './NlYardFilter';
import AskTheYardDrawer from './AskTheYardDrawer';
import {
	YARD_QUEUE_COLUMNS,
	DOORS_PER_FC,
	type Truck,
	type SortConfig,
	type FcOption,
} from './types';

const Root = styled(FusePageSimple)(({ theme }) => ({
	'&.FusePageSimple-scroll-content': {
		height: '100%',
	},
	'& .FusePageSimple-header': {
		backgroundColor: theme.vars.palette.background.paper,
		borderBottomWidth: 1,
		borderStyle: 'solid',
		borderColor: theme.vars.palette.divider,
	},
	'& .FusePageSimple-content': {
		backgroundColor: theme.vars.palette.background.default,
	},
	'& .FusePageSimple-rightSidebar': {
		backgroundColor: theme.vars.palette.background.paper,
		borderLeftWidth: 1,
		borderStyle: 'solid',
		borderColor: theme.vars.palette.divider,
	},
}));

const allTrucks = trucksData as Truck[];

function compareTrucks(a: Truck, b: Truck, field: keyof Truck): number {
	const aVal = a[field];
	const bVal = b[field];

	if (aVal === null && bVal === null) return 0;
	if (aVal === null) return 1;
	if (bVal === null) return -1;

	if (typeof aVal === 'number' && typeof bVal === 'number') return aVal - bVal;
	return String(aVal).localeCompare(String(bVal));
}

function truckToCsvRow(truck: Truck, cols: { key: keyof Truck; label: string }[]): string {
	return cols
		.map((col) => {
			const val = truck[col.key];
			if (val === null || val === undefined) return '';
			const str = String(val);
			return str.includes(',') ? `"${str}"` : str;
		})
		.join(',');
}

/**
 * InboundIQ Dashboard — Yard Queue (main) + Dock Status Panel (sidebar).
 * Shows only Arrived/PreCheckin trucks ranked by the priority model.
 * Dock panel shows which doors are occupied and when they free up.
 */
function InboundIQPage() {
	const [selectedFc, setSelectedFc] = useState<FcOption>('SEA1');
	const [searchQuery, setSearchQuery] = useState('');
	const [fastLane, setFastLane] = useState(false);
	const [arrivalFilter, setArrivalFilter] = useState('ALL');
	const [sort, setSort] = useState<SortConfig>({ field: 'rank', direction: 'asc' });
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(25);

	const defaultCols = new Set<keyof Truck>(YARD_QUEUE_COLUMNS.map((c) => c.key));
	const [visibleColumns, setVisibleColumns] = useState<Set<keyof Truck>>(defaultCols);
	const [nlFilterVrids, setNlFilterVrids] = useState<string[] | null>(null);
	const [nlFilterQuery, setNlFilterQuery] = useState<string | null>(null);

	// Yard trucks: Arrived/PreCheckin for selected FC (ranked, waiting for a door)
	const yardTrucks = useMemo(
		() =>
			allTrucks.filter(
				(t) =>
					t.fcId === selectedFc &&
					(t.dmStatus === 'Arrived' || t.dmStatus === 'PreCheckin')
			),
		[selectedFc]
	);

	// CheckedIn trucks for dock panel (always unfiltered for selected FC)
	const checkedInTrucks = useMemo(
		() => allTrucks.filter((t) => t.fcId === selectedFc && t.dmStatus === 'CheckedIn'),
		[selectedFc]
	);

	// Apply search/filter to yard trucks only
	const filteredYardTrucks = useMemo(() => {
		let result = yardTrucks;

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			result = result.filter(
				(t) =>
					t.vehicleNo.toLowerCase().includes(q) ||
					t.isaVrid.toLowerCase().includes(q)
			);
		}

		if (fastLane) {
			result = result.filter((t) => t.apptType === 'HOT');
		}

		if (arrivalFilter !== 'ALL') {
			result = result.filter((t) => t.arrivalStatus === arrivalFilter);
		}

		// Apply NL filter (AI-powered)
		if (nlFilterVrids !== null) {
			const vridSet = new Set(nlFilterVrids);
			result = result.filter((t) => vridSet.has(t.isaVrid));
		}

		return [...result].sort((a, b) => {
			const cmp = compareTrucks(a, b, sort.field);
			return sort.direction === 'asc' ? cmp : -cmp;
		});
	}, [yardTrucks, searchQuery, fastLane, arrivalFilter, sort, nlFilterVrids]);

	const handleSort = useCallback((field: keyof Truck) => {
		setSort((prev) =>
			prev.field === field
				? { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
				: { field, direction: 'asc' }
		);
		setPage(0);
	}, []);

	const handleToggleColumn = useCallback((col: keyof Truck) => {
		setVisibleColumns((prev) => {
			const next = new Set(prev);
			if (next.has(col)) {
				next.delete(col);
			} else {
				next.add(col);
			}
			return next;
		});
	}, []);

	const handleClear = useCallback(() => {
		setSelectedFc('SEA1');
		setSearchQuery('');
		setFastLane(false);
		setArrivalFilter('ALL');
		setSort({ field: 'rank', direction: 'asc' });
		setPage(0);
	}, []);

	const handleNlFilter = useCallback((matchingVrids: string[] | null, query: string) => {
		setNlFilterVrids(matchingVrids);
		setNlFilterQuery(query || null);
		setPage(0);
	}, []);

	const handleExportCsv = useCallback(() => {
		const cols = YARD_QUEUE_COLUMNS.filter((c) => visibleColumns.has(c.key));
		const header = cols.map((c) => c.label).join(',');
		const rows = filteredYardTrucks.map((t) => truckToCsvRow(t, cols));
		const csv = [header, ...rows].join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `inboundiq-yard-${selectedFc}-${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}, [filteredYardTrucks, visibleColumns, selectedFc]);

	// Total FC trucks (yard + docked, excluding scheduled)
	const fcTotalPresent = yardTrucks.length + checkedInTrucks.length;

	return (
		<Root
			scroll="content"
			header={
				<InboundIQHeader
					selectedFc={selectedFc}
					onFcChange={(fc) => {
						setSelectedFc(fc);
						setPage(0);
					}}
					searchQuery={searchQuery}
					onSearchChange={(q) => {
						setSearchQuery(q);
						setPage(0);
					}}
					fastLane={fastLane}
					onFastLaneChange={setFastLane}
					visibleColumns={visibleColumns}
					onToggleColumn={handleToggleColumn}
					onClear={handleClear}
					onRefresh={() => setPage(0)}
					onExportCsv={handleExportCsv}
					arrivalFilter={arrivalFilter}
					onArrivalFilterChange={(v) => {
						setArrivalFilter(v);
						setPage(0);
					}}
					yardCount={yardTrucks.length}
					totalCount={fcTotalPresent}
				/>
			}
			content={
				<div className="w-full px-2 py-4">
					<div className="mb-3 px-2">
						<NlYardFilter
							yardTrucks={yardTrucks}
							onFilter={handleNlFilter}
							activeQuery={nlFilterQuery}
							matchCount={filteredYardTrucks.length}
							totalCount={yardTrucks.length}
						/>
					</div>
					<TruckTable
						trucks={filteredYardTrucks}
						visibleColumns={visibleColumns}
						sort={sort}
						onSort={handleSort}
						page={page}
						rowsPerPage={rowsPerPage}
						onPageChange={setPage}
						onRowsPerPageChange={(rpp) => {
							setRowsPerPage(rpp);
							setPage(0);
						}}
					/>
					<AskTheYardDrawer
						yardTrucks={yardTrucks}
						dockedTrucks={checkedInTrucks}
						fcId={selectedFc}
					/>
				</div>
			}
			rightSidebarContent={
				<DockStatusPanel
					checkedInTrucks={checkedInTrucks}
					totalDoors={DOORS_PER_FC[selectedFc]}
					yardTrucks={yardTrucks}
					fcId={selectedFc}
				/>
			}
			rightSidebarOpen
			rightSidebarWidth={420}
			rightSidebarVariant="permanent"
		/>
	);
}

export default InboundIQPage;
