'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import DataTable from 'src/components/data-table/DataTable';
import { type MRT_ColumnDef } from 'material-react-table';
import { motion } from 'motion/react';
import {
	INDUSTRY_TAGS,
	INDUSTRY_LABELS,
	SAMPLE_DATASETS,
	type WizardContext,
	type IndustryTag,
	type DataRow,
} from '../types';
import { inferSchema, parseCsv } from './schemaUtils';

interface UploadStepProps {
	ctx: WizardContext;
	updateCtx: (patch: Partial<WizardContext>) => void;
	onNext: () => void;
}

/**
 * Wizard Step 1 — Upload dataset via file upload or sample dataset selection.
 */
export default function UploadStep({ ctx, updateCtx, onNext }: UploadStepProps) {
	const [dragOver, setDragOver] = useState(false);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [fileName, setFileName] = useState('');
	const inputRef = useRef<HTMLInputElement>(null);

	const processData = useCallback(
		(rows: DataRow[], name: string, industry: IndustryTag | '') => {
			if (rows.length === 0) {
				setError('No rows found in the file.');
				return;
			}
			const schema = inferSchema(rows);
			updateCtx({
				rows,
				schema,
				datasetName: name || ctx.datasetName,
				industryTag: industry || ctx.industryTag,
			});
			setError('');
		},
		[ctx.datasetName, ctx.industryTag, updateCtx]
	);

	const handleFileRead = useCallback(
		(file: File) => {
			setLoading(true);
			setFileName(file.name);
			const reader = new FileReader();

			reader.onload = (e) => {
				try {
					const text = e.target?.result as string;
					let rows: DataRow[];

					if (file.name.endsWith('.json')) {
						const parsed = JSON.parse(text);
						rows = Array.isArray(parsed) ? parsed : parsed.rows ?? [];
					} else {
						rows = parseCsv(text);
					}

					processData(rows, file.name.replace(/\.(json|csv)$/i, ''), '');
				} catch {
					setError('Failed to parse file. Please upload a valid JSON or CSV file.');
				} finally {
					setLoading(false);
				}
			};

			reader.onerror = () => {
				setError('Failed to read file.');
				setLoading(false);
			};

			reader.readAsText(file);
		},
		[processData]
	);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setDragOver(false);
			const file = e.dataTransfer.files[0];
			if (file) handleFileRead(file);
		},
		[handleFileRead]
	);

	const handleFileInput = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) handleFileRead(file);
		},
		[handleFileRead]
	);

	const handleSampleLoad = useCallback(
		async (sample: (typeof SAMPLE_DATASETS)[number]) => {
			setLoading(true);
			setError('');
			try {
				const mod = await import(`@/data/dataops/datasets/${sample.fileName}`);
				const data = mod.default;
				const rows: DataRow[] = data.rows ?? [];
				processData(rows, sample.name, sample.industryTag);
				setFileName(`${sample.fileName} (sample)`);
			} catch {
				setError(`Failed to load sample dataset: ${sample.label}`);
			} finally {
				setLoading(false);
			}
		},
		[processData]
	);

	const previewColumns = useMemo<MRT_ColumnDef<DataRow>[]>(
		() =>
			ctx.schema.map((col) => ({
				accessorKey: col.name,
				header: col.name,
				Header: () => (
					<Box>
						<Typography
							variant="caption"
							className="font-semibold"
						>
							{col.name}
						</Typography>
						<Typography
							variant="caption"
							color="text.disabled"
							className="block text-[10px]"
						>
							{col.inferredType}
						</Typography>
					</Box>
				),
				size: 150,
				Cell: ({ cell }) => {
					const val = cell.getValue();
					if (val === null || val === undefined) return <span className="text-gray-400">—</span>;
					return <span className="truncate block max-w-[200px]">{String(val)}</span>;
				},
			})),
		[ctx.schema]
	);

	const previewData = useMemo(() => ctx.rows.slice(0, 10), [ctx.rows]);

	const canProceed = ctx.rows.length > 0 && ctx.datasetName.trim() !== '' && ctx.industryTag !== '';

	return (
		<div>
			<Typography className="text-lg font-semibold mb-4">Step 1 — Upload Dataset</Typography>

			{/* Dataset name + industry selector */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
				<TextField
					label="Dataset Name"
					value={ctx.datasetName}
					onChange={(e) => updateCtx({ datasetName: e.target.value })}
					size="small"
					fullWidth
					required
					slotProps={{
						input: {
							startAdornment: (
								<InputAdornment position="start">
									<FuseSvgIcon
										size={18}
										color="action"
									>
										heroicons-outline:document-text
									</FuseSvgIcon>
								</InputAdornment>
							),
						},
					}}
				/>
				<FormControl
					size="small"
					fullWidth
					required
				>
					<InputLabel>Industry Vertical</InputLabel>
					<Select
						value={ctx.industryTag}
						label="Industry Vertical"
						onChange={(e) => updateCtx({ industryTag: e.target.value as IndustryTag })}
						startAdornment={
							<InputAdornment position="start">
								<FuseSvgIcon
									size={18}
									color="action"
								>
									heroicons-outline:building-office
								</FuseSvgIcon>
							</InputAdornment>
						}
					>
						{INDUSTRY_TAGS.map((tag) => (
							<MenuItem
								key={tag}
								value={tag}
							>
								{INDUSTRY_LABELS[tag]}
							</MenuItem>
						))}
					</Select>
				</FormControl>
			</div>

			{/* File drop zone */}
			<Paper
				variant="outlined"
				className="p-5 text-center cursor-pointer mb-4 transition-all duration-200"
				sx={{
					borderStyle: 'dashed',
					borderWidth: 2,
					borderColor: dragOver ? 'secondary.main' : 'divider',
					backgroundColor: dragOver ? 'action.hover' : 'transparent',
					'&:hover': {
						borderColor: 'secondary.light',
						transform: 'scale(1.005)',
					},
				}}
				onDragOver={(e) => {
					e.preventDefault();
					setDragOver(true);
				}}
				onDragLeave={() => setDragOver(false)}
				onDrop={handleDrop}
				onClick={() => inputRef.current?.click()}
			>
				<input
					ref={inputRef}
					type="file"
					accept=".json,.csv"
					className="hidden"
					onChange={handleFileInput}
				/>
				{loading ? (
					<Box className="space-y-8">
						<Skeleton
							variant="circular"
							width={48}
							height={48}
							className="mx-auto"
						/>
						<Skeleton
							variant="text"
							width={200}
							className="mx-auto"
						/>
					</Box>
				) : (
					<>
						<FuseSvgIcon
							className="mx-auto mb-2"
							size={48}
							color={dragOver ? 'secondary' : 'action'}
						>
							heroicons-outline:cloud-arrow-up
						</FuseSvgIcon>
						<Typography className="font-medium">
							{fileName || 'Drag & drop a CSV or JSON file, or click to browse'}
						</Typography>
						<Typography
							variant="caption"
							color="text.secondary"
						>
							Accepts .json and .csv files
						</Typography>
					</>
				)}
			</Paper>

			{/* File info card after upload */}
			{ctx.rows.length > 0 && fileName && (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3 }}
				>
					<Paper
						variant="outlined"
						className="p-4 mb-4 flex items-center gap-4"
					>
						<FuseSvgIcon
							size={24}
							color="success"
						>
							heroicons-solid:check-circle
						</FuseSvgIcon>
						<div className="flex-1">
							<Typography className="font-medium text-sm">{fileName}</Typography>
							<Typography
								variant="caption"
								color="text.secondary"
							>
								{ctx.rows.length} rows, {ctx.schema.length} columns
							</Typography>
						</div>
					</Paper>
				</motion.div>
			)}

			{/* SQL lineage textarea */}
			<TextField
				label="SQL Query for Lineage Extraction (optional)"
				multiline
				rows={2}
				value={ctx.sqlQuery}
				onChange={(e) => updateCtx({ sqlQuery: e.target.value })}
				fullWidth
				size="small"
				className="mb-4"
				placeholder="SELECT * FROM upstream_table JOIN ..."
				slotProps={{
					input: {
						startAdornment: (
							<InputAdornment
								position="start"
								sx={{ alignSelf: 'flex-start', mt: '10px' }}
							>
								<FuseSvgIcon
									size={18}
									color="action"
								>
									heroicons-outline:code-bracket
								</FuseSvgIcon>
							</InputAdornment>
						),
					},
				}}
			/>

			{/* Sample dataset quick-load */}
			<Typography
				className="text-sm font-semibold mb-2"
				color="text.secondary"
			>
				Or use a sample dataset:
			</Typography>
			<Box className="flex flex-wrap gap-2 mb-4">
				{SAMPLE_DATASETS.map((sample) => (
					<Chip
						key={sample.name}
						label={sample.label}
						variant="outlined"
						size="small"
						onClick={() => handleSampleLoad(sample)}
						clickable
						icon={
							<FuseSvgIcon size={14}>heroicons-outline:beaker</FuseSvgIcon>
						}
					/>
				))}
			</Box>

			{/* Error display */}
			{error && (
				<Alert
					severity="error"
					className="mb-3"
				>
					{error}
				</Alert>
			)}

			{/* Data preview with DataTable */}
			{ctx.rows.length > 0 && (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3, delay: 0.1 }}
					className="mb-4"
				>
					<Paper
						variant="outlined"
						className="overflow-hidden"
					>
						<DataTable<DataRow>
							columns={previewColumns}
							data={previewData}
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
							initialState={{
								density: 'compact',
							}}
							muiTableContainerProps={{
								sx: { maxHeight: 300 },
							}}
						/>
					</Paper>
				</motion.div>
			)}

			{/* Next button */}
			<Box className="flex justify-end">
				<Button
					variant="contained"
					onClick={onNext}
					disabled={!canProceed}
					size="large"
					endIcon={
						<FuseSvgIcon size={18}>heroicons-outline:arrow-right</FuseSvgIcon>
					}
				>
					Run Quality Check
				</Button>
			</Box>
		</div>
	);
}
