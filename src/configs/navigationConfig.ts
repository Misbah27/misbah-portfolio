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
		type: 'item',
		icon: 'heroicons-outline:calendar',
		url: '/apps/freightlens'
	},
	{
		id: 'nova',
		title: 'Nova',
		type: 'item',
		icon: 'heroicons-outline:bell-alert',
		url: '/apps/nova'
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
			}
		]
	}
];

export default navigationConfig;
