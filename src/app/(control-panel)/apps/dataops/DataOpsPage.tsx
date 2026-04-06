'use client';

import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Link from 'next/link';
import PageBreadcrumb from 'src/components/PageBreadcrumb';
import { motion } from 'motion/react';

const Root = styled(FusePageSimple)(({ theme }) => ({
	'& .FusePageSimple-header': {
		backgroundColor: theme.vars.palette.background.paper,
		borderBottomWidth: 1,
		borderStyle: 'solid',
		borderColor: theme.vars.palette.divider,
	},
	'& .FusePageSimple-content': {
		backgroundColor: theme.vars.palette.background.default,
	},
}));

const metrics = [
	{ label: 'Datasets Cataloged', value: '12', icon: 'heroicons-outline:circle-stack' },
	{ label: 'Industries Covered', value: '12', icon: 'heroicons-outline:globe-alt' },
	{ label: 'Metadata Accuracy', value: '99%', icon: 'heroicons-outline:sparkles' },
	{ label: 'Annual Savings', value: '$1.2M', icon: 'heroicons-outline:currency-dollar' },
];

const services = [
	{
		title: 'Ingest Wizard',
		description: 'Upload datasets, run quality checks, generate metadata, and publish to the catalog.',
		href: '/apps/dataops/ingest',
		icon: 'heroicons-outline:cloud-arrow-up',
		stats: '4-step wizard',
		accent: '#3b82f6',
	},
	{
		title: 'Data Catalog',
		description: 'Browse and explore all published datasets with full metadata, lineage, and quality reports.',
		href: '/apps/dataops/catalog',
		icon: 'heroicons-outline:book-open',
		stats: '12 datasets',
		accent: '#8b5cf6',
	},
	{
		title: 'Obfuscation Service',
		description: 'Apply format-preserving, deterministic obfuscation to PII columns using HMAC-SHA256.',
		href: '/apps/dataops/obfuscation',
		icon: 'heroicons-outline:shield-check',
		stats: 'JOIN-safe',
		accent: '#10b981',
	},
];

const containerVariants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
	hidden: { opacity: 0, y: 12 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

/**
 * DataOps Suite landing page — overview of the data management services.
 */
export default function DataOpsPage() {
	return (
		<Root
			header={
				<div className="flex flex-col w-full py-2 px-6 sm:px-8">
					<PageBreadcrumb />
					<div className="flex items-center gap-3">
						<Typography className="text-lg font-bold truncate">
							DataOps Suite
						</Typography>
						<Typography variant="caption" color="text.secondary">
							Ingest, catalog, obfuscate, and monitor quality across 12 industries
						</Typography>
					</div>
				</div>
			}
			content={
				<div className="w-full p-6 sm:p-8">
					{/* Impact metrics */}
					<motion.div
						className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
						variants={containerVariants}
						initial="hidden"
						animate="visible"
					>
						{metrics.map((m) => (
							<motion.div
								key={m.label}
								variants={itemVariants}
							>
								<Paper
									className="p-4 text-center"
									variant="outlined"
								>
									<FuseSvgIcon
										className="mb-1 mx-auto"
										size={20}
										color="action"
									>
										{m.icon}
									</FuseSvgIcon>
									<Typography className="text-2xl font-bold">{m.value}</Typography>
									<Typography
										variant="caption"
										color="text.secondary"
									>
										{m.label}
									</Typography>
								</Paper>
							</motion.div>
						))}
					</motion.div>

					{/* Service cards */}
					<Typography className="text-lg font-semibold mb-4">Services</Typography>
					<motion.div
						className="grid grid-cols-1 md:grid-cols-3 gap-4"
						variants={containerVariants}
						initial="hidden"
						animate="visible"
					>
						{services.map((svc) => (
							<motion.div
								key={svc.title}
								variants={itemVariants}
							>
								<Card
									variant="outlined"
									className="flex flex-col h-full"
									sx={{ borderLeft: `3px solid ${svc.accent}` }}
								>
									<CardContent className="flex-1 pb-2">
										<Box className="flex items-center gap-3 mb-3">
											<Box
												className="w-9 h-9 rounded-lg flex items-center justify-center"
												sx={{ backgroundColor: `${svc.accent}15` }}
											>
												<FuseSvgIcon
													size={20}
													sx={{ color: svc.accent }}
												>
													{svc.icon}
												</FuseSvgIcon>
											</Box>
											<Typography className="font-semibold">{svc.title}</Typography>
										</Box>
										<Typography
											variant="body2"
											color="text.secondary"
										>
											{svc.description}
										</Typography>
									</CardContent>
									<CardActions className="px-4 pb-4 pt-0 flex items-center justify-between">
										<Typography
											variant="caption"
											color="text.secondary"
										>
											{svc.stats}
										</Typography>
										<Button
											component={Link}
											href={svc.href}
											variant="outlined"
											size="small"
											endIcon={
												<FuseSvgIcon size={14}>heroicons-outline:arrow-right</FuseSvgIcon>
											}
										>
											Open
										</Button>
									</CardActions>
								</Card>
							</motion.div>
						))}
					</motion.div>
				</div>
			}
		/>
	);
}
