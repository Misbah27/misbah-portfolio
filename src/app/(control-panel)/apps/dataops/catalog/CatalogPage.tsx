'use client';

import { useState, useMemo, useEffect } from 'react';
import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Fab from '@mui/material/Fab';
import Chip from '@mui/material/Chip';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import Fuse from 'fuse.js';
import PageBreadcrumb from 'src/components/PageBreadcrumb';
import catalogJson from '@/data/dataops/catalog.json';
import type { DatasetCatalogEntry } from '../types';
import CatalogSidebar, { type CatalogFilters, INITIAL_FILTERS } from './components/CatalogSidebar';
import DatasetCardGrid from './components/DatasetCardGrid';
import DatasetDetail from './components/DatasetDetail';
import DataVaultDrawer from './components/DataVaultDrawer';
import { getUserCatalogEntries } from './userDatasetStore';

const staticCatalog = catalogJson as DatasetCatalogEntry[];

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
	'& .FusePageSimple-leftSidebar': {
		borderRight: `1px solid ${theme.vars.palette.divider}`,
		backgroundColor: theme.vars.palette.background.paper,
	},
}));

/**
 * Data Catalog — browse and explore published datasets.
 */
export default function CatalogPage() {
	const [filters, setFilters] = useState<CatalogFilters>(INITIAL_FILTERS);
	const [selected, setSelected] = useState<DatasetCatalogEntry | null>(null);
	const [chatOpen, setChatOpen] = useState(false);
	const [catalog, setCatalog] = useState<DatasetCatalogEntry[]>(staticCatalog);

	useEffect(() => {
		const userEntries = getUserCatalogEntries();
		if (userEntries.length > 0) {
			setCatalog([...staticCatalog, ...userEntries]);
		}
	}, []);

	const fuseIndex = useMemo(
		() => new Fuse(catalog, {
			keys: ['name', 'description', 'tags', 'schema.name', 'owner', 'domain'],
			threshold: 0.4,
			includeScore: true,
		}),
		[catalog]
	);

	const filtered = useMemo(() => {
		let results = catalog.filter((ds) => ds.publishedToCatalog);

		if (filters.search.trim()) {
			const hits = fuseIndex.search(filters.search.trim());
			const hitIds = new Set(hits.map((h) => h.item.datasetId));
			results = results.filter((ds) => hitIds.has(ds.datasetId));
		}

		results = results.filter((ds) => filters.industries.includes(ds.industryTag));

		if (filters.classifications.length > 0) {
			results = results.filter((ds) => filters.classifications.includes(ds.classification));
		}

		if (filters.regulatoryFlags.length > 0) {
			results = results.filter((ds) =>
				(ds.regulatoryFlags || []).some((f) => filters.regulatoryFlags.includes(f))
			);
		}

		if (filters.hasImages) {
			results = results.filter((ds) => ds.schema.some((c) => c.inferredType === 'IMAGE_URL'));
		}

		if (filters.piiOnly) {
			results = results.filter((ds) => ds.piiColumns.length > 0);
		}

		switch (filters.sortBy) {
			case 'name':
				results.sort((a, b) => a.name.localeCompare(b.name));
				break;
			case 'lastUpdated':
				results.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
				break;
			case 'qualityScore':
				results.sort((a, b) => (b.statistics.qualityScore ?? 0) - (a.statistics.qualityScore ?? 0));
				break;
			case 'rowCount':
				results.sort((a, b) => b.rowCount - a.rowCount);
				break;
		}

		return results;
	}, [filters, catalog, fuseIndex]);

	const handleOpenDataset = (entry: DatasetCatalogEntry) => {
		setSelected(entry);
	};

	return (
		<>
			<Root
				scroll="content"
				header={
					<div className="flex flex-col w-full py-2 px-6 sm:px-8">
						<PageBreadcrumb />
						<div className="flex items-center gap-2">
							<FuseSvgIcon size={20} color="secondary">heroicons-outline:book-open</FuseSvgIcon>
							<Typography className="text-lg font-bold">Data Catalog</Typography>
							<Chip
								label={`${filtered.length} datasets`}
								size="small"
								variant="outlined"
							/>
							<Typography variant="caption" color="text.secondary" className="ml-1">
								Browse datasets with metadata, lineage, and quality reports
							</Typography>
						</div>
					</div>
				}
				leftSidebarContent={
					<CatalogSidebar filters={filters} onChange={setFilters} />
				}
				leftSidebarOpen
				leftSidebarWidth={280}
				leftSidebarVariant="permanent"
				content={
					<div className="w-full p-6 sm:p-8">
						{selected ? (
							<DatasetDetail
								entry={selected}
								allEntries={catalog}
								onBack={() => setSelected(null)}
								onNavigate={handleOpenDataset}
							/>
						) : (
							<DatasetCardGrid datasets={filtered} onSelect={handleOpenDataset} />
						)}
					</div>
				}
			/>

			<Fab
				color="secondary"
				sx={{ position: 'fixed', bottom: 72, right: 24, zIndex: 50 }}
				onClick={() => setChatOpen(true)}
			>
				<AutoAwesomeIcon />
			</Fab>

			<DataVaultDrawer
				open={chatOpen}
				onClose={() => setChatOpen(false)}
				catalog={catalog}
				onOpenDataset={handleOpenDataset}
			/>
		</>
	);
}
