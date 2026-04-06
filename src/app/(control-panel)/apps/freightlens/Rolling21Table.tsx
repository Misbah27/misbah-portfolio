'use client';

import { useMemo } from 'react';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import {
	METRIC_ROWS,
	DATES_PER_PAGE,
	type Rolling21DayEntry,
	type Rolling21Data,
	type FcId,
	type MetricKey,
} from './types';

interface Rolling21TableProps {
	data: Rolling21Data;
	selectedFcs: FcId[];
	pageIndex: number;
}

/** Format a date string (YYYY-MM-DD) to a compact header label. */
function formatDateHeader(dateStr: string): { day: string; date: string } {
	const d = new Date(dateStr + 'T00:00:00');
	const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	return {
		day: dayNames[d.getDay()],
		date: `${d.getMonth() + 1}/${d.getDate()}`,
	};
}

/** Format a numeric value for display in a cell. */
function formatCellValue(value: number, metric: MetricKey): string {
	if (metric === 'utilizationPct') {
		return `${value}%`;
	}
	return value.toLocaleString();
}

/** Determine if a cell should be highlighted red (over-scheduled / zero remaining). */
function isRedCell(value: number, metric: MetricKey): boolean {
	if (metric === 'saUnitsLeft' || metric === 'totalUnitsLeft') {
		return value === 0;
	}
	if (metric === 'utilizationPct') {
		return value > 100;
	}
	return false;
}

/** Determine if a cell should be highlighted green (healthy capacity). */
function isGreenCell(value: number, metric: MetricKey): boolean {
	if (metric === 'saUnitsLeft' || metric === 'totalUnitsLeft') {
		return value > 0;
	}
	if (metric === 'utilizationPct') {
		return value <= 100;
	}
	return false;
}

/**
 * Rolling 21 Days grid table — FC rows × metric rows × date columns.
 * Matches the DFT (Daily Freight Tracker) layout pattern.
 */
function Rolling21Table({ data, selectedFcs, pageIndex }: Rolling21TableProps) {
	const theme = useTheme();

	// Get all dates from first FC's data
	const allDates = useMemo(() => {
		const firstFc = selectedFcs[0];
		if (!firstFc || !data[firstFc]) return [];
		return data[firstFc].map((e) => e.date);
	}, [data, selectedFcs]);

	// Paginated date window
	const visibleDates = useMemo(() => {
		const start = pageIndex * DATES_PER_PAGE;
		return allDates.slice(start, start + DATES_PER_PAGE);
	}, [allDates, pageIndex]);

	// Build lookup: fc -> date -> entry
	const entryLookup = useMemo(() => {
		const lookup: Record<string, Record<string, Rolling21DayEntry>> = {};
		selectedFcs.forEach((fc) => {
			lookup[fc] = {};
			(data[fc] || []).forEach((entry) => {
				lookup[fc][entry.date] = entry;
			});
		});
		return lookup;
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
								zIndex: 2,
								background: headerBg,
								borderBottom: `2px solid ${borderColor}`,
								borderRight: `1px solid ${borderColor}`,
								padding: '6px 10px',
								textAlign: 'left',
								minWidth: 140,
								fontWeight: 600,
							}}
						>
							FC / Metric
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
									colSpan={visibleDates.length + 1}
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
							{/* Metric rows for this FC */}
							{METRIC_ROWS.map((metric) => (
								<tr key={`${fc}-${metric.key}`}>
									<td
										style={{
											position: 'sticky',
											left: 0,
											zIndex: 1,
											background: theme.palette.background.paper,
											borderBottom: `1px solid ${borderColor}`,
											borderRight: `1px solid ${borderColor}`,
											padding: '4px 10px 4px 20px',
											fontWeight: metric.key === 'totalUnitsLeft' || metric.key === 'utilizationPct' ? 600 : 400,
											whiteSpace: 'nowrap',
										}}
									>
										{metric.label}
									</td>
									{visibleDates.map((dateStr) => {
										const entry = entryLookup[fc]?.[dateStr];
										const value = entry ? entry[metric.key] : 0;
										const red = isRedCell(value, metric.key);
										const green = isGreenCell(value, metric.key);

										return (
											<td
												key={dateStr}
												style={{
													borderBottom: `1px solid ${borderColor}`,
													borderRight: `1px solid ${borderColor}`,
													padding: '4px 6px',
													textAlign: 'right',
													fontVariantNumeric: 'tabular-nums',
													color: red
														? theme.palette.error.main
														: green
															? theme.palette.success.main
															: 'inherit',
													fontWeight: red || green ? 600 : 400,
													background:
														red
															? theme.palette.mode === 'dark'
																? 'rgba(244,67,54,0.08)'
																: 'rgba(244,67,54,0.04)'
															: 'transparent',
												}}
											>
												{formatCellValue(value, metric.key)}
											</td>
										);
									})}
								</tr>
							))}
						</>
					))}
				</tbody>
			</table>
		</div>
	);
}

export default Rolling21Table;
