'use client';

import dynamic from 'next/dynamic';
import FusePageSimple from '@fuse/core/FusePageSimple';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

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
 * Dynamically imported MapContent — SSR disabled to avoid Leaflet window errors.
 */
const MapContent = dynamic(() => import('./MapContent'), {
	ssr: false,
	loading: () => (
		<Box
			display="flex"
			alignItems="center"
			justifyContent="center"
			sx={{ minHeight: 600 }}
		>
			<CircularProgress />
		</Box>
	),
});

/**
 * MapPage — FC Network Map showing all fulfillment centers with yard pressure indicators.
 */
function MapPage() {
	return (
		<Root
			scroll="content"
			header={
				<Box className="flex items-center gap-3 py-2 px-6 sm:px-8 w-full">
					<Typography className="text-lg font-bold">
						FC Network Map
					</Typography>
					<Typography variant="caption" color="text.secondary">
						Yard pressure and dock utilization across all FCs
					</Typography>
				</Box>
			}
			content={
				<Box className="w-full h-full p-6 sm:p-8">
					<MapContent />
				</Box>
			}
		/>
	);
}

export default MapPage;
