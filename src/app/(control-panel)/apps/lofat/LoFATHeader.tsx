'use client';

import { memo } from 'react';
import Typography from '@mui/material/Typography';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Switch from '@mui/material/Switch';
import PageBreadcrumb from 'src/components/PageBreadcrumb';

interface LoFATHeaderProps {
	lastUpdated: string;
	autoRefresh: boolean;
	onAutoRefreshChange: (enabled: boolean) => void;
}

/**
 * LoFAT Live Monitoring header with breadcrumb, title, and auto-refresh toggle.
 */
function LoFATHeader({ lastUpdated, autoRefresh, onAutoRefreshChange }: LoFATHeaderProps) {
	return (
		<div className="flex flex-col w-full">
			<div className="flex items-center justify-between p-3 sm:px-4">
				<div>
					<PageBreadcrumb className="mb-1" />
					<div className="flex items-center gap-2">
						<FuseSvgIcon
							size={24}
							color="secondary"
						>
							heroicons-outline:shield-exclamation
						</FuseSvgIcon>
						<Typography
							variant="h6"
							className="font-semibold"
						>
							LoFAT — Live Monitoring
						</Typography>
					</div>
				</div>
				<div className="flex items-center gap-2 text-sm text-gray-500">
					{lastUpdated && (
						<div className="flex items-center gap-1">
							<FuseSvgIcon size={14}>heroicons-outline:clock</FuseSvgIcon>
							<span>Last updated {lastUpdated}</span>
						</div>
					)}
					<div className="flex items-center gap-1 ml-2">
						<Typography
							variant="caption"
							color="text.secondary"
						>
							Auto-refresh
						</Typography>
						<Switch
							size="small"
							checked={autoRefresh}
							onChange={(_, checked) => onAutoRefreshChange(checked)}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

export default memo(LoFATHeader);
