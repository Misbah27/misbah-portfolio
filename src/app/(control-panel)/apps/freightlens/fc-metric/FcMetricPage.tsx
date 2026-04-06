'use client';

import { useState, useMemo, useCallback } from 'react';
import FusePageSimple from '@fuse/core/FusePageSimple';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import metricsData from '@/data/freightlens/metrics.json';
import FreightLensSubHeader from '../FreightLensSubHeader';
import CollapsibleAbout from '../CollapsibleAbout';
import MetricTable from './MetricTable';
import NlMetricQuery from './NlMetricQuery';
import {
	FC_METRIC_DEFS,
	STANDING_DATES_PER_PAGE,
	FC_ZONE_MAP,
	type FcMetricsData,
	type FcId,
	type FcType,
	type Zone,
	type WarehouseType,
} from '../types';

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
}));

const data = metricsData as FcMetricsData;

/**
 * FC Metric page — per-FC operational metrics across date columns.
 * Single-FC selector (not multi) with metric search filter.
 */
function FcMetricPage() {
	const [selectedFcs, setSelectedFcs] = useState<FcId[]>(['SEA1']);
	const [fcType, setFcType] = useState<FcType>('EFP&AFT');
	const [zone, setZone] = useState<Zone>('All');
	const [warehouseType, setWarehouseType] = useState<WarehouseType>('FC');
	const [pageIndex, setPageIndex] = useState(0);
	const [searchQuery, setSearchQuery] = useState('');
	const [highlightedFCs, setHighlightedFCs] = useState<string[]>([]);

	const selectedFc = selectedFcs[0] || 'SEA1';

	const totalPages = useMemo(() => {
		const entries = data[selectedFc] || [];
		return Math.ceil(entries.length / STANDING_DATES_PER_PAGE) || 1;
	}, [selectedFc]);

	const handleExportCsv = useCallback(() => {
		const entries = data[selectedFc] || [];
		const allDates = entries.map((e) => e.date);
		const header = ['Metric', ...allDates].join(',');
		const rows: string[] = [];

		FC_METRIC_DEFS.forEach((metric) => {
			const values = entries.map((e) => {
				const v = (e as Record<string, number | string>)[metric.key];
				return metric.format === 'percent' ? `${v}%` : v;
			});
			rows.push([metric.label, ...values].join(','));
		});

		const csv = [header, ...rows].join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `freightlens-fc-metric-${selectedFc}-${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}, [selectedFc]);

	return (
		<Root
			scroll="content"
			header={
				<FreightLensSubHeader
					title="FreightLens"
					subtitle={`FC Metric — ${selectedFc}`}
					selectedFcs={selectedFcs}
					onFcsChange={(fcs) => {
						// Single-select: take the last clicked
						setSelectedFcs(fcs.length > 0 ? [fcs[fcs.length - 1]] : ['SEA1']);
						setPageIndex(0);
					}}
					fcType={fcType}
					onFcTypeChange={setFcType}
					zone={zone}
					onZoneChange={setZone}
					warehouseType={warehouseType}
					onWarehouseTypeChange={setWarehouseType}
					pageIndex={pageIndex}
					totalPages={totalPages}
					onPageChange={setPageIndex}
					onExportCsv={handleExportCsv}
					onSubmit={() => setPageIndex(0)}
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
					searchPlaceholder="Search metrics..."
				/>
			}
			content={
				<div className="w-full p-3">
					<NlMetricQuery
						data={data}
						selectedFc={selectedFc}
						onHighlight={setHighlightedFCs}
					/>
					<MetricTable
						data={data}
						selectedFc={selectedFc}
						pageIndex={pageIndex}
						searchQuery={searchQuery}
						highlighted={highlightedFCs.includes(selectedFc)}
					/>
					<CollapsibleAbout title="About FC Metrics">
						<Typography variant="body2" color="text.secondary" className="mb-2">
							FC Metrics provide a comprehensive view of each fulfillment center&apos;s operational
							health. Key indicators include Planned Capacity, Total Scheduled Qty, and utilization
							percentages across day and night shifts.
						</Typography>
						<Typography variant="body2" color="text.secondary" className="mb-2">
							<strong>NCNS %</strong> (No Call No Show) tracks vendor appointment reliability.
							Values above 15% are flagged amber as they indicate scheduling risk.
							<strong> Hot POs</strong> above 30 indicate elevated urgency.
						</Typography>
						<Typography variant="body2" color="text.secondary">
							<strong>End Backlog</strong> and <strong>Max NYR</strong> (Not Yet Received) reflect
							unfulfilled inbound volume. DS/NS Allocation % shows the split between day-shift
							and night-shift processing capacity.
						</Typography>
					</CollapsibleAbout>
				</div>
			}
		/>
	);
}

export default FcMetricPage;
