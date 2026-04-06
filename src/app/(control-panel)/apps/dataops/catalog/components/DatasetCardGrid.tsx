'use client';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { motion } from 'motion/react';
import {
	INDUSTRY_LABELS,
	INDUSTRY_COLORS,
	type DatasetCatalogEntry,
} from '../../types';

const containerVariants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
	hidden: { opacity: 0, y: 12 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const classColors: Record<string, string> = {
	PII: '#F44336',
	CONFIDENTIAL: '#FF9800',
	INTERNAL: '#2196F3',
	PUBLIC: '#4CAF50',
};

function qualityColor(score: number | null): 'success' | 'warning' | 'error' {
	if (!score) return 'error';
	if (score >= 80) return 'success';
	if (score >= 60) return 'warning';
	return 'error';
}

interface Props {
	datasets: DatasetCatalogEntry[];
	onSelect: (entry: DatasetCatalogEntry) => void;
}

/**
 * Grid of dataset cards for the catalog browse view.
 */
export default function DatasetCardGrid({ datasets, onSelect }: Props) {
	if (datasets.length === 0) {
		return (
			<div className="flex items-center justify-center py-16">
				<Typography color="text.secondary">No datasets match your filters.</Typography>
			</div>
		);
	}

	return (
		<motion.div
			className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
			variants={containerVariants}
			initial="hidden"
			animate="visible"
		>
			{datasets.map((ds) => {
				const hasImages = ds.schema.some((c) => c.inferredType === 'IMAGE_URL');
				const qScore = ds.statistics.qualityScore;
				return (
					<motion.div key={ds.datasetId} variants={itemVariants}>
						<Paper
							variant="outlined"
							className="p-3 cursor-pointer h-full flex flex-col"
							sx={{
								borderLeft: `3px solid ${INDUSTRY_COLORS[ds.industryTag]}`,
								'&:hover': { boxShadow: 3 },
								transition: 'box-shadow 0.2s',
							}}
							onClick={() => onSelect(ds)}
						>
							<div className="flex items-center gap-2 mb-1">
								<Typography variant="subtitle1" className="font-semibold truncate flex-1">
									{ds.name}
								</Typography>
								<Chip
									label={INDUSTRY_LABELS[ds.industryTag]}
									size="small"
									sx={{ backgroundColor: INDUSTRY_COLORS[ds.industryTag], color: '#fff', fontSize: '0.65rem', height: 20 }}
								/>
							</div>

							<Chip
								label={ds.classification}
								size="small"
								sx={{ alignSelf: 'flex-start', backgroundColor: classColors[ds.classification], color: '#fff', fontSize: '0.65rem', height: 18, mb: 0.5 }}
							/>

							<Typography
								variant="body2"
								color="text.secondary"
								className="mb-2"
								sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
							>
								{ds.description}
							</Typography>

							<div className="flex items-center gap-3 mb-1">
								<Typography variant="caption" color="text.secondary">{ds.rowCount} rows</Typography>
								<Typography variant="caption" color="text.secondary">{ds.schema.length} columns</Typography>
								{qScore !== null && (
									<Badge badgeContent={qScore} color={qualityColor(qScore)} sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', height: 18, minWidth: 24 } }}>
										<Typography variant="caption" color="text.secondary" className="pr-4">Quality</Typography>
									</Badge>
								)}
							</div>

							<div className="flex items-center gap-1 flex-wrap">
								{ds.piiColumns.length > 0 && (
									<Tooltip title={`Contains ${ds.piiColumns.length} PII columns`}>
										<span className="flex items-center">
											<FuseSvgIcon size={16} sx={{ color: '#FF9800' }}>heroicons-solid:shield-exclamation</FuseSvgIcon>
										</span>
									</Tooltip>
								)}
								{hasImages && (
									<FuseSvgIcon size={16} color="action">heroicons-outline:photo</FuseSvgIcon>
								)}
								{(ds.regulatoryFlags || []).filter((f) => f !== 'NONE').map((flag) => (
									<Chip key={flag} label={flag} size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 18 }} />
								))}
							</div>

							<div className="flex items-center justify-between mt-auto pt-2">
								<Typography variant="caption" color="text.secondary">{ds.owner}</Typography>
								<Typography variant="caption" color="text.secondary">
									{new Date(ds.lastUpdated).toLocaleDateString()}
								</Typography>
							</div>
						</Paper>
					</motion.div>
				);
			})}
		</motion.div>
	);
}
