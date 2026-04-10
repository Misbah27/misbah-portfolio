'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Autocomplete from '@mui/material/Autocomplete';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Skeleton from '@mui/material/Skeleton';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PageBreadcrumb from 'src/components/PageBreadcrumb';
import DataTable from 'src/components/data-table/DataTable';
import { type MRT_ColumnDef } from 'material-react-table';
import { motion } from 'motion/react';
import { useSnackbar } from 'notistack';
import type {
	InvestigationCase, Driver, FraudPattern, CaseStatus,
} from '../types';
import {
	FRAUD_PATTERNS, PATTERN_LABELS, PATTERN_COLORS,
	CASE_STATUSES, CASE_STATUS_COLORS,
} from '../types';

const Root = styled(FusePageSimple)(({ theme }) => ({
	'&.FusePageSimple-scroll-content': { height: '100%' },
	'& .FusePageSimple-header': {
		backgroundColor: theme.vars.palette.background.paper,
		borderBottomWidth: 1,
		borderStyle: 'solid',
		borderColor: theme.vars.palette.divider,
	},
	'& .FusePageSimple-content': {
		backgroundColor: theme.vars.palette.background.default,
	},
	'& .FusePageSimple-leftSidebar': {
		borderRight: `1px solid ${theme.vars.palette.divider}`,
		backgroundColor: theme.vars.palette.background.paper,
	},
}));

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

const STATUS_VARIANT: Record<CaseStatus, 'filled' | 'outlined'> = {
	OPEN: 'filled',
	IN_REVIEW: 'filled',
	ESCALATED: 'filled',
	CLOSED_FRAUD: 'outlined',
	CLOSED_FALSE_POSITIVE: 'filled',
};

/**
 * LoFAT Case Management — filter sidebar + case table + detail panel.
 */
