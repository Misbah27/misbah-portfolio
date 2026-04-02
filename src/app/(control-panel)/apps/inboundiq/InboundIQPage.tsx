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
 * InboundIQ (Heimdall) — Truck Prioritization Platform placeholder.
 */
function InboundIQPage() {
	return (
		<Root
			header={
				<div className="p-6">
					<Typography variant="h4">InboundIQ</Typography>
					<Typography
						variant="subtitle1"
						color="text.secondary"
					>
						Truck Prioritization Platform
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
							InboundIQ
						</Typography>
						<Typography color="text.secondary">
							Reduced truck TAT from 6.7 hours to 2.2 hours
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

export default InboundIQPage;
