'use client';

import { useState } from 'react';
import Button from '@mui/material/Button';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { motion } from 'motion/react';
import type { DatasetCatalogEntry } from '../../types';
import OverviewTab from './tabs/OverviewTab';
import SchemaTab from './tabs/SchemaTab';
import PreviewTab from './tabs/PreviewTab';
import LineageTab from './tabs/LineageTab';
import QualityTab from './tabs/QualityTab';
import ObservabilityTab from './tabs/ObservabilityTab';

interface Props {
	entry: DatasetCatalogEntry;
	allEntries: DatasetCatalogEntry[];
	onBack: () => void;
	onNavigate: (entry: DatasetCatalogEntry) => void;
}

/**
 * Dataset detail view with 6 MUI Tabs.
 */
export default function DatasetDetail({ entry, allEntries, onBack, onNavigate }: Props) {
	const [tab, setTab] = useState(0);

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
		>
			<Button
				size="small"
				startIcon={<FuseSvgIcon size={16}>heroicons-outline:arrow-left</FuseSvgIcon>}
				onClick={onBack}
				className="mb-2"
			>
				Back to Catalog
			</Button>

			<Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" className="mb-3">
				<Tab label="Overview" />
				<Tab label="Schema" />
				<Tab label="Preview & Stats" />
				<Tab label="Lineage" />
				<Tab label="Quality" />
				<Tab label="Observability" />
			</Tabs>

			{tab === 0 && <OverviewTab entry={entry} />}
			{tab === 1 && <SchemaTab entry={entry} />}
			{tab === 2 && <PreviewTab entry={entry} />}
			{tab === 3 && <LineageTab entry={entry} allEntries={allEntries} onNavigate={onNavigate} />}
			{tab === 4 && <QualityTab entry={entry} />}
			{tab === 5 && <ObservabilityTab entry={entry} />}
		</motion.div>
	);
}
