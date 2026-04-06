'use client';

import { useMemo } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import DataTable from 'src/components/data-table/DataTable';
import { type MRT_ColumnDef } from 'material-react-table';
import {
	LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { DatasetCatalogEntry } from '../../../types';

interface TrendPoint {
	day: string;
	rowCount: number;
	qualityScore: number;
}

interface ChangeLogEntry {
	version: string;
	date: string;
	change: string;
}

function generateTrendData(baseScore: number): TrendPoint[] {
	const data: TrendPoint[] = [];
	for (let i = 0; i < 30; i++) {
		const day = `Nov ${i + 1}`;
		let rowCount = 500 + (Math.random() > 0.9 ? Math.floor(Math.random() * 30) : 0);
		let qs = baseScore;
		if (i >= 13 && i <= 17) qs = baseScore - (5 - Math.abs(i - 15)) * 2;
		qs += Math.floor(Math.random() * 3) - 1;
		data.push({ day, rowCount, qualityScore: Math.max(0, Math.min(100, qs)) });
	}
	return data;
}

const changeLog: ChangeLogEntry[] = [
	{ version: 'v1.4', date: '2024-11-10', change: 'Added schema validation for date columns' },
	{ version: 'v1.3', date: '2024-10-25', change: 'Renamed column "amt" to "amount" for clarity' },
	{ version: 'v1.2', date: '2024-10-10', change: 'Added PII classification metadata' },
	{ version: 'v1.1', date: '2024-09-20', change: 'Increased row count from 200 to 500' },
	{ version: 'v1.0', date: '2024-09-01', change: 'Initial dataset creation' },
];

const changeColumns: MRT_ColumnDef<ChangeLogEntry>[] = [
	{ accessorKey: 'version', header: 'Version', size: 80 },
	{ accessorKey: 'date', header: 'Date', size: 120 },
	{ accessorKey: 'change', header: 'Change', size: 400 },
];

interface Props {
	entry: DatasetCatalogEntry;
}

/**
 * Observability tab — 30-day trends, freshness, schema changelog.
 */
export default function ObservabilityTab({ entry }: Props) {
	const trendData = useMemo(
		() => generateTrendData(entry.statistics.qualityScore ?? 80),
		[entry]
	);

	const piiCols = entry.piiColumns.slice(0, 3);
	const nullTrend = useMemo(() => {
		return Array.from({ length: 30 }, (_, i) => {
			const point: Record<string, string | number> = { day: `Nov ${i + 1}` };
			piiCols.forEach((p) => {
				point[p.column] = parseFloat((Math.random() * 0.15).toFixed(3));
			});
			return point;
		});
	}, [piiCols]);

	const LINE_COLORS = ['#F44336', '#FF9800', '#9C27B0'];

	return (
		<div className="space-y-4">
			<Paper variant="outlined" className="p-3 flex items-center gap-2">
				<span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
				<Typography variant="body2">Last ingested 2 hours ago</Typography>
				<Typography variant="caption" color="text.secondary" className="ml-auto">
					Updated: {new Date(entry.lastUpdated).toLocaleDateString()}
				</Typography>
			</Paper>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
				<Paper variant="outlined" className="p-3">
					<Typography variant="caption" className="font-semibold block mb-1">Row Count (30 days)</Typography>
					<ResponsiveContainer width="100%" height={180}>
						<LineChart data={trendData}>
							<XAxis dataKey="day" tick={{ fontSize: 9 }} interval={4} />
							<YAxis tick={{ fontSize: 10 }} domain={[490, 540]} />
							<Tooltip />
							<Line type="monotone" dataKey="rowCount" stroke="#2196F3" strokeWidth={2} dot={false} />
						</LineChart>
					</ResponsiveContainer>
				</Paper>

				<Paper variant="outlined" className="p-3">
					<Typography variant="caption" className="font-semibold block mb-1">Quality Score (30 days)</Typography>
					<ResponsiveContainer width="100%" height={180}>
						<LineChart data={trendData}>
							<XAxis dataKey="day" tick={{ fontSize: 9 }} interval={4} />
							<YAxis tick={{ fontSize: 10 }} domain={[50, 100]} />
							<Tooltip />
							<Line type="monotone" dataKey="qualityScore" stroke="#4CAF50" strokeWidth={2} dot={false} />
						</LineChart>
					</ResponsiveContainer>
				</Paper>
			</div>

			{piiCols.length > 0 && (
				<Paper variant="outlined" className="p-3">
					<Typography variant="caption" className="font-semibold block mb-1">PII Column Null Rates (30 days)</Typography>
					<ResponsiveContainer width="100%" height={180}>
						<LineChart data={nullTrend}>
							<XAxis dataKey="day" tick={{ fontSize: 9 }} interval={4} />
							<YAxis tick={{ fontSize: 10 }} />
							<Tooltip />
							<Legend />
							{piiCols.map((p, i) => (
								<Line key={p.column} type="monotone" dataKey={p.column} stroke={LINE_COLORS[i]} strokeWidth={1.5} dot={false} />
							))}
						</LineChart>
					</ResponsiveContainer>
				</Paper>
			)}

			<Typography className="font-semibold">Schema Change Log</Typography>
			<DataTable
				columns={changeColumns as MRT_ColumnDef<ChangeLogEntry>[]}
				data={changeLog}
				enableRowSelection={false}
				enableRowActions={false}
				enableColumnOrdering={false}
				enableGrouping={false}
				enableColumnPinning={false}
				enableDensityToggle={false}
				enableHiding={false}
				enablePagination={false}
				enableBottomToolbar={false}
				enableTopToolbar={false}
				enableStickyHeader
				initialState={{ density: 'compact' }}
			/>
		</div>
	);
}
