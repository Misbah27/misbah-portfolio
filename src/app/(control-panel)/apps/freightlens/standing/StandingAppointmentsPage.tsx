'use client';

import { useState, useMemo, useCallback } from 'react';
import FusePageSimple from '@fuse/core/FusePageSimple';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import standingData from '@/data/freightlens/standing.json';
import FreightLensSubHeader from '../FreightLensSubHeader';
import CollapsibleAbout from '../CollapsibleAbout';
import StandingTable from './StandingTable';
import {
	VENDOR_TYPES,
	BREAKDOWN_TYPES,
	STANDING_DATES_PER_PAGE,
	FC_ZONE_MAP,
	type StandingData,
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

const data = standingData as StandingData;

/**
 * Standing Appointments page — FC × Vendor(PCP/PSP) × Breakdown(Blocked/Scheduled) grid.
 */
function StandingAppointmentsPage() {
	const [selectedFcs, setSelectedFcs] = useState<FcId[]>(['SEA1', 'PDX2', 'LAX3', 'ORD2']);
	const [fcType, setFcType] = useState<FcType>('EFP&AFT');
	const [zone, setZone] = useState<Zone>('All');
	const [warehouseType, setWarehouseType] = useState<WarehouseType>('FC');
	const [pageIndex, setPageIndex] = useState(0);

	const filteredFcs = useMemo(() => {
		if (zone === 'All') return selectedFcs;
		return selectedFcs.filter((fc) => FC_ZONE_MAP[fc] === zone);
	}, [selectedFcs, zone]);

	const totalPages = useMemo(() => {
		const fc = filteredFcs[0];
		if (!fc || !data[fc]) return 1;
		const firstVendor = VENDOR_TYPES[0];
		const firstBd = BREAKDOWN_TYPES[0];
		const dates = data[fc]?.[firstVendor]?.[firstBd] || [];
		return Math.ceil(dates.length / STANDING_DATES_PER_PAGE);
	}, [filteredFcs]);

	const handleExportCsv = useCallback(() => {
		const fc = filteredFcs[0];
		if (!fc || !data[fc]) return;
		const firstVendor = VENDOR_TYPES[0];
		const firstBd = BREAKDOWN_TYPES[0];
		const allDates = (data[fc]?.[firstVendor]?.[firstBd] || []).map((e) => e.date);
		const header = ['FC', 'Vendor', 'Breakdown', ...allDates].join(',');
		const rows: string[] = [];

		filteredFcs.forEach((fcId) => {
			VENDOR_TYPES.forEach((vendor) => {
				BREAKDOWN_TYPES.forEach((bd) => {
					const entries = data[fcId]?.[vendor]?.[bd] || [];
					const byDate: Record<string, number> = {};
					entries.forEach((e) => { byDate[e.date] = e.units; });
					const values = allDates.map((d) => byDate[d] ?? '');
					rows.push([fcId, vendor, bd, ...values].join(','));
				});
			});
		});

		const csv = [header, ...rows].join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `freightlens-standing-${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}, [filteredFcs]);

	return (
		<Root
			scroll="content"
			header={
				<FreightLensSubHeader
					title="FreightLens"
					subtitle="Standing Appointments"
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
					onSubmit={() => setPageIndex(0)}
				/>
			}
			content={
				<div className="w-full p-3">
					<StandingTable
						data={data}
						selectedFcs={filteredFcs}
						pageIndex={pageIndex}
					/>
					<CollapsibleAbout title="About SA Breakdown">
						<Typography variant="body2" color="text.secondary" className="mb-2">
							Standing Appointments (SA) represent recurring vendor delivery commitments at each
							fulfillment center. Each vendor — PCP (Primary Carrier Partner) or PSP (Preferred
							Service Provider) — has a fixed schedule of blocked and scheduled slots.
						</Typography>
						<Typography variant="body2" color="text.secondary" className="mb-2">
							<strong>Blocked</strong> slots are reserved capacity that the FC has allocated for the
							vendor but which the vendor has not yet filled with a confirmed appointment.
							<strong> Scheduled</strong> slots represent confirmed vendor deliveries.
						</Typography>
						<Typography variant="body2" color="text.secondary">
							A high ratio of Blocked-to-Scheduled may indicate vendor commitment issues.
							Cells showing <span style={{ color: '#d32f2f', fontWeight: 600 }}>0 units</span> are
							flagged red to highlight gaps in the standing appointment schedule.
						</Typography>
					</CollapsibleAbout>
				</div>
			}
		/>
	);
}

export default StandingAppointmentsPage;
