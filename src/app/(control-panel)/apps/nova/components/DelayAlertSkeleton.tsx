'use client';

import Skeleton from '@mui/material/Skeleton';

/**
 * Loading skeleton matching the Delay Alert page layout.
 */
function DelayAlertSkeleton() {
	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
				{[1, 2, 3, 4].map((i) => (
					<Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: 1 }} />
				))}
			</div>
			<Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1 }} />
			<Skeleton variant="rectangular" height={400} sx={{ borderRadius: 1 }} />
		</div>
	);
}

export default DelayAlertSkeleton;
