'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Tooltip from '@mui/material/Tooltip';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import DataTable from 'src/components/data-table/DataTable';
import { type MRT_ColumnDef } from 'material-react-table';
import { motion } from 'motion/react';
import type { WizardContext, QualityReport, QualityIssue, IssueSeverity, ColumnHealth, DataRow } from '../types';

interface QualityStepProps {
	ctx: WizardContext;
	updateCtx: (patch: Partial<WizardContext>) => void;
	onNext: () => void;
	onBack: () => void;
}

const SEVERITY_COLORS: Record<IssueSeverity, 'error' | 'warning' | 'info'> = {
	CRITICAL: 'error',
	WARNING: 'warning',
	INFO: 'info',
};

function scoreColor(score: number): string {
	if (score >= 80) return '#4caf50';
	if (score >= 60) return '#ff9800';
	return '#f44336';
}

function healthColor(score: number): string {
	if (score >= 90) return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
	if (score >= 70) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
	if (score >= 50) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200';
	return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
}

const scoreCardMeta = [
	{ key: 'qualityScore' as const, label: 'Quality Score', icon: 'heroicons-outline:star', colorFn: scoreColor },
	{ key: 'totalIssues' as const, label: 'Total Issues', icon: 'heroicons-outline:exclamation-triangle', color: undefined },
	{ key: 'criticalCount' as const, label: 'Critical', icon: 'heroicons-outline:x-circle', color: 'error' as const },
	{ key: 'warningCount' as const, label: 'Warning', icon: 'heroicons-outline:exclamation-circle', color: undefined, hex: '#ff9800' },
	{ key: 'infoCount' as const, label: 'Info', icon: 'heroicons-outline:information-circle', color: 'info' as const },
];

/**
 * Wizard Step 2 — Quality Check: runs deterministic + LLM checks, displays report.
 */
