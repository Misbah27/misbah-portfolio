'use client';

import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import PageBreadcrumb from 'src/components/PageBreadcrumb';

interface NovaHeaderProps {
	lastUpdated: string;
}

/**
 * Nova page header with breadcrumb, title, country chip, and last-updated time.
 */
function NovaHeader({ lastUpdated }: NovaHeaderProps) {
	return (
		<div className="flex flex-col gap-1 w-full p-6 sm:px-8">
			<PageBreadcrumb />

			<div className="flex items-center justify-between mt-1">
				<div className="flex items-center gap-2">
					<FuseSvgIcon size={28} color="action">
						heroicons-outline:bell-alert
					</FuseSvgIcon>
					<div>
						<Typography className="text-2xl font-bold tracking-tight">
							Delay Alerts
						</Typography>
						<Typography variant="caption" color="text.secondary">
							Real-time linehaul delay visibility
						</Typography>
					</div>
				</div>

				<div className="flex items-center gap-3">
					<Typography variant="caption" color="text.secondary">
						Last Updated: {lastUpdated}
					</Typography>
					<Chip
						size="small"
						label="US"
						icon={
							<FuseSvgIcon size={16}>heroicons-outline:flag</FuseSvgIcon>
						}
						variant="outlined"
					/>
				</div>
			</div>
		</div>
	);
}

export default NovaHeader;
