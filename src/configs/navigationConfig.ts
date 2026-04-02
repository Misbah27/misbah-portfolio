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
		type: 'item',
		icon: 'heroicons-outline:truck',
		url: '/apps/inboundiq'
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
		type: 'item',
		icon: 'heroicons-outline:circle-stack',
		url: '/apps/dataops'
	}
];

export default navigationConfig;
