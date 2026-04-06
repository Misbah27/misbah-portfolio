'use client';

import { useState, useMemo, useCallback } from 'react';
import FusePageSimple from '@fuse/core/FusePageSimple';
import { styled } from '@mui/material/styles';
import rolling21Data from '@/data/freightlens/rolling21.json';
import FreightLensHeader from './FreightLensHeader';
import Rolling21Table from './Rolling21Table';
import RiskAnalysisPanel from './RiskAnalysisPanel';
import ForecastSummary from './ForecastSummary';
import {
	DATES_PER_PAGE,
	METRIC_ROWS,
	FC_ZONE_MAP,
	type Rolling21Data,
	type FcId,
	type FcType,
	type Zone,
	type WarehouseType,
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
}));

const data = rolling21Data as Rolling21Data;

/**
 * FreightLens Rolling 21 Days — main page.
 * Displays a grid of FC × metric rows × 21 date columns with color-coded cells,
 * filters, pagination across date windows, and CSV export.
 */
function FreightLensPage() {
	const [selectedFcs, setSelectedFcs] = useState<FcId[]>(['SEA1', 'PDX2', 'LAX3', 'ORD2']);
	const [fcType, setFcType] = useState<FcType>('EFP&AFT');
	const [zone, setZone] = useState<Zone>('All');
	const [warehouseType, setWarehouseType] = useState<WarehouseType>('FC');
	const [pageIndex, setPageIndex] = useState(0);

	// Total date columns = 21, paginated in groups of DATES_PER_PAGE
	const totalPages = useMemo(() => {
		const firstFc = selectedFcs[0];
		if (!firstFc || !data[firstFc]) return 1;
		return Math.ceil(data[firstFc].length / DATES_PER_PAGE);
	}, [selectedFcs]);

	// Filter FCs by zone when zone filter changes
	const filteredFcs = useMemo(() => {
		if (zone === 'All') return selectedFcs;
		return selectedFcs.filter((fc) => FC_ZONE_MAP[fc] === zone);
	}, [selectedFcs, zone]);

	const handleSubmit = useCallback(() => {
		setPageIndex(0);
	}, []);

	const handleExportCsv = useCallback(() => {
		const firstFc = filteredFcs[0];
		if (!firstFc || !data[firstFc]) return;

		const allDates = data[firstFc].map((e) => e.date);
		const header = ['FC', 'Metric', ...allDates].join(',');
		const rows: string[] = [];

		filteredFcs.forEach((fc) => {
			const entries = data[fc] || [];
			const byDate: Record<string, Record<string, number>> = {};
			entries.forEach((e) => {
				byDate[e.date] = {
					bmPortal: e.bmPortal,
					vendorScheduled: e.vendorScheduled,
					saBlocked: e.saBlocked,
					saScheduled: e.saScheduled,
					saUnitsLeft: e.saUnitsLeft,
					totalUnitsLeft: e.totalUnitsLeft,
					utilizationPct: e.utilizationPct,
				};
			});

			METRIC_ROWS.forEach((metric) => {
				const values = allDates.map((d) => byDate[d]?.[metric.key] ?? '');
				rows.push([fc, metric.label, ...values].join(','));
			});
		});

		const csv = [header, ...rows].join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `freightlens-rolling21-${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}, [filteredFcs]);

	return (
		<Root
			scroll="content"
			header={
				<FreightLensHeader
					selectedFcs={selectedFcs}
					onFcsChange={setSelectedFcs}
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
					onSubmit={handleSubmit}
					extraActions={
						<RiskAnalysisPanel data={data} selectedFcs={filteredFcs} />
					}
				/>
			}
			content={
				<div className="w-full p-3">
					<ForecastSummary data={data} selectedFcs={filteredFcs} />
					<Rolling21Table
						data={data}
						selectedFcs={filteredFcs}
						pageIndex={pageIndex}
					/>
				</div>
			}
		/>
	);
}

export default FreightLensPage;
