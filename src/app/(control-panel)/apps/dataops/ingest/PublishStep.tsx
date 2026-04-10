'use client';

import { useState, useCallback } from 'react';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useSnackbar } from 'notistack';
import { motion } from 'motion/react';
import type { WizardContext, DataClassification, DatasetCatalogEntry } from '../types';
import { INDUSTRY_LABELS } from '../types';
import catalogJson from '@/data/dataops/catalog.json';
import { saveUserDataset, generateNextDatasetId } from '../catalog/userDatasetStore';

interface PublishStepProps {
	ctx: WizardContext;
	updateCtx: (patch: Partial<WizardContext>) => void;
	onBack: () => void;
}

function scoreColor(score: number): string {
	if (score >= 80) return '#4caf50';
	if (score >= 60) return '#ff9800';
	return '#f44336';
}

const containerVariants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
	hidden: { opacity: 0, y: 12 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

/**
 * Wizard Step 4 — Review and publish dataset to catalog.
 */
export default function PublishStep({ ctx, updateCtx, onBack }: PublishStepProps) {
	const [published, setPublished] = useState(false);
	const [publishing, setPublishing] = useState(false);
	const { enqueueSnackbar } = useSnackbar();

	const meta = ctx.generatedMetadata;
	const quality = ctx.qualityReport;

	const handlePublish = useCallback(async () => {
		if (!meta || !quality) return;
		setPublishing(true);
		try {
			const classification = ctx.classificationOverride ?? meta.dataClassification;
			const staticCatalog = catalogJson as DatasetCatalogEntry[];
			const datasetId = generateNextDatasetId(staticCatalog);
			// Merge AI-generated column descriptions into schema
			const colMetaMap = new Map(
				(meta.columnMetadata || []).map((cm) => [cm.columnName, cm])
			);
			const enrichedSchema = ctx.schema.map((col) => {
				const cm = colMetaMap.get(col.name);
				return { ...col, description: cm?.description || undefined };
			});

			const res = await fetch('/api/dataops/publish', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					datasetId,
					datasetName: ctx.datasetName,
					industryTag: ctx.industryTag,
					sqlQuery: ctx.sqlQuery,
					schema: enrichedSchema,
					rowCount: ctx.rows.length,
					qualityScore: quality.qualityScore,
					completeness: quality.columnHealth
						? Math.round(quality.columnHealth.reduce((s, c) => s + c.healthScore, 0) / quality.columnHealth.length)
						: 90,
					classification,
					piiColumns: meta.piiColumns,
					description: meta.datasetDescription,
					businessContext: meta.businessContext,
					lineage: meta.lineage,
					regulatoryFlags: meta.regulatoryFlags,
					owner: ctx.owner,
					tags: [...ctx.tags, ...meta.suggestedTags],
				}),
			});
			if (!res.ok) throw new Error('Publish failed');
			const data = await res.json();
			saveUserDataset(data.entry as DatasetCatalogEntry, ctx.rows);
			setPublished(true);
			enqueueSnackbar('Dataset published successfully!', { variant: 'success' });
		} catch {
			enqueueSnackbar('Failed to publish dataset. Please try again.', { variant: 'error' });
		} finally {
			setPublishing(false);
		}
	}, [ctx, meta, quality, enqueueSnackbar]);

	if (!meta || !quality) {
		return (
			<Alert severity="warning">Missing metadata or quality report. Go back to complete previous steps.</Alert>
		);
	}

	const classification = ctx.classificationOverride ?? meta.dataClassification;

	return (
		<div className="max-w-[900px] mx-auto">
			<Typography className="text-lg font-semibold mb-4">Step 4 — Publish to Catalog</Typography>

			{published ? (
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.5, ease: 'easeOut' }}
				>
					<Paper
						variant="outlined"
						className="p-8 text-center"
					>
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
						>
							<FuseSvgIcon
								className="mx-auto mb-3"
								size={64}
								color="success"
							>
								heroicons-solid:check-circle
							</FuseSvgIcon>
						</motion.div>
						<Typography className="text-2xl font-bold mb-2">
							Dataset Published Successfully
						</Typography>
						<Typography
							color="text.secondary"
							className="mb-6 max-w-[500px] mx-auto"
						>
							&quot;{ctx.datasetName}&quot; has been published to the Data Catalog with classification{' '}
							<strong>{classification}</strong> and a quality score of{' '}
							<strong>{quality.qualityScore}/100</strong>.
						</Typography>
						<Box className="flex justify-center gap-3">
							<Button
								variant="outlined"
								href="/apps/dataops/catalog"
								startIcon={
									<FuseSvgIcon size={16}>heroicons-outline:book-open</FuseSvgIcon>
								}
							>
								View in Catalog
							</Button>
							<Button
								variant="contained"
								startIcon={
									<FuseSvgIcon size={16}>heroicons-outline:plus</FuseSvgIcon>
								}
								onClick={() => {
									setPublished(false);
									updateCtx({
										step: 0,
										datasetName: '',
										industryTag: '',
										sqlQuery: '',
										schema: [],
										rows: [],
										qualityReport: null,
										generatedMetadata: null,
										owner: '',
										tags: [],
										classificationOverride: null,
									});
								}}
							>
								Ingest Another Dataset
							</Button>
						</Box>
					</Paper>
				</motion.div>
			) : (
				<motion.div
					variants={containerVariants}
					initial="hidden"
					animate="visible"
				>
					{/* Summary stats grid */}
					<motion.div variants={itemVariants}>
						<Paper
							variant="outlined"
							className="p-4 mb-4"
						>
							<Typography className="text-lg font-semibold mb-3">Publication Summary</Typography>

							<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
								{/* Dataset Name — full width */}
								<Paper
									variant="outlined"
									className="p-3 col-span-2 sm:col-span-3"
									sx={{ backgroundColor: 'action.hover' }}
								>
									<Box className="flex items-center gap-2">
										<FuseSvgIcon
											size={20}
											color="secondary"
										>
											heroicons-outline:document-text
										</FuseSvgIcon>
										<div>
											<Typography
												variant="caption"
												color="text.secondary"
											>
												Dataset Name
											</Typography>
											<Typography className="font-semibold text-lg">{ctx.datasetName}</Typography>
										</div>
									</Box>
								</Paper>

								{/* Stat cards */}
								<Paper
									variant="outlined"
									className="p-3 text-center"
								>
									<FuseSvgIcon
										className="mx-auto mb-4"
										size={20}
										color="action"
									>
										heroicons-outline:building-office
									</FuseSvgIcon>
									<Typography
										variant="caption"
										color="text.secondary"
										className="block"
									>
										Industry
									</Typography>
									<Typography className="font-semibold">
										{ctx.industryTag ? INDUSTRY_LABELS[ctx.industryTag] : '—'}
									</Typography>
								</Paper>

								<Paper
									variant="outlined"
									className="p-3 text-center"
								>
									<FuseSvgIcon
										className="mx-auto mb-4"
										size={20}
										color="action"
									>
										heroicons-outline:table-cells
									</FuseSvgIcon>
									<Typography
										variant="caption"
										color="text.secondary"
										className="block"
									>
										Rows
									</Typography>
									<Typography className="font-semibold text-lg">{ctx.rows.length.toLocaleString()}</Typography>
								</Paper>

								<Paper
									variant="outlined"
									className="p-3 text-center"
								>
									<FuseSvgIcon
										className="mx-auto mb-4"
										size={20}
										color="action"
									>
										heroicons-outline:view-columns
									</FuseSvgIcon>
									<Typography
										variant="caption"
										color="text.secondary"
										className="block"
									>
										Columns
									</Typography>
									<Typography className="font-semibold text-lg">{ctx.schema.length}</Typography>
								</Paper>

								<Paper
									variant="outlined"
									className="p-3 text-center"
								>
									<FuseSvgIcon
										className="mx-auto mb-4"
										size={20}
										color="action"
									>
										heroicons-outline:star
									</FuseSvgIcon>
									<Typography
										variant="caption"
										color="text.secondary"
										className="block"
									>
										Quality Score
									</Typography>
									<Typography
										className="font-bold text-lg"
										style={{ color: scoreColor(quality.qualityScore) }}
									>
										{quality.qualityScore}/100
									</Typography>
								</Paper>

								<Paper
									variant="outlined"
									className="p-3 text-center"
								>
									<FuseSvgIcon
										className="mx-auto mb-4"
										size={20}
										color="action"
									>
										heroicons-outline:shield-check
									</FuseSvgIcon>
									<Typography
										variant="caption"
										color="text.secondary"
										className="block"
									>
										Classification
									</Typography>
									<Chip
										label={classification}
										size="small"
										color={classification === 'PII' ? 'error' : classification === 'CONFIDENTIAL' ? 'warning' : 'default'}
										className="mt-2"
									/>
								</Paper>

								<Paper
									variant="outlined"
									className="p-3 text-center"
								>
									<FuseSvgIcon
										className="mx-auto mb-4"
										size={20}
										color="action"
									>
										heroicons-outline:finger-print
									</FuseSvgIcon>
									<Typography
										variant="caption"
										color="text.secondary"
										className="block"
									>
										PII Columns
									</Typography>
									<Typography
										className="font-semibold text-lg"
										color={meta.piiColumns.length > 0 ? 'warning.main' : undefined}
									>
										{meta.piiColumns.length}
									</Typography>
								</Paper>
							</div>

							<Divider className="mb-3" />

							{/* Description */}
							<Box className="mb-3">
								<Box className="flex items-center gap-8 mb-2">
									<FuseSvgIcon
										size={16}
										color="action"
									>
										heroicons-outline:chat-bubble-left-right
									</FuseSvgIcon>
									<Typography
										variant="caption"
										color="text.secondary"
										className="font-semibold uppercase tracking-wider"
									>
										Description
									</Typography>
								</Box>
								<Typography variant="body2">{meta.datasetDescription}</Typography>
							</Box>

							{/* Regulatory Flags */}
							<Box>
								<Box className="flex items-center gap-8 mb-2">
									<FuseSvgIcon
										size={16}
										color="action"
									>
										heroicons-outline:flag
									</FuseSvgIcon>
									<Typography
										variant="caption"
										color="text.secondary"
										className="font-semibold uppercase tracking-wider"
									>
										Regulatory Flags
									</Typography>
								</Box>
								<Box className="flex flex-wrap gap-4">
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
							</Box>
						</Paper>
					</motion.div>

					{/* Publication Settings */}
					<motion.div variants={itemVariants}>
						<Paper
							variant="outlined"
							className="p-4 mb-6"
						>
							<Box className="flex items-center gap-8 mb-3">
								<FuseSvgIcon
									size={20}
									color="action"
								>
									heroicons-outline:cog-6-tooth
								</FuseSvgIcon>
								<Typography className="text-lg font-semibold">Publication Settings</Typography>
							</Box>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
								<FormControl
									size="small"
									fullWidth
								>
									<InputLabel>Classification Override</InputLabel>
									<Select
										value={classification}
										label="Classification Override"
										onChange={(e) =>
											updateCtx({ classificationOverride: e.target.value as DataClassification })
										}
										startAdornment={
											<InputAdornment position="start">
												<FuseSvgIcon
													size={16}
													color="action"
												>
													heroicons-outline:shield-check
												</FuseSvgIcon>
											</InputAdornment>
										}
									>
										{(['PII', 'CONFIDENTIAL', 'INTERNAL', 'PUBLIC'] as const).map((c) => (
											<MenuItem
												key={c}
												value={c}
											>
												{c}
											</MenuItem>
										))}
									</Select>
								</FormControl>
								<TextField
									label="Owner"
									value={ctx.owner}
									onChange={(e) => updateCtx({ owner: e.target.value })}
									size="small"
									fullWidth
									placeholder="e.g. data-platform-team"
									slotProps={{
										input: {
											startAdornment: (
												<InputAdornment position="start">
													<FuseSvgIcon
														size={16}
														color="action"
													>
														heroicons-outline:user
													</FuseSvgIcon>
												</InputAdornment>
											),
										},
									}}
								/>
							</div>

							<TextField
								label="Tags (comma-separated)"
								value={ctx.tags.join(', ')}
								onChange={(e) =>
									updateCtx({
										tags: e.target.value
											.split(',')
											.map((t) => t.trim())
											.filter(Boolean),
									})
								}
								size="small"
								fullWidth
								placeholder="e.g. production, quarterly, finance"
								slotProps={{
									input: {
										startAdornment: (
											<InputAdornment position="start">
												<FuseSvgIcon
													size={16}
													color="action"
												>
													heroicons-outline:tag
												</FuseSvgIcon>
											</InputAdornment>
										),
									},
								}}
							/>
						</Paper>
					</motion.div>

					{/* Actions */}
					<motion.div variants={itemVariants}>
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
							<Button
								variant="contained"
								color="success"
								onClick={handlePublish}
								disabled={publishing}
								size="large"
								startIcon={
									<FuseSvgIcon size={18}>heroicons-outline:rocket-launch</FuseSvgIcon>
								}
							>
								{publishing ? 'Publishing...' : 'Publish to Catalog'}
							</Button>
						</Box>
					</motion.div>
				</motion.div>
			)}
		</div>
	);
}
