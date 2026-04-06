'use client';

import { useState, useMemo, useCallback } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import FormControlLabel from '@mui/material/FormControlLabel';
import LinearProgress from '@mui/material/LinearProgress';
import Skeleton from '@mui/material/Skeleton';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import DataTable from 'src/components/data-table/DataTable';
import { type MRT_ColumnDef } from 'material-react-table';
import { useSnackbar } from 'notistack';
import { INDUSTRY_COLORS, INDUSTRY_LABELS, type DatasetCatalogEntry, type DataRow } from '../../types';
import { DEMO_SEED, obfuscateValue, detectFormatType } from '../obfuscationUtils';

interface PiiConfig {
	column: string;
	piiType: string;
	format: string;
	include: boolean;
}

interface PreviewRow {
	column: string;
	original: string;
	obfuscated: string;
}

interface ActiveJob {
	id: string;
	dataset: string;
	status: 'PENDING' | 'RUNNING' | 'COMPLETE';
	progress: number;
}

interface Props {
	catalog: DatasetCatalogEntry[];
}

/**
 * Configure & Run tab — dataset selection, PII config, preview, job submission.
 */
export default function ConfigureTab({ catalog }: Props) {
	const { enqueueSnackbar } = useSnackbar();
	const [selectedDs, setSelectedDs] = useState<DatasetCatalogEntry | null>(null);
	const [piiConfig, setPiiConfig] = useState<PiiConfig[]>([]);
	const [preview, setPreview] = useState<PreviewRow[]>([]);
	const [showSeed, setShowSeed] = useState(false);
	const [runMode, setRunMode] = useState('FULL');
	const [loading, setLoading] = useState(false);
	const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
	const [suggestLoading, setSuggestLoading] = useState(false);

	const piiDatasets = useMemo(() => catalog.filter((d) => d.publishedToCatalog), [catalog]);

	const selectDataset = useCallback((ds: DatasetCatalogEntry) => {
		setSelectedDs(ds);
		setPreview([]);
		setPiiConfig(
			ds.piiColumns.map((p) => ({
				column: p.column,
				piiType: p.piiType,
				format: 'FORMAT_PRESERVE',
				include: true,
			}))
		);
	}, []);

	const suggestRules = async () => {
		if (!selectedDs) return;
		setSuggestLoading(true);
		try {
			const res = await fetch('/api/dataops/suggest-obfuscation', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					columns: piiConfig.map((p) => ({
						name: p.column,
						piiType: p.piiType,
						inferredType: selectedDs.schema.find((s) => s.name === p.column)?.inferredType || 'STRING',
					})),
					industryTag: selectedDs.industryTag,
				}),
			});
			const data = await res.json();
			if (data.suggestions) {
				setPiiConfig((prev) =>
					prev.map((p) => {
						const suggestion = data.suggestions.find((s: { column: string; rule: string }) => s.column === p.column);
						return suggestion ? { ...p, format: suggestion.rule } : p;
					})
				);
			}
		} catch { /* fallback: keep current */ }
		setSuggestLoading(false);
	};

	const runPreview = async () => {
		if (!selectedDs) return;
		setLoading(true);
		try {
			const fileName = selectedDs.filePath.split('/').pop()?.replace('.json', '');
			const mod = await import(`@/data/dataops/datasets/${fileName}.json`);
			const rows = (mod.default as { rows: DataRow[] }).rows.slice(0, 5);
			const included = piiConfig.filter((p) => p.include);
			const previews: PreviewRow[] = [];
			for (const row of rows) {
				for (const col of included) {
					const fmt = detectFormatType(col.column, col.piiType);
					const obfVal = await obfuscateValue(DEMO_SEED, col.column, row[col.column], fmt);
					previews.push({ column: col.column, original: String(row[col.column] ?? ''), obfuscated: obfVal });
				}
			}
			setPreview(previews);
		} catch { enqueueSnackbar('Failed to load dataset', { variant: 'error' }); }
		setLoading(false);
	};

	const submitJob = () => {
		if (!selectedDs) return;
		const jobId = `OBF-LIVE-${Date.now()}`;
		const job: ActiveJob = { id: jobId, dataset: selectedDs.name, status: 'PENDING', progress: 0 };
		setActiveJobs((prev) => [...prev, job]);
		setTimeout(() => {
			setActiveJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: 'RUNNING', progress: 50 } : j)));
		}, 1000);
		setTimeout(() => {
			setActiveJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: 'COMPLETE', progress: 100 } : j)));
			enqueueSnackbar('Obfuscation job completed', { variant: 'success' });
		}, 3000);
	};

	const previewColumns: MRT_ColumnDef<PreviewRow>[] = [
		{ accessorKey: 'column', header: 'Column', size: 150 },
		{ accessorKey: 'original', header: 'Original Value', size: 200 },
		{ accessorKey: 'obfuscated', header: 'Obfuscated Value', size: 200 },
	];

	return (
		<div className="flex gap-3 min-h-0">
			{/* Dataset selector */}
			<div className="w-[220px] shrink-0 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 240px)' }}>
				{piiDatasets.map((ds) => (
					<Paper
						key={ds.datasetId}
						variant="outlined"
						className="p-2 cursor-pointer"
						onClick={() => selectDataset(ds)}
						sx={{
							borderColor: selectedDs?.datasetId === ds.datasetId ? '#0097A7' : undefined,
							borderWidth: selectedDs?.datasetId === ds.datasetId ? 2 : 1,
						}}
					>
						<Typography variant="body2" className="font-semibold truncate">{ds.name}</Typography>
						<div className="flex gap-1 mt-1">
							<Chip label={INDUSTRY_LABELS[ds.industryTag]} size="small" sx={{ fontSize: '0.6rem', height: 18, backgroundColor: INDUSTRY_COLORS[ds.industryTag], color: '#fff' }} />
							<Chip label={ds.classification} size="small" sx={{ fontSize: '0.6rem', height: 18 }} />
						</div>
					</Paper>
				))}
			</div>

			{/* Center panel */}
			<div className="flex-1 min-w-0 space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 240px)' }}>
				{selectedDs ? (
					<>
						<Typography variant="body2" className="font-semibold">PII Columns Detected</Typography>
						{piiConfig.length === 0 ? (
							<Typography variant="body2" color="text.secondary">No PII columns detected in this dataset.</Typography>
						) : (
							<div className="space-y-1">
								{piiConfig.map((p, i) => (
									<Paper key={p.column} variant="outlined" className="p-2 flex items-center gap-2">
										<Typography variant="body2" className="font-mono flex-1">{p.column}</Typography>
										<Chip label={p.piiType.replace(/_/g, ' ')} size="small" sx={{ fontSize: '0.6rem', height: 18 }} />
										<Chip label={p.format} size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 18 }} />
										<Switch
											size="small"
											checked={p.include}
											onChange={(_, v) => {
												const next = [...piiConfig];
												next[i] = { ...next[i], include: v };
												setPiiConfig(next);
											}}
										/>
									</Paper>
								))}
							</div>
						)}

						<div className="flex gap-2">
							<Button
								size="small"
								variant="outlined"
								startIcon={suggestLoading ? undefined : <AutoAwesomeIcon />}
								onClick={suggestRules}
								disabled={suggestLoading || piiConfig.length === 0}
							>
								{suggestLoading ? 'Analyzing...' : 'Suggest Rules'}
							</Button>
							<Chip icon={<AutoAwesomeIcon />} label="AI-Enhanced" size="small" color="secondary" variant="outlined" />
						</div>

						{suggestLoading && <Skeleton variant="rectangular" height={40} />}

						<div className="flex gap-2 mt-2">
							<Button size="small" variant="contained" onClick={runPreview} disabled={loading || piiConfig.filter((p) => p.include).length === 0}>
								Preview Obfuscation
							</Button>
							{preview.length > 0 && (
								<Button size="small" variant="outlined" onClick={runPreview}>
									Run Again
								</Button>
							)}
						</div>

						{loading && <Skeleton variant="rectangular" height={150} />}

						{preview.length > 0 && !loading && (
							<>
								<DataTable
									columns={previewColumns as MRT_ColumnDef<PreviewRow>[]}
									data={preview}
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
									initialState={{ density: 'compact' }}
								/>
								<Paper variant="outlined" className="p-2" sx={{ backgroundColor: 'info.light', opacity: 0.9 }}>
									<Typography variant="caption">Same seed + same input = same output every time. Join obfuscated datasets without a mapping table.</Typography>
								</Paper>
							</>
						)}

						<Paper variant="outlined" className="p-2">
							<TextField
								size="small"
								fullWidth
								label="Obfuscation Seed"
								type={showSeed ? 'text' : 'password'}
								value={DEMO_SEED}
								InputProps={{
									readOnly: true,
									endAdornment: (
										<InputAdornment position="end">
											<IconButton size="small" onClick={() => setShowSeed(!showSeed)}>
												<FuseSvgIcon size={16}>{showSeed ? 'heroicons-outline:eye-slash' : 'heroicons-outline:eye'}</FuseSvgIcon>
											</IconButton>
										</InputAdornment>
									),
								}}
								helperText="KMS Customer Managed Key in production"
							/>
						</Paper>
					</>
				) : (
					<div className="flex items-center justify-center h-64">
						<Typography color="text.secondary">Select a dataset to configure obfuscation</Typography>
					</div>
				)}
			</div>

			{/* Right panel */}
			<div className="w-[240px] shrink-0 space-y-3">
				{selectedDs && (
					<Paper variant="outlined" className="p-3 space-y-3">
						<TextField size="small" fullWidth label="Job Name" value={`${selectedDs.name}-obfs-${Date.now()}`} InputProps={{ readOnly: true }} />
						<div>
							<Typography variant="caption" className="font-semibold block mb-1">Run Mode</Typography>
							<RadioGroup value={runMode} onChange={(e) => setRunMode(e.target.value)}>
								<FormControlLabel value="FULL" control={<Radio size="small" />} label={<Typography variant="body2">Full (500 rows)</Typography>} />
								<FormControlLabel value="SAMPLE" control={<Radio size="small" />} label={<Typography variant="body2">Sample (50 rows)</Typography>} />
							</RadioGroup>
						</div>
						<Button
							fullWidth
							variant="contained"
							color="primary"
							startIcon={<FuseSvgIcon size={16}>heroicons-outline:play</FuseSvgIcon>}
							onClick={submitJob}
							disabled={piiConfig.filter((p) => p.include).length === 0}
							sx={{ backgroundColor: '#0097A7' }}
						>
							Submit Job
						</Button>
					</Paper>
				)}

				{activeJobs.length > 0 && (
					<div className="space-y-2">
						<Typography variant="caption" className="font-semibold">Active Jobs</Typography>
						{activeJobs.map((job) => (
							<Paper key={job.id} variant="outlined" className="p-2">
								<Typography variant="caption" className="truncate block">{job.dataset}</Typography>
								<div className="flex items-center gap-2 mt-1">
									<Chip
										label={job.status}
										size="small"
										color={job.status === 'COMPLETE' ? 'success' : job.status === 'RUNNING' ? 'info' : 'default'}
										sx={{ fontSize: '0.6rem', height: 18 }}
									/>
									<LinearProgress variant="determinate" value={job.progress} className="flex-1" />
								</div>
								{job.status === 'COMPLETE' && (
									<div className="flex gap-1 mt-1">
										<Button size="small" variant="text" sx={{ fontSize: '0.65rem' }}>Download Obfuscated</Button>
										<Button size="small" variant="text" sx={{ fontSize: '0.65rem' }}>Request Re-id</Button>
									</div>
								)}
							</Paper>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
