'use client';

import { useState } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useSnackbar } from 'notistack';
import { motion } from 'motion/react';
import { INDUSTRY_LABELS, INDUSTRY_COLORS, type DatasetCatalogEntry } from '../../../types';

const containerVariants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
	hidden: { opacity: 0, y: 12 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function qualityColor(score: number | null): string {
	if (!score) return '#F44336';
	if (score >= 80) return '#4CAF50';
	if (score >= 60) return '#FF9800';
	return '#F44336';
}

interface Props {
	entry: DatasetCatalogEntry;
}

/**
 * Overview tab — stat cards, description, regulatory flags, tags.
 */
export default function OverviewTab({ entry }: Props) {
	const { enqueueSnackbar } = useSnackbar();
	const [reidOpen, setReidOpen] = useState(false);
	const [reason, setReason] = useState('');
	const [justification, setJustification] = useState('');

	const stats = [
		{ label: 'Rows', value: entry.rowCount.toLocaleString(), icon: 'heroicons-outline:table-cells' },
		{ label: 'Columns', value: String(entry.schema.length), icon: 'heroicons-outline:view-columns' },
		{ label: 'Quality', value: entry.statistics.qualityScore !== null ? String(entry.statistics.qualityScore) : 'N/A', icon: 'heroicons-outline:chart-bar', color: qualityColor(entry.statistics.qualityScore) },
		{ label: 'PII Fields', value: String(entry.piiColumns.length), icon: 'heroicons-outline:shield-exclamation' },
	];

	return (
		<motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
			<motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
				{stats.map((s) => (
					<Paper key={s.label} variant="outlined" className="p-3 text-center">
						<FuseSvgIcon size={20} sx={{ color: s.color || 'text.secondary' }} className="mx-auto mb-1">
							{s.icon}
						</FuseSvgIcon>
						<Typography className="text-xl font-bold" sx={{ color: s.color }}>{s.value}</Typography>
						<Typography variant="caption" color="text.secondary">{s.label}</Typography>
					</Paper>
				))}
			</motion.div>

			<motion.div variants={itemVariants}>
				<Paper variant="outlined" className="p-3">
					<div className="flex items-center gap-2 mb-1">
						<Chip label={INDUSTRY_LABELS[entry.industryTag]} size="small" sx={{ backgroundColor: INDUSTRY_COLORS[entry.industryTag], color: '#fff' }} />
						<Chip label={entry.classification} size="small" variant="outlined" />
						<Typography variant="caption" color="text.secondary">Owner: {entry.owner}</Typography>
					</div>
					<Typography variant="body2" className="mb-2">{entry.description}</Typography>
					{entry.businessContext && (
						<Typography variant="body2" color="text.secondary">{entry.businessContext}</Typography>
					)}
				</Paper>
			</motion.div>

			{(entry.regulatoryFlags || []).filter((f) => f !== 'NONE').length > 0 && (
				<motion.div variants={itemVariants}>
					<Typography variant="caption" color="text.secondary" className="font-semibold mb-1 block">Regulatory Compliance</Typography>
					<div className="flex gap-1 flex-wrap">
						{(entry.regulatoryFlags || []).filter((f) => f !== 'NONE').map((flag) => (
							<Chip key={flag} label={flag} size="small" variant="outlined" color="warning" />
						))}
					</div>
				</motion.div>
			)}

			<motion.div variants={itemVariants}>
				<Typography variant="caption" color="text.secondary" className="font-semibold mb-1 block">Tags</Typography>
				<div className="flex gap-1 flex-wrap">
					{entry.tags.map((tag) => (
						<Chip key={tag} label={tag} size="small" variant="outlined" />
					))}
				</div>
			</motion.div>

			<motion.div variants={itemVariants}>
				<Typography variant="caption" color="text.secondary" className="font-semibold mb-1 block">Lineage</Typography>
				<Typography variant="body2">{entry.lineage.description}</Typography>
			</motion.div>

			<motion.div variants={itemVariants}>
				<Button
					variant="outlined"
					size="small"
					startIcon={<FuseSvgIcon size={16}>heroicons-outline:key</FuseSvgIcon>}
					onClick={() => setReidOpen(true)}
				>
					Request Re-identification
				</Button>
			</motion.div>

			<Dialog open={reidOpen} onClose={() => setReidOpen(false)} maxWidth="sm" fullWidth>
				<DialogTitle>Request Re-identification</DialogTitle>
				<DialogContent className="space-y-3 pt-2">
					<TextField label="Reason" fullWidth size="small" value={reason} onChange={(e) => setReason(e.target.value)} className="mt-2" />
					<TextField label="Business Justification" fullWidth size="small" multiline rows={3} value={justification} onChange={(e) => setJustification(e.target.value)} />
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setReidOpen(false)}>Cancel</Button>
					<Button
						variant="contained"
						onClick={() => {
							setReidOpen(false);
							setReason('');
							setJustification('');
							enqueueSnackbar('Re-identification request submitted', { variant: 'success' });
						}}
					>
						Submit
					</Button>
				</DialogActions>
			</Dialog>
		</motion.div>
	);
}
