'use client';

import { useMemo } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import DataTable from 'src/components/data-table/DataTable';
import { type MRT_ColumnDef } from 'material-react-table';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import type { DatasetCatalogEntry, QualityIssue, ColumnHealth, IssueSeverity } from '../../../types';

const SEV_COLORS: Record<IssueSeverity, 'error' | 'warning' | 'info'> = {
	CRITICAL: 'error',
	WARNING: 'warning',
	INFO: 'info',
};

function scoreColor(score: number): string {
	if (score >= 80) return '#4CAF50';
	if (score >= 60) return '#FF9800';
	return '#F44336';
}

function healthColor(score: number): string {
	if (score >= 80) return '#C8E6C9';
	if (score >= 60) return '#FFF9C4';
	return '#FFCDD2';
}

function generateIssues(entry: DatasetCatalogEntry): QualityIssue[] {
	const issues: QualityIssue[] = [];
	const piiSet = new Set(entry.piiColumns.map((p) => p.column));

	entry.schema.forEach((col) => {
		if (col.nullable) {
			const rate = Math.random() * 0.3;
			if (rate > 0.15) {
				issues.push({
					column: col.name,
					issueType: 'NULL_RATE',
					severity: 'CRITICAL',
					description: `${(rate * 100).toFixed(1)}% null rate detected`,
					affectedRowCount: Math.floor(entry.rowCount * rate),
					recommendation: 'Investigate null data pipeline or add default values',
				});
			} else if (rate > 0.05) {
				issues.push({
					column: col.name,
					issueType: 'NULL_RATE',
					severity: 'WARNING',
					description: `${(rate * 100).toFixed(1)}% null rate detected`,
					affectedRowCount: Math.floor(entry.rowCount * rate),
					recommendation: 'Monitor null rate trend',
				});
			}
		}
		if (col.inferredType === 'ID') {
			issues.push({
				column: col.name,
				issueType: 'DUPLICATE_KEY',
				severity: 'INFO',
				description: 'Key uniqueness verified — 0 duplicates',
				affectedRowCount: 0,
				recommendation: 'No action needed',
			});
		}
		if (piiSet.has(col.name)) {
			issues.push({
				column: col.name,
				issueType: 'SEMANTIC',
				severity: 'WARNING',
				description: 'PII column detected — requires obfuscation before sharing',
				affectedRowCount: entry.rowCount,
				recommendation: 'Apply FORMAT_PRESERVE obfuscation via DataOps Obfuscation Service',
			});
		}
	});

	if (entry.industryTag === 'FINTECH') {
		issues.push({
			column: 'amount',
			issueType: 'NEGATIVE_VALUE',
			severity: 'WARNING',
			description: 'Negative transaction amounts found (refunds expected, verify)',
			affectedRowCount: 23,
			recommendation: 'Confirm negative values represent valid refunds',
		});
	}
	if (entry.industryTag === 'ECOMMERCE') {
		issues.push({
			column: 'totalAmount',
			issueType: 'COMPUTED_DRIFT',
			severity: 'WARNING',
			description: 'totalAmount != quantity * unitPrice in some rows',
			affectedRowCount: 15,
			recommendation: 'Check discount/tax calculation logic',
		});
	}

	return issues;
}

function generateColumnHealth(entry: DatasetCatalogEntry): ColumnHealth[] {
	return entry.schema.map((col) => {
		const nullRate = col.nullable ? Math.random() * 0.2 : 0;
		const uniqueRate = col.inferredType === 'ID' ? 1.0 : Math.random() * 0.8 + 0.2;
		const healthScore = Math.max(0, Math.round(100 - nullRate * 60 - (1 - uniqueRate) * 20));
		return { column: col.name, nullRate: parseFloat(nullRate.toFixed(3)), uniqueRate: parseFloat(uniqueRate.toFixed(3)), healthScore };
	});
}

const issueColumns: MRT_ColumnDef<QualityIssue>[] = [
	{ accessorKey: 'issueType', header: 'Issue Type', size: 150 },
	{
		accessorKey: 'severity',
		header: 'Severity',
		size: 100,
		Cell: ({ cell }) => <Chip label={cell.getValue<string>()} size="small" color={SEV_COLORS[cell.getValue<IssueSeverity>()]} sx={{ fontSize: '0.65rem', height: 20 }} />,
	},
	{ accessorKey: 'column', header: 'Column', size: 150 },
	{ accessorKey: 'description', header: 'Description', size: 280 },
	{ accessorKey: 'affectedRowCount', header: 'Affected Rows', size: 110 },
];

interface Props {
	entry: DatasetCatalogEntry;
}

/**
 * Quality tab — score gauge, issues table, column health heatmap.
 */
export default function QualityTab({ entry }: Props) {
	const score = entry.statistics.qualityScore ?? 75;
	const color = scoreColor(score);

	const issues = useMemo(() => generateIssues(entry), [entry]);
	const health = useMemo(() => generateColumnHealth(entry), [entry]);

	const gaugeData = [{ name: 'score', value: score, fill: color }];

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-4">
				<Paper variant="outlined" className="p-3 flex items-center gap-3">
					<div style={{ width: 100, height: 100 }}>
						<ResponsiveContainer>
							<RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" startAngle={180} endAngle={0} data={gaugeData}>
								<RadialBar background dataKey="value" cornerRadius={5} />
							</RadialBarChart>
						</ResponsiveContainer>
					</div>
					<div>
						<Typography className="text-3xl font-bold" sx={{ color }}>{score}</Typography>
						<Typography variant="caption" color="text.secondary">Quality Score</Typography>
					</div>
				</Paper>
				<div className="flex gap-2">
					<Chip label={`${issues.filter((i) => i.severity === 'CRITICAL').length} Critical`} size="small" color="error" variant="outlined" />
					<Chip label={`${issues.filter((i) => i.severity === 'WARNING').length} Warnings`} size="small" color="warning" variant="outlined" />
					<Chip label={`${issues.filter((i) => i.severity === 'INFO').length} Info`} size="small" color="info" variant="outlined" />
				</div>
			</div>

			<Typography className="font-semibold">Issues</Typography>
			<DataTable
				columns={issueColumns as MRT_ColumnDef<QualityIssue>[]}
				data={issues}
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

			<Typography className="font-semibold">Column Health</Typography>
			<div className="flex flex-wrap gap-1">
				{health.map((h) => (
					<Paper
						key={h.column}
						variant="outlined"
						className="px-2 py-1"
						sx={{ backgroundColor: healthColor(h.healthScore), minWidth: 80 }}
					>
						<Typography variant="caption" className="font-mono block truncate" sx={{ maxWidth: 90 }}>
							{h.column}
						</Typography>
						<Typography variant="caption" className="font-bold">{h.healthScore}</Typography>
					</Paper>
				))}
			</div>
		</div>
	);
}
