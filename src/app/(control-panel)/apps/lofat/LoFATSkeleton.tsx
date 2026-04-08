'use client';

import Skeleton from '@mui/material/Skeleton';
import Paper from '@mui/material/Paper';

/**
 * Skeleton loading state matching Live Monitoring Dashboard layout.
 */
function LoFATSkeleton() {
	return (
		<div className="w-full">
			{/* Summary cards */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-2">
				{[0, 1, 2, 3].map((i) => (
					<Paper
						key={i}
						className="p-3"
						elevation={0}
						variant="outlined"
					>
						<Skeleton
							variant="text"
							width={100}
							height={16}
						/>
						<Skeleton
							variant="text"
							width={60}
							height={32}
							className="mt-1"
						/>
					</Paper>
				))}
			</div>

			{/* Filter bar */}
			<div className="flex gap-2 mb-2">
				{[0, 1, 2, 3, 4].map((i) => (
					<Skeleton
						key={i}
						variant="rounded"
						width={90}
						height={32}
					/>
				))}
			</div>

			{/* Table */}
			<Paper
				elevation={0}
				variant="outlined"
			>
				<Skeleton
					variant="rectangular"
					height={400}
				/>
			</Paper>
		</div>
	);
}

export default LoFATSkeleton;
