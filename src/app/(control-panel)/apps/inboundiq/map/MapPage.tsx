'use client';

import dynamic from 'next/dynamic';
import FusePageSimple from '@fuse/core/FusePageSimple';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

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
			header={
				<Box className="flex flex-col gap-2 p-24 w-full">
					<Typography variant="h5" fontWeight={700}>
						FC Network Map
					</Typography>
					<Typography variant="body2" color="text.secondary">
						Real-time yard pressure and dock utilization across all fulfillment centers
					</Typography>
				</Box>
			}
			content={
				<Box className="w-full h-full p-24">
					<MapContent />
				</Box>
			}
		/>
	);
}

export default MapPage;
