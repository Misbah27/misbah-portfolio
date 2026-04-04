'use client';

import { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import 'leaflet/dist/leaflet.css';
import trucksData from '@/data/inboundiq/trucks.json';
import { DOORS_PER_FC, FC_OPTIONS, type Truck, type FcOption } from '../types';

/** Coordinates for each fulfillment center. */
const FC_COORDS: Record<FcOption, { lat: number; lng: number; city: string }> = {
	SEA1: { lat: 47.606, lng: -122.332, city: 'Seattle, WA' },
	PDX2: { lat: 45.523, lng: -122.676, city: 'Portland, OR' },
	LAX3: { lat: 33.942, lng: -118.408, city: 'Los Angeles, CA' },
	ORD2: { lat: 41.978, lng: -87.905, city: 'Chicago, IL' },
	JFK4: { lat: 40.641, lng: -73.778, city: 'New York, NY' },
};

/** Computed statistics for a single FC. */
interface FcStats {
	fcId: FcOption;
	lat: number;
	lng: number;
	city: string;
	totalTrucks: number;
	yardQueue: number;
	atDock: number;
	doorsOccupied: number;
	totalDoors: number;
	avgDwell: number;
	hotWaiting: number;
	yardPressure: number;
}

/**
 * Returns the fill color for a CircleMarker based on yard pressure.
 */
function getPressureColor(pressure: number): string {
	if (pressure < 1.0) return '#22c55e';
	if (pressure <= 1.5) return '#f59e0b';
	return '#ef4444';
}

/**
 * Returns a darker variant of the pressure color for the stroke.
 */
function getStrokeColor(pressure: number): string {
	if (pressure < 1.0) return '#15803d';
	if (pressure <= 1.5) return '#b45309';
	return '#b91c1c';
}

/**
 * Returns a label and color for the yard pressure badge.
 */
function getPressureBadge(pressure: number): { label: string; color: 'success' | 'warning' | 'error' } {
	if (pressure < 1.0) return { label: 'LOW', color: 'success' };
	if (pressure <= 1.5) return { label: 'MEDIUM', color: 'warning' };
	return { label: 'HIGH', color: 'error' };
}

/**
 * MapContent — Leaflet map showing FC network with CircleMarkers.
 * This component must be dynamically imported with ssr:false.
 */
function MapContent() {
	const allTrucks = trucksData as Truck[];

	const fcStats = useMemo<FcStats[]>(() => {
		return FC_OPTIONS.map((fcId) => {
			const fcTrucks = allTrucks.filter((t) => t.fcId === fcId);
			const yardTrucks = fcTrucks.filter(
				(t) => t.dmStatus === 'Arrived' || t.dmStatus === 'PreCheckin'
			);
			const dockedTrucks = fcTrucks.filter((t) => t.dmStatus === 'CheckedIn');
			const totalDoors = DOORS_PER_FC[fcId];
			const dwellValues = yardTrucks
				.map((t) => t.dwellHours)
				.filter((d): d is number => d !== null);
			const avgDwell =
				dwellValues.length > 0
					? dwellValues.reduce((sum, v) => sum + v, 0) / dwellValues.length
					: 0;
			const hotWaiting = yardTrucks.filter((t) => t.apptType === 'HOT').length;
			const yardQueue = yardTrucks.length;
			const doorsOccupied = dockedTrucks.length;

			return {
				fcId,
				lat: FC_COORDS[fcId].lat,
				lng: FC_COORDS[fcId].lng,
				city: FC_COORDS[fcId].city,
				totalTrucks: fcTrucks.length,
				yardQueue,
				atDock: doorsOccupied,
				doorsOccupied,
				totalDoors,
				avgDwell,
				hotWaiting,
				yardPressure: totalDoors > 0 ? yardQueue / totalDoors : 0,
			};
		});
	}, [allTrucks]);

	/** Compute radius range based on min/max totalTrucks. */
	const { minTrucks, maxTrucks } = useMemo(() => {
		const totals = fcStats.map((s) => s.totalTrucks);
		return { minTrucks: Math.min(...totals), maxTrucks: Math.max(...totals) };
	}, [fcStats]);

	function getRadius(totalTrucks: number): number {
		if (maxTrucks === minTrucks) return 26;
		const ratio = (totalTrucks - minTrucks) / (maxTrucks - minTrucks);
		return 16 + ratio * 20;
	}

	return (
		<div className="relative w-full" style={{ minHeight: 600, height: 'calc(100vh - 200px)' }}>
			<MapContainer
				center={[39.5, -98.35]}
				zoom={4}
				scrollWheelZoom
				style={{ height: '100%', width: '100%' }}
			>
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>

				{fcStats.map((fc) => {
					const badge = getPressureBadge(fc.yardPressure);
					return (
						<CircleMarker
							key={fc.fcId}
							center={[fc.lat, fc.lng]}
							radius={getRadius(fc.totalTrucks)}
							pathOptions={{
								fillColor: getPressureColor(fc.yardPressure),
								fillOpacity: 0.7,
								color: getStrokeColor(fc.yardPressure),
								weight: 2,
							}}
						>
							<Popup minWidth={240}>
								<Box sx={{ p: 0.5 }}>
									<Typography variant="subtitle1" fontWeight={700}>
										{fc.fcId}
									</Typography>
									<Typography variant="caption" color="text.secondary" display="block" mb={1}>
										{fc.city}
									</Typography>

									<Typography variant="body2">
										<strong>Total trucks:</strong> {fc.totalTrucks}
									</Typography>
									<Typography variant="body2">
										<strong>At dock:</strong> {fc.atDock} &nbsp;/&nbsp;{' '}
										<strong>Yard queue:</strong> {fc.yardQueue}
									</Typography>
									<Typography variant="body2">
										<strong>Doors:</strong> {fc.doorsOccupied}/{fc.totalDoors} occupied
									</Typography>
									<Typography variant="body2">
										<strong>Avg dwell:</strong> {fc.avgDwell.toFixed(1)}h
									</Typography>
									<Typography variant="body2">
										<strong>HOT trucks waiting:</strong> {fc.hotWaiting}
									</Typography>

									<Box mt={1}>
										<Chip
											label={`Yard Pressure: ${badge.label}`}
											color={badge.color}
											size="small"
											variant="filled"
										/>
									</Box>
								</Box>
							</Popup>
						</CircleMarker>
					);
				})}
			</MapContainer>

			{/* Legend */}
			<Paper
				elevation={3}
				sx={{
					position: 'absolute',
					bottom: 24,
					left: 12,
					zIndex: 1000,
					px: 2,
					py: 1.5,
					bgcolor: 'background.paper',
					opacity: 0.95,
				}}
			>
				<Typography variant="caption" fontWeight={700} display="block" mb={0.5}>
					Legend
				</Typography>
				{[
					{ color: '#22c55e', label: 'Doors Available' },
					{ color: '#f59e0b', label: 'Queue Forming' },
					{ color: '#ef4444', label: 'Yard Congestion' },
				].map((item) => (
					<Box key={item.label} display="flex" alignItems="center" gap={1} mb={0.25}>
						<Box
							sx={{
								width: 14,
								height: 14,
								borderRadius: '50%',
								backgroundColor: item.color,
								opacity: 0.7,
								flexShrink: 0,
							}}
						/>
						<Typography variant="caption">{item.label}</Typography>
					</Box>
				))}
				<Box display="flex" alignItems="center" gap={1} mt={0.5}>
					<Typography variant="caption" color="text.secondary">
						Circle size = Total Truck Count
					</Typography>
				</Box>
			</Paper>
		</div>
	);
}

export default MapContent;
