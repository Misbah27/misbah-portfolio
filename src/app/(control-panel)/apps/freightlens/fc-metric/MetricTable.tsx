'use client';

import { useMemo } from 'react';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import {
	FC_METRIC_DEFS,
	STANDING_DATES_PER_PAGE,
	type FcMetricsData,
	type FcId,
} from '../types';

interface MetricTableProps {
	data: FcMetricsData;
	selectedFc: FcId;
	pageIndex: number;
	searchQuery: string;
	highlighted?: boolean;
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
 * FC Metric grid table — metric rows × date columns for a single selected FC.
 */
function MetricTable({ data, selectedFc, pageIndex, searchQuery, highlighted }: MetricTableProps) {
	const theme = useTheme();

	const entries = data[selectedFc] || [];
	const allDates = entries.map((e) => e.date);

	const visibleDates = useMemo(() => {
		const start = pageIndex * STANDING_DATES_PER_PAGE;
		return allDates.slice(start, start + STANDING_DATES_PER_PAGE);
	}, [allDates, pageIndex]);

	const entryByDate = useMemo(() => {
		const map: Record<string, Record<string, number>> = {};
		entries.forEach((e) => {
			map[e.date] = e as unknown as Record<string, number>;
		});
		return map;
	}, [entries]);

	const filteredMetrics = useMemo(() => {
		if (!searchQuery.trim()) return FC_METRIC_DEFS;
		const q = searchQuery.toLowerCase();
		return FC_METRIC_DEFS.filter((m) => m.label.toLowerCase().includes(q));
	}, [searchQuery]);

	if (visibleDates.length === 0) {
		return (
			<div className="p-6 text-center">
				<Typography color="text.secondary">No data available for {selectedFc}</Typography>
			</div>
		);
	}

	const headerBg = theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)';
	const borderColor = theme.palette.divider;

	return (
		<div
			className="overflow-x-auto"
			style={{
				border: highlighted ? '2px solid #1976d2' : undefined,
				borderRadius: highlighted ? 4 : undefined,
				boxShadow: highlighted ? '0 0 8px rgba(25,118,210,0.3)' : undefined,
				transition: 'border 0.3s, box-shadow 0.3s',
			}}
		>
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
								minWidth: 180,
								fontWeight: 600,
							}}
						>
							Metric ({selectedFc})
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
										minWidth: 85,
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
					{filteredMetrics.map((metric) => {
						const isHighlight = metric.key === 'ncnsPct' || metric.key === 'hotPos';
						return (
							<tr key={metric.key}>
								<td
									style={{
										position: 'sticky',
										left: 0,
										zIndex: 1,
										background: theme.palette.background.paper,
										borderBottom: `1px solid ${borderColor}`,
										borderRight: `1px solid ${borderColor}`,
										padding: '4px 10px',
										fontWeight: isHighlight ? 600 : 400,
										whiteSpace: 'nowrap',
									}}
								>
									{metric.label}
								</td>
								{visibleDates.map((dateStr) => {
									const raw = entryByDate[dateStr]?.[metric.key] ?? 0;
									const value = typeof raw === 'number' ? raw : 0;
									const formatted = metric.format === 'percent'
										? `${value}%`
										: value.toLocaleString();

									// NCNS% > 15% is warning, Hot POs > 30 is warning
									const isWarning =
										(metric.key === 'ncnsPct' && value > 15) ||
										(metric.key === 'hotPos' && value > 30);

									return (
										<td
											key={dateStr}
											style={{
												borderBottom: `1px solid ${borderColor}`,
												borderRight: `1px solid ${borderColor}`,
												padding: '4px 6px',
												textAlign: 'right',
												fontVariantNumeric: 'tabular-nums',
												color: isWarning ? theme.palette.warning.main : 'inherit',
												fontWeight: isWarning ? 600 : 400,
											}}
										>
											{formatted}
										</td>
									);
								})}
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}

export default MetricTable;
