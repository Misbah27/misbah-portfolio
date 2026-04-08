'use client';

import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import Typography from '@mui/material/Typography';
import 'leaflet/dist/leaflet.css';

interface ZoneData {
	zone: string;
	flaggedCount: number;
	dominantPattern: string;
}

interface ZoneDensityMapProps {
	zoneData: ZoneData[];
}

const ZONE_COORDS: Record<string, { lat: number; lng: number }> = {
	'Seattle-North': { lat: 47.66, lng: -122.35 },
	'Seattle-South': { lat: 47.55, lng: -122.30 },
	'Chicago-Loop': { lat: 41.88, lng: -87.63 },
	'Chicago-North': { lat: 41.93, lng: -87.65 },
	'LA-Westside': { lat: 34.03, lng: -118.46 },
	'LA-Valley': { lat: 34.08, lng: -118.35 },
};

function getZoneColor(count: number): string {
	if (count < 5) return '#4caf50';
	if (count <= 15) return '#ff9800';
	return '#f44336';
}

function getRadius(count: number): number {
	return Math.max(12, Math.min(36, 12 + count * 2));
}

/**
 * Zone Fraud Density Map — CircleMarkers sized/colored by fraud count.
 */
function ZoneDensityMap({ zoneData }: ZoneDensityMapProps) {
	return (
		<div style={{ height: 280 }}>
			<MapContainer
				center={[39.5, -98.35]}
				zoom={4}
				scrollWheelZoom={false}
				style={{ height: '100%', width: '100%' }}
			>
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>
				{zoneData.map((z) => {
					const coords = ZONE_COORDS[z.zone];
					if (!coords) return null;
					const color = getZoneColor(z.flaggedCount);
					return (
						<CircleMarker
							key={z.zone}
							center={[coords.lat, coords.lng]}
							radius={getRadius(z.flaggedCount)}
							pathOptions={{
								fillColor: color,
								fillOpacity: 0.6,
								color,
								weight: 2,
							}}
						>
							<Tooltip>
								<Typography variant="caption" fontWeight={700} display="block">{z.zone}</Typography>
								<Typography variant="caption">Flagged: {z.flaggedCount}</Typography>
								<br />
								<Typography variant="caption">Dominant: {z.dominantPattern}</Typography>
							</Tooltip>
						</CircleMarker>
					);
				})}
			</MapContainer>
		</div>
	);
}

export default ZoneDensityMap;
