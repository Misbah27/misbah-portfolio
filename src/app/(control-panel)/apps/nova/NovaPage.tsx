'use client';

import { useState, useEffect } from 'react';
import FusePageSimple from '@fuse/core/FusePageSimple';
import { styled } from '@mui/material/styles';
import NovaSidebar from './components/NovaSidebar';
import NovaHeader from './components/NovaHeader';
import DelayAlertContent from './components/DelayAlertContent';
import DelayAlertSkeleton from './components/DelayAlertSkeleton';
import type { DelayAlert } from './types';

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
		backgroundColor: theme.vars.palette.background.paper,
		borderRightWidth: 1,
		borderStyle: 'solid',
		borderColor: theme.vars.palette.divider,
	},
}));

/**
 * Nova Delay Alert Dashboard — main page with left sidebar navigation,
 * LH/MR tabs, summary cards, and delay alert data table.
 */
function NovaPage() {
	const [alerts, setAlerts] = useState<DelayAlert[]>([]);
	const [loading, setLoading] = useState(true);
	const [lastUpdated, setLastUpdated] = useState('');

	useEffect(() => {
		import('@/data/nova/delay-alerts.json')
			.then((mod) => {
				setAlerts(mod.default as DelayAlert[]);
				setLastUpdated(
					new Date().toLocaleString('en-GB', {
						hour: '2-digit',
						minute: '2-digit',
						second: '2-digit',
						hour12: false,
					})
				);
			})
			.catch(() => setAlerts([]))
			.finally(() => setLoading(false));
	}, []);

	return (
		<Root
			scroll="content"
			header={<NovaHeader lastUpdated={lastUpdated} />}
			leftSidebarContent={<NovaSidebar />}
			leftSidebarOpen
			leftSidebarWidth={280}
			leftSidebarVariant="permanent"
			content={
				<div className="w-full p-6 sm:p-8">
					{loading ? <DelayAlertSkeleton /> : <DelayAlertContent alerts={alerts} />}
				</div>
			}
		/>
	);
}

export default NovaPage;
