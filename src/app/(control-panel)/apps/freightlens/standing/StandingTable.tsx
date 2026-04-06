'use client';

import { useMemo } from 'react';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import {
	VENDOR_TYPES,
	BREAKDOWN_TYPES,
	STANDING_DATES_PER_PAGE,
	type StandingData,
	type FcId,
} from '../types';

interface StandingTableProps {
	data: StandingData;
	selectedFcs: FcId[];
	pageIndex: number;
}

/** Format date to compact header. */
function formatDateHeader(dateStr: string): { day: string; date: string } {
	const d = new Date(dateStr + 'T00:00:00');
	const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	return {
		day: dayNames[d.getDay()],
		date: `${d.getMonth() + 1}/${d.getDate()}`,
	};
}

/**
 * Standing Appointments grid table.
 * FC > Vendor(PCP/PSP) > Breakdown(Blocked/Scheduled) × date columns.
 */
function StandingTable({ data, selectedFcs, pageIndex }: StandingTableProps) {
	const theme = useTheme();

	const allDates = useMemo(() => {
		const fc = selectedFcs[0];
		if (!fc || !data[fc]) return [];
		const firstVendor = VENDOR_TYPES[0];
		const firstBd = BREAKDOWN_TYPES[0];
		return (data[fc]?.[firstVendor]?.[firstBd] || []).map((e) => e.date);
	}, [data, selectedFcs]);

	const visibleDates = useMemo(() => {
		const start = pageIndex * STANDING_DATES_PER_PAGE;
		return allDates.slice(start, start + STANDING_DATES_PER_PAGE);
	}, [allDates, pageIndex]);

	// Build lookup: fc -> vendor -> breakdown -> date -> units
	const lookup = useMemo(() => {
		const map: Record<string, Record<string, Record<string, Record<string, number>>>> = {};
		selectedFcs.forEach((fc) => {
			map[fc] = {};
			VENDOR_TYPES.forEach((v) => {
				map[fc][v] = {};
				BREAKDOWN_TYPES.forEach((bd) => {
					map[fc][v][bd] = {};
					(data[fc]?.[v]?.[bd] || []).forEach((entry) => {
						map[fc][v][bd][entry.date] = entry.units;
					});
				});
			});
		});
		return map;
	}, [data, selectedFcs]);

	if (visibleDates.length === 0) {
		return (
			<div className="p-6 text-center">
				<Typography color="text.secondary">No data available</Typography>
			</div>
		);
	}

	const headerBg = theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)';
	const borderColor = theme.palette.divider;
	const fcHeaderBg = theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

	return (
		<div className="overflow-x-auto">
			<table
				style={{
					width: '100%',
					borderCollapse: 'collapse',
					fontSize: '0.75rem',
					lineHeight: 1.4,
				}}
			>
				<thead>
					<tr>
						<th
							style={{
								position: 'sticky',
								left: 0,
								zIndex: 3,
								background: headerBg,
								borderBottom: `2px solid ${borderColor}`,
								borderRight: `1px solid ${borderColor}`,
								padding: '6px 10px',
								textAlign: 'left',
								minWidth: 80,
								fontWeight: 600,
							}}
						>
							FC
						</th>
						<th
							style={{
								position: 'sticky',
								left: 80,
								zIndex: 3,
								background: headerBg,
								borderBottom: `2px solid ${borderColor}`,
								borderRight: `1px solid ${borderColor}`,
								padding: '6px 10px',
								textAlign: 'left',
								minWidth: 70,
								fontWeight: 600,
							}}
						>
							Vendor
						</th>
						<th
							style={{
								position: 'sticky',
								left: 150,
								zIndex: 3,
								background: headerBg,
								borderBottom: `2px solid ${borderColor}`,
								borderRight: `1px solid ${borderColor}`,
								padding: '6px 10px',
								textAlign: 'left',
								minWidth: 90,
								fontWeight: 600,
							}}
						>
							Breakdown
						</th>
						{visibleDates.map((dateStr) => {
							const { day, date } = formatDateHeader(dateStr);
							const isWeekend = day === 'Sat' || day === 'Sun';
							return (
								<th
									key={dateStr}
									style={{
										borderBottom: `2px solid ${borderColor}`,
										borderRight: `1px solid ${borderColor}`,
										padding: '4px 6px',
										textAlign: 'right',
										minWidth: 80,
										fontWeight: 600,
										background: isWeekend
											? theme.palette.mode === 'dark'
												? 'rgba(255,255,255,0.08)'
												: 'rgba(0,0,0,0.06)'
											: headerBg,
									}}
								>
									<div>{day}</div>
									<div style={{ fontWeight: 400, opacity: 0.7 }}>{date}</div>
								</th>
							);
						})}
					</tr>
				</thead>
				<tbody>
					{selectedFcs.map((fc, fcIndex) => (
						<>
							{/* FC header row */}
							<tr key={`${fc}-header`}>
								<td
									colSpan={visibleDates.length + 3}
									style={{
										background: fcHeaderBg,
										borderBottom: `1px solid ${borderColor}`,
										borderTop: fcIndex > 0 ? `3px solid ${borderColor}` : undefined,
										padding: '6px 10px',
										fontWeight: 700,
										fontSize: '0.8rem',
									}}
								>
									{fc}
								</td>
							</tr>
							{/* Vendor × Breakdown rows */}
							{VENDOR_TYPES.map((vendor) =>
								BREAKDOWN_TYPES.map((bd, bdIdx) => (
									<tr key={`${fc}-${vendor}-${bd}`}>
										{/* Show vendor label only on first breakdown row */}
										{bdIdx === 0 ? (
											<td
												rowSpan={BREAKDOWN_TYPES.length}
												style={{
													position: 'sticky',
													left: 0,
													zIndex: 1,
													background: theme.palette.background.paper,
													borderBottom: `1px solid ${borderColor}`,
													borderRight: `1px solid ${borderColor}`,
													padding: '4px 10px 4px 20px',
													fontWeight: 600,
													verticalAlign: 'middle',
												}}
											>
												{vendor}
											</td>
										) : null}
										<td
											style={{
												position: 'sticky',
												left: bdIdx === 0 ? undefined : 80,
												zIndex: 1,
												background: theme.palette.background.paper,
												borderBottom: `1px solid ${borderColor}`,
												borderRight: `1px solid ${borderColor}`,
												padding: '4px 10px',
												fontWeight: 400,
											}}
										>
											{bd}
										</td>
										{visibleDates.map((dateStr) => {
											const units = lookup[fc]?.[vendor]?.[bd]?.[dateStr] ?? 0;
											return (
												<td
													key={dateStr}
													style={{
														borderBottom: `1px solid ${borderColor}`,
														borderRight: `1px solid ${borderColor}`,
														padding: '4px 6px',
														textAlign: 'right',
														fontVariantNumeric: 'tabular-nums',
														color: units === 0
															? theme.palette.error.main
															: 'inherit',
														fontWeight: units === 0 ? 600 : 400,
														background: units === 0
															? theme.palette.mode === 'dark'
																? 'rgba(244,67,54,0.08)'
																: 'rgba(244,67,54,0.04)'
															: 'transparent',
													}}
												>
													{units.toLocaleString()}
												</td>
											);
										})}
									</tr>
								))
							)}
						</>
					))}
				</tbody>
			</table>
		</div>
	);
}

export default StandingTable;
