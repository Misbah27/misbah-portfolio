'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import DataTable from 'src/components/data-table/DataTable';
import { type MRT_ColumnDef } from 'material-react-table';
import { motion } from 'motion/react';
import type { WizardContext, GeneratedMetadata, ColumnMetadata } from '../types';

interface MetadataStepProps {
	ctx: WizardContext;
	updateCtx: (patch: Partial<WizardContext>) => void;
	onNext: () => void;
	onBack: () => void;
}

interface MetadataSection {
	icon: string;
	label: string;
	field: 'datasetDescription' | 'businessContext';
}

const EDITABLE_SECTIONS: MetadataSection[] = [
	{ icon: 'heroicons-outline:document-text', label: 'Description', field: 'datasetDescription' },
	{ icon: 'heroicons-outline:briefcase', label: 'Business Context', field: 'businessContext' },
];

/**
 * Wizard Step 3 — LLM-powered metadata generation with approve/reject/edit per field.
 */
export default function MetadataStep({ ctx, updateCtx, onNext, onBack }: MetadataStepProps) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [responseTime, setResponseTime] = useState<number | null>(null);
	const [editingField, setEditingField] = useState<string | null>(null);
	const [editingColIdx, setEditingColIdx] = useState<number | null>(null);
	const [editBuffer, setEditBuffer] = useState('');

	const generateMetadata = useCallback(async () => {
		setLoading(true);
		setError('');
		const start = Date.now();

		try {
			const res = await fetch('/api/dataops/generate-metadata', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					schema: ctx.schema,
					sampleRows: ctx.rows.slice(0, 5),
					datasetName: ctx.datasetName,
					sqlQuery: ctx.sqlQuery || null,
					industryTag: ctx.industryTag,
					qualityReport: ctx.qualityReport,
				}),
			});

			if (!res.ok) throw new Error('Metadata generation failed');

			const metadata: GeneratedMetadata = await res.json();
			setResponseTime(Date.now() - start);
			updateCtx({ generatedMetadata: metadata });
		} catch {
			setError('Metadata generation failed. Please try again.');
		} finally {
			setLoading(false);
		}
	}, [ctx.schema, ctx.rows, ctx.datasetName, ctx.sqlQuery, ctx.industryTag, ctx.qualityReport, updateCtx]);

	useEffect(() => {
		if (!ctx.generatedMetadata && ctx.schema.length > 0) {
			generateMetadata();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const meta = ctx.generatedMetadata;

	const updateColumnMeta = useCallback(
		(idx: number, patch: Partial<ColumnMetadata>) => {
			if (!meta) return;
			const updated = [...meta.columnMetadata];
			updated[idx] = { ...updated[idx], ...patch };
			updateCtx({ generatedMetadata: { ...meta, columnMetadata: updated } });
		},
		[meta, updateCtx]
	);

	const updateDatasetField = useCallback(
		(field: keyof GeneratedMetadata, value: string) => {
			if (!meta) return;
			updateCtx({ generatedMetadata: { ...meta, [field]: value } });
		},
		[meta, updateCtx]
	);

	const allReviewed = meta?.columnMetadata.every((cm) => cm.approved !== null) ?? false;

	const approveAll = useCallback(() => {
		if (!meta) return;
		const updated = meta.columnMetadata.map((cm) => ({ ...cm, approved: true }));
		updateCtx({ generatedMetadata: { ...meta, columnMetadata: updated } });
	}, [meta, updateCtx]);

	const startEdit = (field: string, value: string) => {
		setEditingField(field);
		setEditBuffer(value);
	};

	const saveEdit = (field: string) => {
		updateDatasetField(field as keyof GeneratedMetadata, editBuffer);
		setEditingField(null);
	};

	const startColEdit = (idx: number, value: string) => {
		setEditingColIdx(idx);
		setEditBuffer(value);
	};

	const saveColEdit = (idx: number) => {
		updateColumnMeta(idx, { description: editBuffer });
		setEditingColIdx(null);
	};

	// DataTable columns for column metadata
	const columnDefs = useMemo<MRT_ColumnDef<ColumnMetadata>[]>(
		() => [
			{
				accessorKey: 'columnName',
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
				accessorKey: 'dataType',
				header: 'Type',
				size: 100,
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
				accessorKey: 'description',
				header: 'Description',
				size: 220,
				Cell: ({ row }) => {
					const idx = meta?.columnMetadata.indexOf(row.original) ?? -1;
					const cm = row.original;
					if (editingColIdx === idx) {
						return (
							<Box className="flex gap-1 items-center">
								<TextField
									size="small"
									fullWidth
									value={editBuffer}
									onChange={(e) => setEditBuffer(e.target.value)}
								/>
								<IconButton
									size="small"
									color="success"
									onClick={() => saveColEdit(idx)}
								>
									<FuseSvgIcon size={16}>heroicons-solid:check</FuseSvgIcon>
								</IconButton>
							</Box>
						);
					}
					return (
						<Tooltip title={cm.businessMeaning}>
							<Box className="flex items-center gap-1">
								<span className="truncate flex-1">{cm.description}</span>
								<IconButton
									size="small"
									onClick={() => startColEdit(idx, cm.description)}
								>
									<FuseSvgIcon size={14}>heroicons-outline:pencil-square</FuseSvgIcon>
								</IconButton>
							</Box>
						</Tooltip>
					);
				},
			},
			{
				accessorKey: 'isPii',
				header: 'PII?',
				size: 110,
				Cell: ({ row }) =>
					row.original.isPii ? (
						<Chip
							label={row.original.piiType ?? 'PII'}
							size="small"
							color="warning"
							className="text-[9px]"
							icon={<FuseSvgIcon size={12}>heroicons-outline:finger-print</FuseSvgIcon>}
						/>
					) : (
						<Typography
							variant="body2"
							color="text.disabled"
						>
							—
						</Typography>
					),
			},
			{
				accessorKey: 'piiConfidence',
				header: 'Confidence',
				size: 90,
				Cell: ({ row }) =>
					row.original.isPii ? (
						<Typography variant="body2">{row.original.piiConfidence}%</Typography>
					) : (
						<Typography
							variant="body2"
							color="text.disabled"
						>
							—
						</Typography>
					),
			},
			{
				accessorKey: 'suggestedObfuscationRule',
				header: 'Obfuscation',
				size: 120,
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
				accessorKey: 'approved',
				header: 'Status',
				size: 100,
				Cell: ({ row }) => {
					const idx = meta?.columnMetadata.indexOf(row.original) ?? -1;
					const cm = row.original;
					return (
						<Box className="flex gap-1">
							<IconButton
								size="small"
								onClick={() => updateColumnMeta(idx, { approved: true })}
								sx={{
									color: cm.approved === true ? 'success.main' : 'action.disabled',
								}}
								title="Approve"
							>
								<FuseSvgIcon size={18}>
									{cm.approved === true ? 'heroicons-solid:check-circle' : 'heroicons-outline:check-circle'}
								</FuseSvgIcon>
							</IconButton>
							<IconButton
								size="small"
								onClick={() => updateColumnMeta(idx, { approved: false })}
								sx={{
									color: cm.approved === false ? 'error.main' : 'action.disabled',
								}}
								title="Reject"
							>
								<FuseSvgIcon size={18}>
									{cm.approved === false ? 'heroicons-solid:x-circle' : 'heroicons-outline:x-circle'}
								</FuseSvgIcon>
							</IconButton>
						</Box>
					);
				},
			},
		],
		[meta, editingColIdx, editBuffer, updateColumnMeta]
	);

	return (
		<div className="w-full">
			<Typography className="text-lg font-semibold mb-4">Step 3 — Metadata Generation</Typography>

			{/* Loading with skeletons */}
			{loading && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
				>
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
						<div className="lg:col-span-1">
							<Paper
								variant="outlined"
								className="p-3"
							>
								<Skeleton
									variant="text"
									width={120}
									className="mb-3"
								/>
								{Array.from({ length: 6 }).map((_, i) => (
									<Box
										key={i}
										className="mb-3"
									>
										<Skeleton
											variant="text"
											width={80}
										/>
										<Skeleton
											variant="text"
											height={40}
										/>
									</Box>
								))}
							</Paper>
						</div>
						<div className="lg:col-span-2">
							<Paper
								variant="outlined"
								className="p-3"
							>
								<Skeleton
									variant="text"
									width={200}
									className="mb-2"
								/>
								{Array.from({ length: 8 }).map((_, i) => (
									<Skeleton
										key={i}
										variant="text"
										height={40}
										className="mb-4"
									/>
								))}
							</Paper>
						</div>
					</div>
				</motion.div>
			)}

			{/* Error */}
			{error && (
				<Alert
					severity="error"
					className="mb-3"
					action={
						<Button
							color="inherit"
							size="small"
							onClick={generateMetadata}
						>
							Retry
						</Button>
					}
				>
					{error}
				</Alert>
			)}

			{meta && (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4 }}
					className="grid grid-cols-1 lg:grid-cols-3 gap-3"
				>
					{/* Left panel — dataset-level metadata */}
					<div className="lg:col-span-1">
						<Paper
							variant="outlined"
							className="p-3"
						>
							<Box className="flex items-center justify-between mb-2">
								<Typography className="text-xs font-semibold">Dataset Metadata</Typography>
								<Chip
									label="AI-Enhanced"
									size="small"
									color="secondary"
									variant="outlined"
									icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
								/>
							</Box>

							{responseTime !== null && (
								<Typography
									variant="caption"
									color="text.secondary"
									className="block mb-2"
								>
									Generated in {(responseTime / 1000).toFixed(1)}s
								</Typography>
							)}

							{/* Editable fields */}
							{EDITABLE_SECTIONS.map(({ icon, label, field }) => {
								const value = meta[field] as string;
								return (
									<div key={field}>
										<Box className="flex items-center gap-1 mb-4">
											<FuseSvgIcon
												size={16}
												color="action"
											>
												{icon}
											</FuseSvgIcon>
											<Typography
												variant="caption"
												color="text.secondary"
												className="font-semibold"
											>
												{label}
											</Typography>
										</Box>
										{editingField === field ? (
											<Box className="flex gap-1 mb-2">
												<TextField
													size="small"
													fullWidth
													multiline
													rows={3}
													value={editBuffer}
													onChange={(e) => setEditBuffer(e.target.value)}
												/>
												<Button
													size="small"
													onClick={() => saveEdit(field)}
												>
													Save
												</Button>
											</Box>
										) : (
											<Box className="flex items-start gap-1 mb-2">
												<Typography
													variant="body2"
													className="flex-1"
												>
													{value}
												</Typography>
												<IconButton
													size="small"
													onClick={() => startEdit(field, value)}
												>
													<FuseSvgIcon size={14}>heroicons-outline:pencil-square</FuseSvgIcon>
												</IconButton>
											</Box>
										)}
										<Divider className="mb-2" />
									</div>
								);
							})}

							{/* Classification */}
							<Box className="flex items-center gap-1 mb-4">
								<FuseSvgIcon
									size={16}
									color="action"
								>
									heroicons-outline:shield-check
								</FuseSvgIcon>
								<Typography
									variant="caption"
									color="text.secondary"
									className="font-semibold"
								>
									Classification
								</Typography>
							</Box>
							<Box className="mb-2">
								<Chip
									label={meta.dataClassification}
									size="small"
									color={meta.dataClassification === 'PII' ? 'error' : meta.dataClassification === 'CONFIDENTIAL' ? 'warning' : 'default'}
								/>
								<Typography
									variant="caption"
									color="text.secondary"
									className="block mt-1"
								>
									{meta.classificationReasoning}
								</Typography>
							</Box>
							<Divider className="mb-2" />

							{/* PII Summary */}
							<Box className="flex items-center gap-1 mb-4">
								<FuseSvgIcon
									size={16}
									color="action"
								>
									heroicons-outline:finger-print
								</FuseSvgIcon>
								<Typography
									variant="caption"
									color="text.secondary"
									className="font-semibold"
								>
									PII Columns ({meta.piiColumns.length})
								</Typography>
							</Box>
							<Box className="flex flex-wrap gap-1 mb-2">
								{meta.piiColumns.map((pc) => (
									<Tooltip
										key={pc.column}
										title={`${pc.piiType} — ${pc.confidence}% confidence`}
									>
										<Chip
											label={pc.column}
											size="small"
											color="warning"
											variant="outlined"
										/>
									</Tooltip>
								))}
							</Box>
							<Divider className="mb-2" />

							{/* Lineage */}
							<Box className="flex items-center gap-1 mb-4">
								<FuseSvgIcon
									size={16}
									color="action"
								>
									heroicons-outline:arrow-path
								</FuseSvgIcon>
								<Typography
									variant="caption"
									color="text.secondary"
									className="font-semibold"
								>
									Lineage
								</Typography>
							</Box>
							<Typography
								variant="body2"
								className="mb-4"
							>
								{meta.lineage.description}
							</Typography>
							{meta.lineage.upstreamDatasets.length > 0 && (
								<Box className="flex flex-wrap gap-1 mb-2">
									{meta.lineage.upstreamDatasets.map((ds) => (
										<Chip
											key={ds}
											label={ds}
											size="small"
											variant="outlined"
										/>
									))}
								</Box>
							)}
							<Divider className="mb-2" />

							{/* Tags */}
							<Box className="flex items-center gap-1 mb-4">
								<FuseSvgIcon
									size={16}
									color="action"
								>
									heroicons-outline:tag
								</FuseSvgIcon>
								<Typography
									variant="caption"
									color="text.secondary"
									className="font-semibold"
								>
									Suggested Tags
								</Typography>
							</Box>
							<Box className="flex flex-wrap gap-1 mb-2">
								{meta.suggestedTags.map((tag) => (
									<Chip
										key={tag}
										label={tag}
										size="small"
										variant="outlined"
									/>
								))}
							</Box>
							<Divider className="mb-2" />

							{/* Retention */}
							<Box className="flex items-center gap-1 mb-4">
								<FuseSvgIcon
									size={16}
									color="action"
								>
									heroicons-outline:clock
								</FuseSvgIcon>
								<Typography
									variant="caption"
									color="text.secondary"
									className="font-semibold"
								>
									Retention Policy
								</Typography>
							</Box>
							<Typography
								variant="body2"
								className="mb-2"
							>
								{meta.retentionPolicy}
							</Typography>
							<Divider className="mb-2" />

							{/* Regulatory */}
							<Box className="flex items-center gap-1 mb-4">
								<FuseSvgIcon
									size={16}
									color="action"
								>
									heroicons-outline:flag
								</FuseSvgIcon>
								<Typography
									variant="caption"
									color="text.secondary"
									className="font-semibold"
								>
									Regulatory Flags
								</Typography>
							</Box>
							<Box className="flex flex-wrap gap-1">
								{meta.regulatoryFlags.map((flag) => (
									<Chip
										key={flag}
										label={flag}
										size="small"
										color={flag === 'NONE' ? 'default' : 'error'}
										variant="outlined"
									/>
								))}
							</Box>
						</Paper>
					</div>

					{/* Right panel — per-column metadata with DataTable */}
					<div className="lg:col-span-2">
						<Paper
							variant="outlined"
							className="overflow-hidden"
						>
							<Box className="flex items-center justify-between px-3 py-2">
								<Typography className="text-xs font-semibold">
									Column Metadata ({meta.columnMetadata.length} columns)
								</Typography>
								<Box className="flex gap-2">
									<Button
										size="small"
										variant="outlined"
										onClick={generateMetadata}
										startIcon={
											<FuseSvgIcon size={14}>heroicons-outline:arrow-path</FuseSvgIcon>
										}
									>
										Regenerate
									</Button>
									<Button
										size="small"
										variant="contained"
										onClick={approveAll}
										startIcon={
											<FuseSvgIcon size={14}>heroicons-solid:check-circle</FuseSvgIcon>
										}
									>
										Approve All
									</Button>
								</Box>
							</Box>
							<DataTable<ColumnMetadata>
								columns={columnDefs}
								data={meta.columnMetadata}
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
									pagination: { pageIndex: 0, pageSize: 15 },
								}}
								muiTableContainerProps={{ sx: { maxHeight: 600 } }}
								muiTableBodyRowProps={({ row }) => ({
									sx: {
										backgroundColor: row.original.isPii
											? 'rgba(245, 158, 11, 0.05)'
											: undefined,
									},
								})}
							/>
						</Paper>
					</div>
				</motion.div>
			)}

			{/* Navigation */}
			<Box className="flex justify-between mt-24">
				<Button
					variant="outlined"
					onClick={onBack}
					startIcon={
						<FuseSvgIcon size={16}>heroicons-outline:arrow-left</FuseSvgIcon>
					}
				>
					Back
				</Button>
				<Button
					variant="contained"
					onClick={onNext}
					disabled={!allReviewed}
					endIcon={
						<FuseSvgIcon size={16}>heroicons-outline:arrow-right</FuseSvgIcon>
					}
				>
					{allReviewed
						? 'Approve All & Continue'
						: `Review all columns to continue (${meta?.columnMetadata.filter((c) => c.approved !== null).length ?? 0}/${meta?.columnMetadata.length ?? 0})`}
				</Button>
			</Box>
		</div>
	);
}