function CasesPage() {
	const { enqueueSnackbar } = useSnackbar();
	const [cases, setCases] = useState<InvestigationCase[]>([]);
	const [drivers, setDrivers] = useState<Driver[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedCase, setSelectedCase] = useState<InvestigationCase | null>(null);
	const [createOpen, setCreateOpen] = useState(false);
	const [narrativeOpen, setNarrativeOpen] = useState(false);
	const [narrativeText, setNarrativeText] = useState('');
	const [narrativeLoading, setNarrativeLoading] = useState(false);

	// Filters
	const [statusFilters, setStatusFilters] = useState<CaseStatus[]>([]);
	const [patternFilters, setPatternFilters] = useState<FraudPattern[]>([]);

	// Create case form
	const [newDriver, setNewDriver] = useState<Driver | null>(null);
	const [newPattern, setNewPattern] = useState<FraudPattern | ''>('');
	const [newNotes, setNewNotes] = useState('');
	const [newAmount, setNewAmount] = useState('');
	const [newInvestigator, setNewInvestigator] = useState('');

	useEffect(() => {
		Promise.all([
			import('@/data/lofat/cases.json'),
			import('@/data/lofat/drivers.json'),
		])
			.then(([cMod, dMod]) => {
				setCases(cMod.default as InvestigationCase[]);
				setDrivers(dMod.default as Driver[]);
			})
			.catch(() => {})
			.finally(() => setLoading(false));
	}, []);

	const filtered = useMemo(() => {
		let result = cases;
		if (statusFilters.length > 0) {
			result = result.filter((c) => statusFilters.includes(c.status));
		}
		if (patternFilters.length > 0) {
			result = result.filter((c) => patternFilters.includes(c.fraudPattern));
		}
		return result;
	}, [cases, statusFilters, patternFilters]);

	const openCount = cases.filter((c) => c.status === 'OPEN').length;
	const escalatedCount = cases.filter((c) => c.status === 'ESCALATED').length;
	const recoveredSum = cases
		.filter((c) => c.status === 'CLOSED_FRAUD')
		.reduce((s, c) => s + c.estimatedFraudAmount, 0);

	const toggleStatus = (s: CaseStatus) => {
		setStatusFilters((prev) =>
			prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
		);
	};

	const togglePattern = (p: FraudPattern) => {
		setPatternFilters((prev) =>
			prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
		);
	};

	const handleCreateCase = () => {
		if (!newDriver || !newPattern) return;
		const newCase: InvestigationCase = {
			caseId: `CASE-2024-${String(cases.length + 1).padStart(3, '0')}`,
			driverId: newDriver.driverId,
			driverName: newDriver.name,
			openedDate: new Date().toISOString(),
			status: 'OPEN',
			fraudPattern: newPattern,
			evidenceSummary: newNotes,
			assignedInvestigator: newInvestigator || 'Unassigned',
			estimatedFraudAmount: Number(newAmount) || 0,
			resolution: null,
		};
		setCases((prev) => [newCase, ...prev]);
		setCreateOpen(false);
		setNewDriver(null);
		setNewPattern('');
		setNewNotes('');
		setNewAmount('');
		setNewInvestigator('');
		enqueueSnackbar('Case created successfully', { variant: 'success' });
	};

	const handleGenerateNarrative = useCallback(async () => {
		if (!selectedCase) return;
		setNarrativeLoading(true);
		setNarrativeOpen(true);
		setNarrativeText('');
		try {
			const driver = drivers.find((d) => d.driverId === selectedCase.driverId);
			const res = await fetch('/api/lofat/case-narrative', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					caseData: selectedCase,
					driver: driver ?? {},
					evidence: selectedCase.evidenceSummary,
				}),
			});

			if (!res.ok) throw new Error('Failed');
			if (!res.body) throw new Error('No stream');

			const reader = res.body.getReader();
			const decoder = new TextDecoder();
			let accumulated = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				accumulated += decoder.decode(value, { stream: true });
				setNarrativeText(accumulated);
			}
		} catch {
			setNarrativeText('Failed to generate narrative. Please try again.');
		} finally {
			setNarrativeLoading(false);
		}
	}, [selectedCase, drivers]);

	const handleUpdateStatus = (caseId: string, newStatus: CaseStatus, resolution?: string) => {
		setCases((prev) =>
			prev.map((c) =>
				c.caseId === caseId
					? { ...c, status: newStatus, resolution: resolution ?? c.resolution }
					: c
			)
		);
		if (selectedCase?.caseId === caseId) {
			setSelectedCase((prev) => prev ? { ...prev, status: newStatus, resolution: resolution ?? prev.resolution } : prev);
		}
		enqueueSnackbar(`Case ${caseId} updated to ${newStatus.replace(/_/g, ' ')}`, { variant: 'info' });
	};

	const caseColumns = useMemo<MRT_ColumnDef<InvestigationCase>[]>(
		() => [
			{ accessorKey: 'caseId', header: 'Case ID', size: 130, Cell: ({ row }) => <Typography variant="body2" className="font-mono font-medium">{row.original.caseId}</Typography> },
			{ accessorKey: 'driverName', header: 'Driver', size: 140, Cell: ({ row }) => <div><Typography variant="body2">{row.original.driverName}</Typography><Typography variant="caption" color="text.secondary" className="font-mono">{row.original.driverId}</Typography></div> },
			{ accessorKey: 'fraudPattern', header: 'Pattern', size: 120, Cell: ({ row }) => <Chip label={PATTERN_LABELS[row.original.fraudPattern]} size="small" sx={{ fontSize: '0.6rem', height: 22, backgroundColor: `${PATTERN_COLORS[row.original.fraudPattern]}15`, color: PATTERN_COLORS[row.original.fraudPattern], fontWeight: 600 }} /> },
			{ accessorKey: 'openedDate', header: 'Opened', size: 100, Cell: ({ row }) => <Typography variant="caption">{new Date(row.original.openedDate).toLocaleDateString()}</Typography> },
			{ accessorKey: 'status', header: 'Status', size: 140, Cell: ({ row }) => <Chip label={row.original.status.replace(/_/g, ' ')} size="small" color={CASE_STATUS_COLORS[row.original.status]} variant={STATUS_VARIANT[row.original.status]} sx={{ fontSize: '0.6rem', height: 22, fontWeight: 600 }} /> },
			{ accessorKey: 'estimatedFraudAmount', header: 'Est. Fraud $', size: 100, Cell: ({ row }) => <Typography variant="body2" className="font-semibold">${row.original.estimatedFraudAmount.toLocaleString()}</Typography> },
			{ accessorKey: 'assignedInvestigator', header: 'Investigator', size: 150, Cell: ({ row }) => <Typography variant="caption">{row.original.assignedInvestigator.split('(')[0].trim()}</Typography> },
			{
				id: 'actions', header: 'Actions', size: 60, enableSorting: false,
				Cell: ({ row }) => (
					<Tooltip title="View Case">
						<IconButton size="small" onClick={(e) => { e.stopPropagation(); setSelectedCase(row.original); }}>
							<FuseSvgIcon size={16}>heroicons-outline:eye</FuseSvgIcon>
						</IconButton>
					</Tooltip>
				),
			},
		],
		[]
	);

	const sidebar = (
		<div className="w-[240px] p-3 space-y-3">
			<Typography variant="subtitle2" className="font-semibold">Filters</Typography>

			{/* Status filters */}
			<div>
				<Typography variant="caption" color="text.secondary" className="mb-1 block">Status</Typography>
				<div className="flex flex-wrap gap-1">
					{CASE_STATUSES.map((s) => (
						<Chip
							key={s}
							label={s.replace(/_/g, ' ')}
							size="small"
							variant={statusFilters.includes(s) ? 'filled' : 'outlined'}
							color={statusFilters.includes(s) ? CASE_STATUS_COLORS[s] : 'default'}
							onClick={() => toggleStatus(s)}
							sx={{ fontSize: '0.6rem', height: 24 }}
						/>
					))}
				</div>
			</div>

			{/* Pattern filters */}
			<div>
				<Typography variant="caption" color="text.secondary" className="mb-1 block">Pattern</Typography>
				<div className="flex flex-wrap gap-1">
					{FRAUD_PATTERNS.map((p) => (
						<Chip
							key={p}
							label={PATTERN_LABELS[p]}
							size="small"
							variant={patternFilters.includes(p) ? 'filled' : 'outlined'}
							color={patternFilters.includes(p) ? 'warning' : 'default'}
							onClick={() => togglePattern(p)}
							sx={{ fontSize: '0.6rem', height: 24 }}
						/>
					))}
				</div>
			</div>

			{/* Summary */}
			<Paper className="p-2 space-y-1" elevation={0} variant="outlined">
				<div className="flex justify-between">
					<Typography variant="caption" color="text.secondary">Open</Typography>
					<Typography variant="caption" className="font-semibold" color="warning.main">{openCount}</Typography>
				</div>
				<div className="flex justify-between">
					<Typography variant="caption" color="text.secondary">Escalated</Typography>
					<Typography variant="caption" className="font-semibold" color="error">{escalatedCount}</Typography>
				</div>
				<div className="flex justify-between">
					<Typography variant="caption" color="text.secondary">Recovered</Typography>
					<Typography variant="caption" className="font-semibold" color="success.main">${recoveredSum.toLocaleString()}</Typography>
				</div>
			</Paper>
		</div>
	);

	if (loading) {
		return (
			<Root
				scroll="content"
				header={<div className="p-3 sm:px-4"><PageBreadcrumb className="mb-1" /><Skeleton variant="text" width={200} height={32} /></div>}
				leftSidebarContent={<div className="w-[240px] p-3"><Skeleton variant="rounded" height={300} /></div>}
				leftSidebarOpen
				leftSidebarWidth={240}
				leftSidebarVariant="permanent"
				content={<div className="w-full p-3"><Skeleton variant="rounded" height={400} /></div>}
			/>
		);
	}

	return (
		<Root
			scroll="content"
			header={
				<div className="flex items-center justify-between p-3 sm:px-4">
					<div>
						<PageBreadcrumb className="mb-1" />
						<div className="flex items-center gap-2">
							<FuseSvgIcon size={24} color="secondary">heroicons-outline:briefcase</FuseSvgIcon>
							<Typography variant="h6" className="font-semibold">Case Management</Typography>
						</div>
					</div>
					<Button
						variant="contained"
						size="small"
						onClick={() => setCreateOpen(true)}
						startIcon={<FuseSvgIcon size={16}>heroicons-outline:plus</FuseSvgIcon>}
						sx={{ backgroundColor: '#0d9488', textTransform: 'none', '&:hover': { backgroundColor: '#0f766e' } }}
					>
						Create Case
					</Button>
				</div>
			}
			leftSidebarContent={sidebar}
			leftSidebarOpen
			leftSidebarWidth={240}
			leftSidebarVariant="permanent"
			content={
				<div className="w-full p-3 sm:p-4">
					<motion.div variants={containerVariants} initial="hidden" animate="show">
						{/* Case Table */}
						<motion.div variants={itemVariants}>
							<DataTable
								columns={caseColumns}
								data={filtered}
								enableRowSelection={false}
								enableRowActions={false}
								enableColumnOrdering={false}
								enableGrouping={false}
								enableColumnPinning={false}
								enableDensityToggle={false}
								enableHiding={false}
								enableStickyHeader
								initialState={{ density: 'compact', sorting: [{ id: 'openedDate', desc: true }] }}
								muiTableBodyRowProps={({ row }) => ({
									onClick: () => setSelectedCase(row.original),
									sx: {
										cursor: 'pointer',
										'&:hover': { backgroundColor: 'action.hover' },
										...(selectedCase?.caseId === row.original.caseId && {
											backgroundColor: 'rgba(25, 118, 210, 0.08)',
										}),
									},
								})}
							/>
						</motion.div>

						{/* Case Detail Panel */}
						{selectedCase && (
							<motion.div variants={itemVariants} className="mt-2">
								<Paper className="p-3" elevation={0} variant="outlined">
									<div className="flex items-center justify-between mb-2">
										<div className="flex items-center gap-2">
											<Typography variant="subtitle1" className="font-semibold font-mono">{selectedCase.caseId}</Typography>
											<Chip label={selectedCase.status.replace(/_/g, ' ')} size="small" color={CASE_STATUS_COLORS[selectedCase.status]} variant={STATUS_VARIANT[selectedCase.status]} sx={{ fontSize: '0.65rem', fontWeight: 600 }} />
											<Chip label={PATTERN_LABELS[selectedCase.fraudPattern]} size="small" sx={{ fontSize: '0.65rem', backgroundColor: `${PATTERN_COLORS[selectedCase.fraudPattern]}15`, color: PATTERN_COLORS[selectedCase.fraudPattern] }} />
										</div>
										<IconButton size="small" onClick={() => setSelectedCase(null)}>
											<FuseSvgIcon size={16}>heroicons-outline:x-mark</FuseSvgIcon>
										</IconButton>
									</div>

									<div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-2">
										<div>
											<Typography variant="caption" color="text.secondary">Driver</Typography>
											<Typography variant="body2" className="font-medium">{selectedCase.driverName} ({selectedCase.driverId})</Typography>
										</div>
										<div>
											<Typography variant="caption" color="text.secondary">Investigator</Typography>
											<Typography variant="body2">{selectedCase.assignedInvestigator}</Typography>
										</div>
									</div>

									<Typography variant="caption" color="text.secondary">Evidence Summary</Typography>
									<Typography variant="body2" className="mb-2">{selectedCase.evidenceSummary}</Typography>

									{selectedCase.resolution && (
										<>
											<Typography variant="caption" color="text.secondary">Resolution</Typography>
											<Typography variant="body2" className="mb-2">{selectedCase.resolution}</Typography>
										</>
									)}

									<div className="flex items-center gap-1 mt-2 flex-wrap">
										{selectedCase.status !== 'CLOSED_FRAUD' && selectedCase.status !== 'CLOSED_FALSE_POSITIVE' && (
											<>
												<Button size="small" color="success" variant="outlined" onClick={() => handleUpdateStatus(selectedCase.caseId, 'CLOSED_FRAUD', `Driver terminated. Total recovered: $${selectedCase.estimatedFraudAmount.toLocaleString()}. Case forwarded to HR.`)} sx={{ textTransform: 'none', fontSize: '0.7rem' }}>
													Mark Resolved
												</Button>
												<Button size="small" color="error" variant="outlined" onClick={() => handleUpdateStatus(selectedCase.caseId, 'ESCALATED')} sx={{ textTransform: 'none', fontSize: '0.7rem' }}>
													Escalate to Legal
												</Button>
												<Button size="small" variant="outlined" onClick={() => handleUpdateStatus(selectedCase.caseId, 'CLOSED_FALSE_POSITIVE', 'Investigation cleared. GPS anomaly attributed to device malfunction. Driver reinstated.')} sx={{ textTransform: 'none', fontSize: '0.7rem' }}>
													Close - False Positive
												</Button>
											</>
										)}
										<Button
											size="small"
											color="secondary"
											variant="contained"
											onClick={handleGenerateNarrative}
											startIcon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
											sx={{ textTransform: 'none', fontSize: '0.7rem' }}
										>
											Draft Case Report
										</Button>
									</div>
								</Paper>
							</motion.div>
						)}
					</motion.div>

					{/* Create Case Dialog */}
					<Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
						<DialogTitle>Create New Case</DialogTitle>
						<DialogContent className="space-y-3 pt-2">
							<Autocomplete
								options={drivers.filter((d) => d.fraudScore >= 40)}
								getOptionLabel={(d) => `${d.name} (${d.driverId}) — Score: ${d.fraudScore}`}
								value={newDriver}
								onChange={(_, v) => {
									setNewDriver(v);
									if (v?.primaryFraudPattern) setNewPattern(v.primaryFraudPattern);
								}}
								renderInput={(params) => <TextField {...params} label="Select Driver" size="small" fullWidth />}
								sx={{ mt: 1 }}
							/>
							<FormControl fullWidth size="small">
								<InputLabel>Fraud Pattern</InputLabel>
								<Select value={newPattern} onChange={(e) => setNewPattern(e.target.value as FraudPattern)} label="Fraud Pattern">
									{FRAUD_PATTERNS.map((p) => <MenuItem key={p} value={p}>{PATTERN_LABELS[p]}</MenuItem>)}
								</Select>
							</FormControl>
							<TextField label="Evidence Notes" multiline rows={3} fullWidth size="small" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} />
							<TextField label="Estimated Fraud Amount ($)" type="number" fullWidth size="small" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} />
							<TextField label="Assign to Investigator" fullWidth size="small" value={newInvestigator} onChange={(e) => setNewInvestigator(e.target.value)} />
						</DialogContent>
						<DialogActions>
							<Button onClick={() => setCreateOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
							<Button onClick={handleCreateCase} variant="contained" disabled={!newDriver || !newPattern} sx={{ textTransform: 'none', backgroundColor: '#0d9488' }}>Create</Button>
						</DialogActions>
					</Dialog>

					{/* Case Narrative Dialog */}
					<Dialog open={narrativeOpen} onClose={() => setNarrativeOpen(false)} maxWidth="md" fullWidth>
						<DialogTitle>
							<div className="flex items-center gap-2">
								<AutoAwesomeIcon color="secondary" />
								<span>Draft Case Report</span>
								<Chip icon={<AutoAwesomeIcon />} label="AI-Enhanced" size="small" color="secondary" variant="outlined" />
							</div>
						</DialogTitle>
						<DialogContent>
							{narrativeLoading ? (
								<div className="space-y-2 py-2">
									<Skeleton variant="text" width="80%" />
									<Skeleton variant="text" width="100%" />
									<Skeleton variant="text" width="90%" />
									<Skeleton variant="text" width="85%" />
									<Skeleton variant="text" width="95%" />
									<Skeleton variant="text" width="70%" />
								</div>
							) : (
								<TextField
									multiline
									rows={16}
									fullWidth
									value={narrativeText}
									onChange={(e) => setNarrativeText(e.target.value)}
									sx={{ mt: 1, '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: '0.8rem' } }}
								/>
							)}
						</DialogContent>
						<DialogActions>
							<Button onClick={handleGenerateNarrative} disabled={narrativeLoading} sx={{ textTransform: 'none' }}>Regenerate</Button>
							<Button onClick={() => setNarrativeOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
							<Button
								variant="contained"
								disabled={narrativeLoading}
								onClick={() => {
									if (selectedCase) {
										handleUpdateStatus(selectedCase.caseId, selectedCase.status, narrativeText);
									}
									setNarrativeOpen(false);
									enqueueSnackbar('Case report saved', { variant: 'success' });
								}}
								sx={{ textTransform: 'none' }}
							>
								Save to Case
							</Button>
						</DialogActions>
					</Dialog>
				</div>
			}
		/>
	);
}

export default CasesPage;
