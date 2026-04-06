'use client';

import { useState } from 'react';
import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Chip from '@mui/material/Chip';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PageBreadcrumb from 'src/components/PageBreadcrumb';
import { motion } from 'motion/react';
import catalogJson from '@/data/dataops/catalog.json';
import type { DatasetCatalogEntry } from '../types';
import ConfigureTab from './components/ConfigureTab';
import ApprovalQueueTab from './components/ApprovalQueueTab';
import AuditLogTab from './components/AuditLogTab';
import JobHistoryTab from './components/JobHistoryTab';

const catalog = catalogJson as DatasetCatalogEntry[];

const Root = styled(FusePageSimple)(({ theme }) => ({
	'&.FusePageSimple-scroll-content': {
		height: '100%',
	},
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
 * Data Obfuscation service — format-preserving HMAC-SHA256 obfuscation.
 */
export default function ObfuscationPage() {
	const [tab, setTab] = useState(0);

	return (
		<Root
			scroll="content"
			header={
				<div className="flex flex-col w-full p-6 sm:px-8">
					<PageBreadcrumb className="mb-2" />
					<div className="flex items-center gap-3">
						<FuseSvgIcon size={24} color="secondary">heroicons-outline:shield-check</FuseSvgIcon>
						<Typography className="text-xl font-bold">Data Obfuscation</Typography>
						<Chip
							icon={<AutoAwesomeIcon />}
							label="AI-Enhanced"
							size="small"
							color="secondary"
							variant="outlined"
						/>
					</div>
					<Typography variant="body2" color="text.secondary">
						Apply format-preserving, deterministic HMAC-SHA256 obfuscation to PII columns.
					</Typography>
				</div>
			}
			content={
				<motion.div
					className="w-full p-6 sm:p-8"
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3 }}
				>
					<Tabs value={tab} onChange={(_, v) => setTab(v)} className="mb-3">
						<Tab label="Configure & Run" />
						<Tab label="Approval Queue" />
						<Tab label="Audit Log" />
						<Tab label="Job History" />
					</Tabs>

					{tab === 0 && <ConfigureTab catalog={catalog} />}
					{tab === 1 && <ApprovalQueueTab />}
					{tab === 2 && <AuditLogTab />}
					{tab === 3 && <JobHistoryTab />}
				</motion.div>
			}
		/>
	);
}
