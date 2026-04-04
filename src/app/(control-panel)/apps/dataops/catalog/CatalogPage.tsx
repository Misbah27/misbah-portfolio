'use client';

import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
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

/**
 * Data Catalog page — placeholder for future session.
 */
export default function CatalogPage() {
	return (
		<Root
			header={
				<div className="flex flex-col w-full px-24 pt-24 pb-16 sm:px-32">
					<div className="flex items-center gap-12">
						<FuseSvgIcon
							size={28}
							color="secondary"
						>
							heroicons-outline:book-open
						</FuseSvgIcon>
						<Typography className="text-3xl font-extrabold tracking-tight leading-none">
							Data Catalog
						</Typography>
					</div>
					<Typography
						className="mt-4"
						color="text.secondary"
					>
						Browse and explore published datasets with full metadata, lineage, and quality reports.
					</Typography>
				</div>
			}
			content={
				<motion.div
					className="w-full px-24 py-24 sm:px-32"
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3 }}
				>
					<Typography color="text.secondary">
						Catalog will be populated after datasets are ingested through the wizard.
					</Typography>
				</motion.div>
			}
		/>
	);
}
