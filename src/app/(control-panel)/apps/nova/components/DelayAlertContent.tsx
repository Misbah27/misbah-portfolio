'use client';

import { useState, useMemo, useCallback } from 'react';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { motion } from 'motion/react';
import type { DelayAlert, AlertType, DelayAlertFilters } from '../types';
import { INITIAL_FILTERS } from '../types';
import DelayIntelligenceBrief from './DelayIntelligenceBrief';
import SummaryCards from './SummaryCards';
import NlDelayFilter from './NlDelayFilter';
import DelayAlertToolbar from './DelayAlertToolbar';
import DelayAlertTable from './DelayAlertTable';
import ExecSummaryButton from './ExecSummaryButton';

interface DelayAlertContentProps {
	alerts: DelayAlert[];
}

/**
 * Main content area with LH/MR tabs, AI brief, summary cards, NL filter, toolbar, and data table.
 */
function DelayAlertContent({ alerts }: DelayAlertContentProps) {
	const [activeTab, setActiveTab] = useState<AlertType>('LH');
	const [searchQuery, setSearchQuery] = useState('');
	const [filters, setFilters] = useState<DelayAlertFilters>(INITIAL_FILTERS);
	const [nlFilterVrids, setNlFilterVrids] = useState<string[] | null>(null);

	const tabAlerts = useMemo(() => alerts.filter((a) => a.type === activeTab), [alerts, activeTab]);

	const filteredAlerts = useMemo(() => {
		let result = tabAlerts;

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			result = result.filter(
				(a) =>
					a.vrid.toLowerCase().includes(q) ||
					a.destination.toLowerCase().includes(q)
			);
		}

		if (filters.zone !== 'ALL') {
			result = result.filter((a) => a.zone === filters.zone);
		}
		if (filters.scac !== 'ALL') {
			result = result.filter((a) => a.scac === filters.scac);
		}
		if (filters.reason !== 'ALL') {
			result = result.filter((a) => a.reasonCodedBy === filters.reason);
		}

		if (nlFilterVrids !== null) {
			const vridSet = new Set(nlFilterVrids);
			result = result.filter((a) => vridSet.has(a.vrid));
		}

		return result;
	}, [tabAlerts, searchQuery, filters, nlFilterVrids]);

	const handleExport = useCallback(() => {
		const header = 'VRID,Lane,Destination,Zone,SCAC,Reason Coded By,Delay Hours,Planned Yard Time,ETA';
		const rows = filteredAlerts.map((a) =>
			[a.vrid, a.lane, a.destination, a.zone, a.scac, a.reasonCodedBy,
				a.delayHours.toFixed(2), a.plannedYardTime, a.eta ?? ''].join(',')
		);
		const csv = [header, ...rows].join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `nova-delay-alerts-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`;
		link.click();
		URL.revokeObjectURL(url);
	}, [filteredAlerts, activeTab]);

	const handleNlFilter = useCallback((vrids: string[] | null) => {
		setNlFilterVrids(vrids);
	}, []);

	return (
		<motion.div
			className="flex flex-col gap-4"
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
		>
			<Tabs
				value={activeTab}
				onChange={(_, v: AlertType) => { setActiveTab(v); setNlFilterVrids(null); }}
				sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, textTransform: 'none' } }}
			>
				<Tab value="LH" label="Delay Alerts LH" />
				<Tab value="MR" label="Delay Alerts MR" />
			</Tabs>

			<DelayIntelligenceBrief alerts={tabAlerts} />

			<SummaryCards alerts={filteredAlerts} />

			<NlDelayFilter alerts={tabAlerts} onFilter={handleNlFilter} />

			<div className="flex items-center gap-3">
				<div className="flex-1">
					<DelayAlertToolbar
						searchQuery={searchQuery}
						onSearchChange={setSearchQuery}
						filters={filters}
						onFiltersChange={setFilters}
						onExport={handleExport}
					/>
				</div>
				<ExecSummaryButton alerts={filteredAlerts} />
			</div>

			<DelayAlertTable alerts={filteredAlerts} />
		</motion.div>
	);
}

export default DelayAlertContent;
