import { FuseNavItemType } from '@fuse/core/FuseNavigation/types/FuseNavItemType';

/**
 * Navigation configuration for the portfolio sidebar.
 */
const navigationConfig: FuseNavItemType[] = [
	{
		id: 'home',
		title: 'Home',
		type: 'item',
		icon: 'heroicons-outline:home',
		url: '/'
	},
	{
		id: 'inboundiq',
		title: 'InboundIQ',
		type: 'collapse',
		icon: 'heroicons-outline:truck',
		children: [
			{
				id: 'inboundiq-dashboard',
				title: 'Dashboard',
				type: 'item',
				url: '/apps/inboundiq'
			},
			{
				id: 'inboundiq-analytics',
				title: 'Analytics',
				type: 'item',
				url: '/apps/inboundiq/analytics'
			},
			{
				id: 'inboundiq-about',
				title: 'About',
				type: 'item',
				url: '/apps/inboundiq/about'
			}
		]
	},
	{
		id: 'freightlens',
		title: 'FreightLens',
		type: 'collapse',
		icon: 'heroicons-outline:calendar',
		children: [
			{
				id: 'freightlens-rolling21',
				title: 'Rolling 21 Days',
				type: 'item',
				url: '/apps/freightlens'
			},
			{
				id: 'freightlens-standing',
				title: 'Standing Appointments',
				type: 'item',
				url: '/apps/freightlens/standing'
			},
			{
				id: 'freightlens-fc-metric',
				title: 'FC Metric',
				type: 'item',
				url: '/apps/freightlens/fc-metric'
			},
			{
				id: 'freightlens-admin',
				title: 'Admin Portal',
				type: 'item',
				url: '/apps/freightlens/admin'
			},
			{
				id: 'freightlens-about',
				title: 'About',
				type: 'item',
				url: '/apps/freightlens/about'
			}
		]
	},
	{
		id: 'nova',
		title: 'Nova',
		type: 'collapse',
		icon: 'heroicons-outline:bell-alert',
		children: [
			{
				id: 'nova-delay-alert',
				title: 'Delay Alert',
				type: 'item',
				url: '/apps/nova'
			},
			{
				id: 'nova-rescue',
				title: 'Rescue Planner',
				type: 'item',
				url: '/apps/nova/rescue-planner'
			},
			{
				id: 'nova-about',
				title: 'About',
				type: 'item',
				url: '/apps/nova/about'
			}
		]
	},
	{
		id: 'dataops',
		title: 'DataOps Suite',
		type: 'collapse',
		icon: 'heroicons-outline:circle-stack',
		children: [
			{
				id: 'dataops-ingest',
				title: 'Ingest',
				type: 'item',
				url: '/apps/dataops/ingest'
			},
			{
				id: 'dataops-catalog',
				title: 'Catalog',
				type: 'item',
				url: '/apps/dataops/catalog'
			},
			{
				id: 'dataops-obfuscation',
				title: 'Obfuscation',
				type: 'item',
				url: '/apps/dataops/obfuscation'
			},
			{
				id: 'dataops-quality',
				title: 'Quality Dashboard',
				type: 'item',
				url: '/apps/dataops'
			},
			{
				id: 'dataops-about',
				title: 'About',
				type: 'item',
				url: '/apps/dataops/about'
			}
		]
	},
	{
		id: 'lofat',
		title: 'LoFAT',
		type: 'collapse',
		icon: 'heroicons-outline:shield-exclamation',
		children: [
			{
				id: 'lofat-monitor',
				title: 'Live Monitor',
				type: 'item',
				url: '/apps/lofat'
			},
			{
				id: 'lofat-analytics',
				title: 'Analytics',
				type: 'item',
				url: '/apps/lofat/analytics'
			},
			{
				id: 'lofat-cases',
				title: 'Cases',
				type: 'item',
				url: '/apps/lofat/cases'
			}
		]
	}
];

export default navigationConfig;
