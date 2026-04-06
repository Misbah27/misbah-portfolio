'use client';

import { useState, useEffect, useMemo } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import DataTable from 'src/components/data-table/DataTable';
import { type MRT_ColumnDef } from 'material-react-table';
import {
	PieChart, Pie, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer,
} from 'recharts';
import type { DatasetCatalogEntry, DataRow } from '../../../types';
import { getUserDatasetRows } from '../../userDatasetStore';
import { obfuscateValue, detectFormatType, DEMO_SEED } from '../../../obfuscation/obfuscationUtils';
import IndustryStats from './IndustryStats';

const CHART_COLORS = ['#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0', '#00BCD4', '#795548', '#E91E63'];

interface Props {
	entry: DatasetCatalogEntry;
}

/**
 * Preview & Statistics tab — first 20 rows + column stats + industry-specific charts.
 */
export default function PreviewTab({ entry }: Props) {
	const [rows, setRows] = useState<DataRow[]>([]);
	const [displayRows, setDisplayRows] = useState<DataRow[]>([]);
	const [loading, setLoading] = useState(true);

	const piiCols = useMemo(() => new Set(entry.piiColumns.map((p) => p.column)), [entry]);

	useEffect(() => {
		setLoading(true);

		const loadRows = async (rawRows: DataRow[]) => {
			const sliced = rawRows.slice(0, 20);
			setRows(sliced);

			// Auto-obfuscate PII columns
			if (entry.piiColumns.length > 0) {
				const piiColFormats = entry.piiColumns.map((p) => ({
					column: p.column,
					format: detectFormatType(p.column, p.piiType),
				}));
				const obfuscated = await Promise.all(
					sliced.map(async (row) => {
						const newRow = { ...row };
						for (const { column, format } of piiColFormats) {
							if (row[column] != null) {
								newRow[column] = await obfuscateValue(DEMO_SEED, column, row[column], format);
							}
						}
						return newRow;
					})
				);
				setDisplayRows(obfuscated);
			} else {
				setDisplayRows(sliced);
			}
			setLoading(false);
		};

		// Check localStorage first (user-published datasets)
		const userRows = getUserDatasetRows(entry.datasetId);
		if (userRows) {
			loadRows(userRows);
			return;
		}

		// Fall back to static dataset files
		const fileName = entry.filePath.split('/').pop()?.replace('.json', '');
		import(`@/data/dataops/datasets/${fileName}.json`)
			.then((mod) => {
				const data = mod.default as { rows: DataRow[] };
				loadRows(data.rows);
			})
			.catch(() => { setRows([]); setDisplayRows([]); setLoading(false); });
	}, [entry]);

	const columnVisibility = useMemo(() => {
		const vis: Record<string, boolean> = {};
		entry.schema.forEach((col, i) => {
			vis[col.name] = i < 8 || col.inferredType === 'IMAGE_URL';
		});
		return vis;
	}, [entry]);

	const columns = useMemo<MRT_ColumnDef<DataRow>[]>(() => {
		return entry.schema.map((col) => ({
			accessorKey: col.name,
			header: col.name,
			size: col.inferredType === 'IMAGE_URL' ? 80 : 150,
			Cell: ({ cell }) => {
				const val = cell.getValue() as string | number | null;
				if (piiCols.has(col.name)) {
					return <span className="text-amber-600 font-mono text-xs">{val != null ? String(val) : '—'}</span>;
				}
				if (col.inferredType === 'IMAGE_URL' && typeof val === 'string') {
					return (
						<img
							src={val}
							alt=""
							style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }}
						/>
					);
				}
				return <span className="text-sm">{val != null ? String(val) : '—'}</span>;
			},
		}));
	}, [entry, piiCols]);

	const columnStats = useMemo(() => {
		if (rows.length === 0) return [];
		return entry.schema.map((col) => {
			const vals = rows.map((r) => r[col.name]).filter((v) => v != null);
			const numVals = vals.filter((v) => typeof v === 'number') as number[];
			if (numVals.length > vals.length * 0.5 && numVals.length >= 3) {
				const min = Math.min(...numVals);
				const max = Math.max(...numVals);
				const mean = numVals.reduce((a, b) => a + b, 0) / numVals.length;
				return { column: col.name, type: 'numeric' as const, min, max, mean };
			}
			if (col.inferredType === 'DATE') {
				const dates = vals.map((v) => String(v)).sort();
				return { column: col.name, type: 'date' as const, from: dates[0], to: dates[dates.length - 1] };
			}
			const counts: Record<string, number> = {};
			vals.forEach((v) => { const k = String(v); counts[k] = (counts[k] || 0) + 1; });
			const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
			return { column: col.name, type: 'categorical' as const, top };
		});
	}, [rows, entry]);

	if (loading) {
		return (
			<div className="space-y-3">
				<Skeleton variant="rectangular" height={300} />
				<Skeleton variant="rectangular" height={200} />
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<DataTable
				columns={columns as MRT_ColumnDef<DataRow>[]}
				data={displayRows}
				enableRowSelection={false}
				enableRowActions={false}
				enableColumnOrdering={false}
				enableGrouping={false}
				enableColumnPinning={false}
				enableDensityToggle={false}
				enableHiding={false}
				enableFilters={false}
				enablePagination={false}
				enableBottomToolbar={false}
				enableTopToolbar={false}
				enableStickyHeader
				initialState={{ density: 'compact', columnVisibility }}
			/>

			<Typography className="font-semibold mt-4 mb-2">Column Statistics</Typography>
			<div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
				{columnStats.slice(0, 12).map((stat) => (
					<Paper key={stat.column} variant="outlined" className="p-2">
						<Typography variant="caption" className="font-mono block truncate">{stat.column}</Typography>
						{stat.type === 'numeric' && (
							<div className="flex gap-2 mt-1">
								<Chip label={`min: ${stat.min.toFixed(1)}`} size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 18 }} />
								<Chip label={`max: ${stat.max.toFixed(1)}`} size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 18 }} />
								<Chip label={`avg: ${stat.mean.toFixed(1)}`} size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 18 }} />
							</div>
						)}
						{stat.type === 'date' && (
							<Typography variant="caption" color="text.secondary">{stat.from} to {stat.to}</Typography>
						)}
						{stat.type === 'categorical' && (
							<div className="flex gap-1 flex-wrap mt-1">
								{stat.top.map(([val, count]) => (
									<Chip key={val} label={`${val} (${count})`} size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 18 }} />
								))}
							</div>
						)}
					</Paper>
				))}
			</div>

			<IndustryStats entry={entry} rows={rows} />
		</div>
	);
}
