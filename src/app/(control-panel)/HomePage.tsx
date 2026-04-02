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
 * Portfolio landing page — hero section with links to each app.
 */
function HomePage() {
	return (
		<Root
			header={
				<div className="p-6">
					<Typography variant="h4">Misbahuddin Mohammed</Typography>
					<Typography
						variant="subtitle1"
						color="text.secondary"
					>
						Senior Engineering Leader | 10+ Years at Amazon
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
							Engineering Portfolio
						</Typography>
						<Typography color="text.secondary">
							Building AI-powered logistics systems at global scale
						</Typography>
						<Typography
							variant="body2"
							color="text.secondary"
							className="mt-4"
						>
							Coming Soon — Select an app from the sidebar to explore.
						</Typography>
					</Paper>
				</div>
			}
		/>
	);
}

export default HomePage;
