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
 * Nova — Delay Alert Dashboard + Rescue Planner placeholder.
 */
function NovaPage() {
	return (
		<Root
			header={
				<div className="p-6">
					<Typography variant="h4">Nova</Typography>
					<Typography
						variant="subtitle1"
						color="text.secondary"
					>
						Delay Alert Dashboard + Rescue Planner
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
							Nova
						</Typography>
						<Typography color="text.secondary">
							Real-time linehaul delay visibility with automated rescue planning
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

export default NovaPage;
