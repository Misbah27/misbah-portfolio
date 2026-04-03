'use client';

import { useMemo } from 'react';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import DockIntelligence from './DockIntelligence';
import type { Truck, DockDoorStatus } from './types';

interface DockStatusPanelProps {
	checkedInTrucks: Truck[];
	totalDoors: number;
	yardTrucks: Truck[];
	fcId: string;
}

const REFERENCE_NOW = new Date('2024-11-15T12:00:00Z');

function formatEta(iso: string | null): string {
	if (!iso) return '—';
	const d = new Date(iso);
	return d.toLocaleString('en-GB', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
	});
}

function timeRemaining(iso: string | null): string {
	if (!iso) return '—';
	const diff = new Date(iso).getTime() - REFERENCE_NOW.getTime();
	if (diff <= 0) return 'Done';
	const hrs = Math.floor(diff / 3600000);
	const mins = Math.round((diff % 3600000) / 60000);
	return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
}

/**
 * Dock Status Panel — right sidebar showing which doors are occupied,
 * which truck is there, and when each door frees up.
 */
function DockStatusPanel({ checkedInTrucks, totalDoors, yardTrucks, fcId }: DockStatusPanelProps) {
	const doors: DockDoorStatus[] = useMemo(() => {
		const truckByDoor = new Map<number, Truck>();
		checkedInTrucks.forEach((t) => {
			if (t.dockDoor !== null) truckByDoor.set(t.dockDoor, t);
		});

		const result: DockDoorStatus[] = [];
		for (let d = 1; d <= totalDoors; d++) {
			result.push({ doorNumber: d, truck: truckByDoor.get(d) ?? null });
		}

		// Sort: occupied doors by ETA ascending (soonest to free first), then available
		result.sort((a, b) => {
			if (a.truck && b.truck) {
				const aEta = a.truck.unloadingEta ? new Date(a.truck.unloadingEta).getTime() : Infinity;
				const bEta = b.truck.unloadingEta ? new Date(b.truck.unloadingEta).getTime() : Infinity;
				return aEta - bEta;
			}
			if (a.truck && !b.truck) return -1;
			if (!a.truck && b.truck) return 1;
			return a.doorNumber - b.doorNumber;
		});

		return result;
	}, [checkedInTrucks, totalDoors]);

	const occupied = doors.filter((d) => d.truck !== null).length;

	return (
		<div className="flex flex-col h-full p-4 overflow-auto">
			<div className="mb-4">
				<Typography variant="subtitle1" className="font-bold">
					Dock Status
				</Typography>
				<Typography variant="body2" color="text.secondary">
					{occupied}/{totalDoors} doors occupied
				</Typography>
			</div>

			<div className="flex flex-col gap-2">
				{doors.map((door) => (
					<Paper
						key={door.doorNumber}
						variant="outlined"
						sx={{
							p: 1.5,
							backgroundColor: door.truck
								? 'background.paper'
								: 'success.main',
							opacity: door.truck ? 1 : 0.15,
							borderColor: door.truck ? 'divider' : 'success.main',
						}}
					>
						<div className="flex items-center justify-between gap-2">
							<Box className="flex items-center gap-2 min-w-0">
								<Typography
									variant="body2"
									className="font-bold"
									sx={{ minWidth: 28 }}
								>
									D{door.doorNumber}
								</Typography>
								{door.truck ? (
									<>
										<Typography variant="body2" className="truncate">
											{door.truck.vehicleNo}
										</Typography>
										{door.truck.apptType === 'HOT' && (
											<Chip label="HOT" color="error" size="small" sx={{ height: 20, fontSize: 10 }} />
										)}
									</>
								) : (
									<Typography variant="body2" color="success.main" className="font-medium">
										Available
									</Typography>
								)}
							</Box>
							{door.truck && (
								<Box className="flex flex-col items-end shrink-0">
									<Typography variant="caption" color="text.secondary">
										ETA {formatEta(door.truck.unloadingEta)}
									</Typography>
									<Typography
										variant="caption"
										className="font-semibold"
										sx={{
											color: (() => {
												const remaining = door.truck.unloadingEta
													? new Date(door.truck.unloadingEta).getTime() - REFERENCE_NOW.getTime()
													: Infinity;
												if (remaining <= 1800000) return 'success.main';
												if (remaining <= 3600000) return 'warning.main';
												return 'text.secondary';
											})(),
										}}
									>
										{timeRemaining(door.truck.unloadingEta)}
									</Typography>
								</Box>
							)}
						</div>
					</Paper>
				))}
			</div>

			<DockIntelligence
				yardQueue={yardTrucks}
				dockedTrucks={checkedInTrucks}
				fcId={fcId}
				totalDoors={totalDoors}
			/>
		</div>
	);
}

export default DockStatusPanel;
