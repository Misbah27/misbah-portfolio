'use client';

import { useState, useEffect } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import DataTable from 'src/components/data-table/DataTable';
import { type MRT_ColumnDef } from 'material-react-table';
import { motion } from 'motion/react';
import type { ObfuscationJob } from '../../types';

const statusColors: Record<string, 'success' | 'error' | 'info'> = {
	COMPLETED: 'success',
	FAILED: 'error',
	RUNNING: 'info',
};

const metrics = [
	{ label: '99.9% Availability', icon: 'heroicons-outline:signal' },
	{ label: '200+ Jobs Processed', icon: 'heroicons-outline:cog-6-tooth' },
	{ label: '12 Datasets Protected', icon: 'heroicons-outline:shield-check' },
	{ label: '0 Seed Leaks', icon: 'heroicons-outline:lock-closed' },
];

const containerVariants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
	hidden: { opacity: 0, y: 12 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const columns: MRT_ColumnDef<ObfuscationJob>[] = [
	{ accessorKey: 'jobId', header: 'Job ID', size: 130 },
	{ accessorKey: 'datasetName', header: 'Dataset', size: 160 },
	{
		accessorKey: 'submittedAt',
		header: 'Submitted',
		size: 140,
		Cell: ({ cell }) => new Date(cell.getValue<string>()).toLocaleDateString(),
	},
	{
		accessorKey: 'processingTimeMs',
		header: 'Duration',
		size: 100,
		Cell: ({ cell }) => `${(cell.getValue<number>() / 1000).toFixed(1)}s`,
	},
	{
		accessorKey: 'status',
		header: 'Status',
		size: 110,
		Cell: ({ cell }) => (
			<Chip label={cell.getValue<string>()} size="small" color={statusColors[cell.getValue<string>()]} sx={{ fontSize: '0.65rem', height: 20 }} />
		),
	},
	{ accessorKey: 'piiColumnsObfuscated', header: 'PII Cols', size: 80 },
	{ accessorKey: 'reidentificationRequests', header: 'Re-id Requests', size: 110 },
];

/**
 * Job History tab — historical obfuscation jobs from JSON.
 */
export default function JobHistoryTab() {
	const [jobs, setJobs] = useState<ObfuscationJob[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		import('@/data/dataops/obfuscation-jobs.json')
			.then((mod) => setJobs(mod.default as ObfuscationJob[]))
			.catch(() => setJobs([]))
			.finally(() => setLoading(false));
	}, []);

	if (loading) {
		return (
			<div className="space-y-3">
				<div className="grid grid-cols-4 gap-3">
					{[1, 2, 3, 4].map((i) => <Skeleton key={i} variant="rectangular" height={70} />)}
				</div>
				<Skeleton variant="rectangular" height={300} />
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<motion.div
				className="grid grid-cols-2 sm:grid-cols-4 gap-3"
				variants={containerVariants}
				initial="hidden"
				animate="visible"
			>
				{metrics.map((m) => (
					<motion.div key={m.label} variants={itemVariants}>
						<Paper variant="outlined" className="p-3 text-center">
							<FuseSvgIcon size={20} color="action" className="mx-auto mb-1">{m.icon}</FuseSvgIcon>
							<Typography variant="body2" className="font-semibold">{m.label}</Typography>
						</Paper>
					</motion.div>
				))}
			</motion.div>

			<DataTable
				columns={columns as MRT_ColumnDef<ObfuscationJob>[]}
				data={jobs}
				enableRowSelection={false}
				enableRowActions={false}
				enableColumnOrdering={false}
				enableGrouping={false}
				enableColumnPinning={false}
				enableDensityToggle={false}
				enableHiding={false}
				enableStickyHeader
				initialState={{ density: 'compact' }}
			/>
		</div>
	);
}