export default function QualityStep({ ctx, updateCtx, onNext, onBack }: QualityStepProps) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [criticalOnly, setCriticalOnly] = useState(false);
	const [responseTime, setResponseTime] = useState<number | null>(null);

	const runQualityCheck = useCallback(async () => {
		setLoading(true);
		setError('');
		const start = Date.now();

		try {
			const res = await fetch('/api/dataops/quality-check', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					schema: ctx.schema,
					rows: ctx.rows.slice(0, 50),
					datasetName: ctx.datasetName,
					industryTag: ctx.industryTag,
				}),
			});

			if (!res.ok) throw new Error('Quality check failed');

			const report: QualityReport = await res.json();
			setResponseTime(Date.now() - start);
			updateCtx({ qualityReport: report });
		} catch {
			setError('Quality check failed. Please try again.');
		} finally {
			setLoading(false);
		}
	}, [ctx.schema, ctx.rows, ctx.datasetName, ctx.industryTag, updateCtx]);

	useEffect(() => {
		if (!ctx.qualityReport && ctx.rows.length > 0) {
			runQualityCheck();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const report = ctx.qualityReport;

	const filteredIssues = useMemo(
		() => report?.issues.filter((issue) => !criticalOnly || issue.severity === 'CRITICAL') ?? [],
		[report, criticalOnly]
	);

	// DataTable columns for data preview
	const previewColumns = useMemo<MRT_ColumnDef<DataRow>[]>(
		() =>
			ctx.schema.map((col) => ({
				accessorKey: col.name,
				header: col.name,
				size: 140,
				Cell: ({ cell }) => {
					const val = cell.getValue();
					if (val === null || val === undefined) return <span className="text-gray-400">—</span>;
					return <span className="truncate block max-w-[150px]">{String(val)}</span>;
				},
			})),
		[ctx.schema]
	);

	// DataTable columns for issues
	const issueColumns = useMemo<MRT_ColumnDef<QualityIssue>[]>(
		() => [
			{
				accessorKey: 'column',
				header: 'Column',
				size: 130,
				Cell: ({ cell }) => (
					<Typography
						variant="body2"
						className="font-mono font-semibold"
					>
						{cell.getValue<string>()}
					</Typography>
				),
			},
			{
				accessorKey: 'issueType',
				header: 'Issue Type',
				size: 140,
				Cell: ({ cell }) => (
					<Chip
						label={cell.getValue<string>()}
						size="small"
						variant="outlined"
						className="text-[10px]"
					/>
				),
			},
			{
				accessorKey: 'severity',
				header: 'Severity',
				size: 110,
				Cell: ({ cell }) => {
					const sev = cell.getValue<IssueSeverity>();
					return (
						<Chip
							label={sev}
							size="small"
							color={SEVERITY_COLORS[sev]}
						/>
					);
				},
			},
			{
				accessorKey: 'description',
				header: 'Description',
				size: 280,
			},
			{
				accessorKey: 'affectedRowCount',
				header: 'Rows',
				size: 80,
			},
			{
				accessorKey: 'recommendation',
				header: 'Recommendation',
				size: 250,
			},
		],
		[]
	);

	const downloadReport = useCallback(() => {
		if (!report) return;
		const headers = ['Column', 'Issue Type', 'Severity', 'Description', 'Affected Rows', 'Recommendation'];
		const csvRows = report.issues.map((i) =>
			[i.column, i.issueType, i.severity, `"${i.description}"`, i.affectedRowCount, `"${i.recommendation}"`].join(',')
		);
		const csv = [headers.join(','), ...csvRows].join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${ctx.datasetName}_quality_report.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}, [report, ctx.datasetName]);

	return (
		<div className="w-full">
			<Typography className="text-lg font-semibold mb-4">Step 2 — Quality Check</Typography>

			{/* Data preview */}
			<Paper
				variant="outlined"
				className="mb-4 overflow-hidden"
			>
				<Box className="px-3 py-2">
					<Typography className="text-sm font-semibold">
						Dataset Preview — first 5 rows of {ctx.rows.length}
					</Typography>
				</Box>
				<DataTable<DataRow>
					columns={previewColumns}
					data={ctx.rows.slice(0, 5)}
					enableRowSelection={false}
					enableRowActions={false}
					enableColumnOrdering={false}
					enableGrouping={false}
					enableColumnPinning={false}
					enableColumnFilterModes={false}
					enableFacetedValues={false}
					enableGlobalFilter={false}
					enableFullScreenToggle={false}
					enableDensityToggle={false}
					enableHiding={false}
					enableFilters={false}
					enablePagination={false}
					enableBottomToolbar={false}
					enableTopToolbar={false}
					enableStickyHeader
					initialState={{ density: 'compact' }}
					muiTableContainerProps={{ sx: { maxHeight: 180 } }}
				/>
			</Paper>

			{/* Loading state with skeletons */}
			{loading && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
				>
					<div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
						{Array.from({ length: 5 }).map((_, i) => (
							<Paper
								key={i}
								variant="outlined"
								className="px-3 py-2 text-center"
							>
								<Skeleton
									variant="circular"
									width={24}
									height={24}
									className="mx-auto mb-2"
								/>
								<Skeleton
									variant="text"
									width={60}
									className="mx-auto"
									sx={{ fontSize: '2rem' }}
								/>
								<Skeleton
									variant="text"
									width={80}
									className="mx-auto"
								/>
							</Paper>
						))}
					</div>
					<Paper
						variant="outlined"
						className="p-4 mb-4"
					>
						<Skeleton
							variant="text"
							width={150}
							className="mb-2"
						/>
						<div className="flex flex-wrap gap-1">
							{Array.from({ length: 8 }).map((_, i) => (
								<Skeleton
									key={i}
									variant="rounded"
									width={80}
									height={28}
								/>
							))}
						</div>
					</Paper>
					<Paper
						variant="outlined"
						className="p-4"
					>
						{Array.from({ length: 5 }).map((_, i) => (
							<Skeleton
								key={i}
								variant="text"
								className="mb-4"
								height={36}
							/>
						))}
					</Paper>
				</motion.div>
			)}

			{/* Error state */}
			{error && (
				<Alert
					severity="error"
					className="mb-3"
					action={
						<Button
							color="inherit"
							size="small"
							onClick={runQualityCheck}
						>
							Retry
						</Button>
					}
				>
					{error}
				</Alert>
			)}

			{/* Quality Report */}
			{report && (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4 }}
				>
					{/* Score summary */}
					<div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
						{scoreCardMeta.map((card) => {
							const val = report[card.key];
							return (
								<Paper
									key={card.key}
									variant="outlined"
									className="px-3 py-2 text-center"
								>
									<FuseSvgIcon
										className="mx-auto mb-4"
										size={22}
										color="action"
									>
										{card.icon}
									</FuseSvgIcon>
									<Typography
										className="text-2xl font-bold"
										style={{
											color:
												card.colorFn
													? card.colorFn(val)
													: card.hex ?? undefined,
										}}
										color={!card.colorFn && !card.hex ? card.color : undefined}
									>
										{val}
									</Typography>
									<Typography
										variant="caption"
										color="text.secondary"
									>
										{card.label}
									</Typography>
								</Paper>
							);
						})}
					</div>

					{/* Response time + AI label */}
					{responseTime !== null && (
						<Box className="flex items-center gap-2 mb-3">
							<Chip
								label="AI-Enhanced"
								size="small"
								color="secondary"
								variant="outlined"
								icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
							/>
							<Typography
								variant="caption"
								color="text.secondary"
							>
								Completed in {(responseTime / 1000).toFixed(1)}s
							</Typography>
						</Box>
					)}

					{/* Column health heatmap */}
					<Paper
						variant="outlined"
						className="p-4 mb-4"
					>
						<Box className="flex items-center gap-2 mb-2">
							<FuseSvgIcon
								size={18}
								color="action"
							>
								heroicons-outline:heart
							</FuseSvgIcon>
							<Typography className="text-sm font-semibold">Column Health</Typography>
						</Box>
						<div className="flex flex-wrap gap-1">
							{report.columnHealth.map((ch) => (
								<Tooltip
									key={ch.column}
									title={`Null rate: ${(ch.nullRate * 100).toFixed(1)}% | Unique: ${(ch.uniqueRate * 100).toFixed(1)}% | Score: ${ch.healthScore}`}
								>
									<div
										className={`px-2 py-1 rounded text-xs font-medium ${healthColor(ch.healthScore)}`}
									>
										{ch.column}
									</div>
								</Tooltip>
							))}
						</div>
					</Paper>

					{/* Issues table with DataTable */}
					<Paper
						variant="outlined"
						className="mb-4 overflow-hidden"
					>
						<Box className="flex items-center justify-between px-3 py-2">
							<Box className="flex items-center gap-2">
								<FuseSvgIcon
									size={18}
									color="action"
								>
									heroicons-outline:exclamation-triangle
								</FuseSvgIcon>
								<Typography className="text-sm font-semibold">
									Issues ({filteredIssues.length})
								</Typography>
							</Box>
							<Box className="flex items-center gap-2">
								<FormControlLabel
									control={
										<Switch
											size="small"
											checked={criticalOnly}
											onChange={(_, checked) => setCriticalOnly(checked)}
										/>
									}
									label={
										<Typography variant="caption">Critical only</Typography>
									}
								/>
								<Button
									size="small"
									variant="outlined"
									onClick={downloadReport}
									startIcon={
										<FuseSvgIcon size={16}>heroicons-outline:arrow-down-tray</FuseSvgIcon>
									}
								>
									Download CSV
								</Button>
							</Box>
						</Box>
						<DataTable<QualityIssue>
							columns={issueColumns}
							data={filteredIssues}
							enableRowSelection={false}
							enableRowActions={false}
							enableColumnOrdering={false}
							enableGrouping={false}
							enableColumnPinning={false}
							enableFacetedValues={false}
							enableFullScreenToggle={false}
							enableDensityToggle={false}
							enableHiding={false}
							enableTopToolbar={false}
							enableStickyHeader
							initialState={{
								density: 'compact',
								pagination: { pageIndex: 0, pageSize: 10 },
							}}
							muiTableContainerProps={{ sx: { maxHeight: 400 } }}
						/>
					</Paper>
				</motion.div>
			)}

			{/* Navigation */}
			<Box className="flex justify-between">
				<Button
					variant="outlined"
					onClick={onBack}
					startIcon={
						<FuseSvgIcon size={16}>heroicons-outline:arrow-left</FuseSvgIcon>
					}
				>
					Back
				</Button>
				<Box className="flex gap-2">
					{report && (
						<Button
							variant="outlined"
							onClick={runQualityCheck}
							startIcon={
								<FuseSvgIcon size={16}>heroicons-outline:arrow-path</FuseSvgIcon>
							}
						>
							Re-run Checks
						</Button>
					)}
					<Button
						variant="contained"
						onClick={onNext}
						disabled={!report}
						endIcon={
							<FuseSvgIcon size={16}>heroicons-outline:arrow-right</FuseSvgIcon>
						}
					>
						Accept & Continue
					</Button>
				</Box>
			</Box>
		</div>
	);
}
