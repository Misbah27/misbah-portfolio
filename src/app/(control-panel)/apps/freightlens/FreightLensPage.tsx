'use client';

import FusePageSimple from '@fuse/core/FusePageSimple';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

const Root = styled(FusePageSimple)(({ theme }) => ({
	'& .FusePageSimple-header': {
		backgroundColor: theme.vars.palette.background.paper,
		borderBottomWidth: 1,
		borderStyle: 'solid',
		borderColor: theme.vars.palette.divider
	}
}));

/**
 * FreightLens (Daily Freight Tracker) — Freight Scheduling placeholder.
 */
function FreightLensPage() {
	return (
		<Root
			header={
				<div className="p-6">
					<Typography variant="h4">FreightLens</Typography>
					<Typography
						variant="subtitle1"
						color="text.secondary"
					>
						Daily Freight Tracker
					</Typography>
				</div>
			}
			content={
				<div className="p-6">
					<Paper className="p-8 text-center">
						<Typography
							variant="h5"
							className="mb-2"
						>
							FreightLens
						</Typography>
						<Typography color="text.secondary">
							Real-time visibility across 100+ FCs, saving 500+ hrs/month
						</Typography>
						<Typography
							variant="body2"
							color="text.secondary"
							className="mt-4"
						>
							Coming Soon
						</Typography>
					</Paper>
				</div>
			}
		/>
	);
}

export default FreightLensPage;
