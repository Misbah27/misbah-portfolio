'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
	MapContainer,
	TileLayer,
	Polyline,
	CircleMarker,
	Circle,
	Marker,
	Tooltip,
	Popup,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import type { GpsTrace, Delivery, FraudPattern } from '../../types';

interface GpsTraceMapProps {
	trace: GpsTrace | null;
	deliveries: Delivery[];
	allTraces?: GpsTrace[];
}

const TRACE_COLORS: Record<FraudPattern, string> = {
	GPS_SPOOFING: '#ef4444',
	PHANTOM_ROUTE: '#ef4444',
	ROSTER_AVOIDANCE: '#3b82f6',
	GHOST_DELIVERY: '#3b82f6',
	CLUSTER_FRAUD: '#f59e0b',
};

const CLUSTER_DRIVER_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];

/** Haversine distance in meters. */
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
	const R = 6371000;
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLng = ((lng2 - lng1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Create a red DivIcon with text label. */
function createLabelIcon(text: string, bgColor = '#ef4444'): L.DivIcon {
	return L.divIcon({
		className: '',
		html: `<div style="
			background:${bgColor};color:#fff;font-size:11px;font-weight:700;
			padding:2px 6px;border-radius:4px;white-space:nowrap;
			box-shadow:0 1px 3px rgba(0,0,0,0.3);text-align:center;
			transform:translate(-50%,-50%);
		">${text}</div>`,
		iconSize: [0, 0],
		iconAnchor: [0, 0],
	});
}

/**
 * GPS Trace Map — React Leaflet map showing driver route with pattern-specific
 * visual anomaly indicators. Supports route animation and delivery overlay.
 */
function GpsTraceMap({ trace, deliveries, allTraces }: GpsTraceMapProps) {
	const [isPlaying, setIsPlaying] = useState(false);
	const [playIndex, setPlayIndex] = useState(0);
	const [showDeliveries, setShowDeliveries] = useState(false);
	const playTimer = useRef<NodeJS.Timeout | null>(null);

	const pings = trace?.pings ?? [];
	const positions: [number, number][] = useMemo(
		() => pings.map((p) => [p.lat, p.lng] as [number, number]),
		[pings]
	);

	const center: [number, number] = useMemo(() => {
		if (positions.length === 0) return [47.6062, -122.3321];
		const lats = positions.map((p) => p[0]);
		const lngs = positions.map((p) => p[1]);
		return [
			(Math.min(...lats) + Math.max(...lats)) / 2,
			(Math.min(...lngs) + Math.max(...lngs)) / 2,
		];
	}, [positions]);

	const stopPlayback = useCallback(() => {
		if (playTimer.current) {
			clearInterval(playTimer.current);
			playTimer.current = null;
		}
		setIsPlaying(false);
	}, []);

	const startPlayback = useCallback(() => {
		setPlayIndex(0);
		setIsPlaying(true);
		playTimer.current = setInterval(() => {
			setPlayIndex((prev) => {
				if (prev >= pings.length - 1) {
					stopPlayback();
					return prev;
				}
				return prev + 1;
			});
		}, 80);
	}, [pings.length, stopPlayback]);

	useEffect(() => {
		return () => {
			if (playTimer.current) clearInterval(playTimer.current);
		};
	}, []);

	useEffect(() => {
		stopPlayback();
		setPlayIndex(0);
	}, [trace, stopPlayback]);

	/** Detect phantom route jump indices. */
	const jumpIndices = useMemo(() => {
		if (trace?.fraudPattern !== 'PHANTOM_ROUTE') return [];
		const jumps: number[] = [];
		for (let i = 1; i < pings.length; i++) {
			const dist = haversine(pings[i - 1].lat, pings[i - 1].lng, pings[i].lat, pings[i].lng);
			if (dist > 15000) jumps.push(i);
		}
		return jumps;
	}, [trace, pings]);

	/** Detect speed anomaly indices for GPS spoofing. */
	const speedAnomalies = useMemo(() => {
		if (trace?.fraudPattern !== 'GPS_SPOOFING') return [];
		return pings
			.map((p, i) => ({ idx: i, speed: p.speed }))
			.filter((p) => p.speed > 30);
	}, [trace, pings]);

	if (!trace) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-center">
					<FuseSvgIcon size={48} color="disabled">heroicons-outline:map</FuseSvgIcon>
					<Typography color="text.secondary" className="mt-2">
						No GPS trace available for this driver.
					</Typography>
				</div>
			</div>
		);
	}

	const pattern = trace.fraudPattern;
	const traceColor = TRACE_COLORS[pattern];
	const isCluster = pattern === 'CLUSTER_FRAUD';
	const clusterTraces = isCluster && allTraces
		? allTraces.filter((t) => t.fraudPattern === 'CLUSTER_FRAUD')
		: [];

	return (
		<div className="relative w-full h-full">
			<MapContainer
				center={center}
				zoom={13}
				scrollWheelZoom
				style={{ height: '100%', width: '100%' }}
			>
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>

				{/* === GPS SPOOFING === */}
				{pattern === 'GPS_SPOOFING' && (
					<>
						<Polyline positions={positions} pathOptions={{ color: traceColor, weight: 2, opacity: 0.5 }} />
						<Circle
							center={center}
							radius={80}
							pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.15, weight: 2, dashArray: '6 4' }}
						>
							<Tooltip permanent direction="top" offset={[0, -10]}>
								<span style={{ fontSize: 11, fontWeight: 600 }}>
									SPOOFED LOCATION — &lt;0.05° variance over 3hrs
								</span>
							</Tooltip>
						</Circle>
						{pings.map((p, i) => (
							<CircleMarker
								key={i}
								center={[p.lat, p.lng]}
								radius={3}
								pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.7, weight: 0 }}
							/>
						))}
						{speedAnomalies.map((a) => (
							<Marker
								key={`spike-${a.idx}`}
								position={[pings[a.idx].lat, pings[a.idx].lng]}
								icon={createLabelIcon(`SPEED SPIKE ${a.speed.toFixed(0)}mph`)}
							>
								<Tooltip>
									<span style={{ fontSize: 11 }}>
										Speed jumped to {a.speed.toFixed(0)}mph then back to 0 — spoofing artifact
									</span>
								</Tooltip>
							</Marker>
						))}
					</>
				)}

				{/* === PHANTOM ROUTE === */}
				{pattern === 'PHANTOM_ROUTE' && (
					<>
						<Polyline positions={positions} pathOptions={{ color: traceColor, weight: 3 }} />
						{jumpIndices.map((jumpIdx) => {
							const from = pings[jumpIdx - 1];
							const to = pings[jumpIdx];
							const dist = haversine(from.lat, from.lng, to.lat, to.lng);
							const miles = (dist / 1609).toFixed(1);
							const midLat = (from.lat + to.lat) / 2;
							const midLng = (from.lng + to.lng) / 2;
							return (
								<Marker
									key={`jump-${jumpIdx}`}
									position={[midLat, midLng]}
									icon={createLabelIcon('IMPOSSIBLE JUMP')}
								>
									<Tooltip permanent direction="bottom" offset={[0, 8]}>
										<span style={{ fontSize: 11 }}>
											{miles} miles in 5 minutes — physically impossible
										</span>
									</Tooltip>
								</Marker>
							);
						})}
						{/* Start/End markers */}
						<CircleMarker
							center={positions[0]}
							radius={8}
							pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.8, weight: 2 }}
						>
							<Tooltip>Start</Tooltip>
						</CircleMarker>
						<CircleMarker
							center={positions[positions.length - 1]}
							radius={8}
							pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.8, weight: 2 }}
						>
							<Tooltip>End</Tooltip>
						</CircleMarker>
					</>
				)}

				{/* === ROSTER AVOIDANCE === */}
				{pattern === 'ROSTER_AVOIDANCE' && (
					<>
						<Polyline positions={positions} pathOptions={{ color: '#3b82f6', weight: 3 }} />
						{trace.pickupZones?.map((zone, i) => (
							<Circle
								key={`zone-${i}`}
								center={[zone.lat, zone.lng]}
								radius={200}
								pathOptions={{
									color: '#22c55e',
									fillColor: '#22c55e',
									fillOpacity: 0.12,
									weight: 2,
									dashArray: '8 4',
								}}
							>
								<Tooltip permanent direction="center">
									<span style={{ fontSize: 10, fontWeight: 600 }}>
										{zone.name}
									</span>
								</Tooltip>
								<Popup>
									<Typography variant="body2" fontWeight={600}>{zone.name}</Typography>
									<Typography variant="caption" color="text.secondary">
										Driver consistently avoided this pickup zone
									</Typography>
								</Popup>
							</Circle>
						))}
						<CircleMarker
							center={positions[0]}
							radius={6}
							pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.8 }}
						>
							<Tooltip>Start</Tooltip>
						</CircleMarker>
					</>
				)}

				{/* === GHOST DELIVERY === */}
				{pattern === 'GHOST_DELIVERY' && (
					<>
						<Polyline positions={positions} pathOptions={{ color: '#3b82f6', weight: 3 }} />
						{deliveries
							.filter((d) => d.fraudFlagType === 'GHOST_DELIVERY')
							.slice(0, 4)
							.map((d, i) => {
								const ghostLat = center[0] + (Math.random() - 0.5) * 0.02;
								const ghostLng = center[1] + (Math.random() - 0.5) * 0.02;
								return (
									<Marker
										key={`ghost-${i}`}
										position={[ghostLat, ghostLng]}
										icon={createLabelIcon('DELIVERY ADDRESS', '#dc2626')}
									>
										<Tooltip permanent direction="bottom" offset={[0, 8]}>
											<span style={{ fontSize: 11 }}>
												Driver was {d.distanceFromAddressAtCompletion}m away when marked delivered
											</span>
										</Tooltip>
									</Marker>
								);
							})}
						<CircleMarker
							center={positions[0]}
							radius={6}
							pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.8 }}
						>
							<Tooltip>Start</Tooltip>
						</CircleMarker>
					</>
				)}

				{/* === CLUSTER FRAUD === */}
				{pattern === 'CLUSTER_FRAUD' && (
					<>
						{clusterTraces.map((ct, i) => {
							const ctPositions: [number, number][] = ct.pings.map((p) => [p.lat, p.lng]);
							return (
								<Polyline
									key={`cluster-trace-${i}`}
									positions={ctPositions}
									pathOptions={{ color: CLUSTER_DRIVER_COLORS[i % 4], weight: 2.5, opacity: 0.8 }}
								>
									<Tooltip>{ct.driverId}</Tooltip>
								</Polyline>
							);
						})}
						<Circle
							center={[47.6062, -122.3321]}
							radius={50}
							pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.25, weight: 3 }}
						/>
						<Marker
							position={[47.6062, -122.3321]}
							icon={createLabelIcon('CLUSTER DETECTED', '#d97706')}
						>
							<Tooltip permanent direction="top" offset={[0, -12]}>
								<span style={{ fontSize: 11, fontWeight: 600 }}>
									4 drivers within 50m — 47 minutes
								</span>
							</Tooltip>
						</Marker>
					</>
				)}

				{/* Animated driver marker during playback */}
				{isPlaying && playIndex < positions.length && (
					<Marker
						position={positions[playIndex]}
						icon={createLabelIcon(
							`${pings[playIndex].speed.toFixed(0)}mph`,
							'#2563eb'
						)}
					/>
				)}

				{/* Delivery address overlays */}
				{showDeliveries &&
					deliveries.map((d, i) => {
						const lat = center[0] + (Math.random() - 0.5) * 0.03;
						const lng = center[1] + (Math.random() - 0.5) * 0.03;
						const isFraud = !!d.fraudFlagType;
						return (
							<CircleMarker
								key={`del-${i}`}
								center={[lat, lng]}
								radius={5}
								pathOptions={{
									color: isFraud ? '#ef4444' : '#22c55e',
									fillColor: isFraud ? '#ef4444' : '#22c55e',
									fillOpacity: 0.7,
									weight: 1,
								}}
							>
								<Popup>
									<Typography variant="caption" fontWeight={600}>{d.deliveryId}</Typography>
									<br />
									<Typography variant="caption">{d.deliveryAddress}</Typography>
									<br />
									<Typography variant="caption" color={isFraud ? 'error' : 'success.main'}>
										{d.deliveryStatus}
									</Typography>
								</Popup>
							</CircleMarker>
						);
					})}
			</MapContainer>

			{/* Map controls — top right */}
			<Paper
				elevation={3}
				sx={{
					position: 'absolute',
					top: 12,
					right: 12,
					zIndex: 1000,
					p: 1,
					display: 'flex',
					flexDirection: 'column',
					gap: 1,
				}}
			>
				<Button
					size="small"
					variant="contained"
					color={isPlaying ? 'error' : 'primary'}
					onClick={isPlaying ? stopPlayback : startPlayback}
					startIcon={
						<FuseSvgIcon size={14}>
							{isPlaying ? 'heroicons-outline:pause' : 'heroicons-outline:play'}
						</FuseSvgIcon>
					}
					sx={{ fontSize: '0.7rem', textTransform: 'none' }}
				>
					{isPlaying
						? `Pause (${playIndex + 1}/${pings.length})`
						: 'Play Route'}
				</Button>
				<div className="flex items-center gap-1">
					<Switch
						size="small"
						checked={showDeliveries}
						onChange={(_, v) => setShowDeliveries(v)}
					/>
					<Typography variant="caption">Deliveries</Typography>
				</div>
			</Paper>

			{/* Pattern legend — bottom left */}
			<Paper
				elevation={3}
				sx={{
					position: 'absolute',
					bottom: 12,
					left: 12,
					zIndex: 1000,
					px: 1.5,
					py: 1,
					opacity: 0.95,
				}}
			>
				<Typography variant="caption" fontWeight={700} display="block" mb={0.5}>
					{pattern.replace(/_/g, ' ')}
				</Typography>
				{pattern === 'GPS_SPOOFING' && (
					<>
						<LegendItem color="#ef4444" label="Spoofed ping cluster" />
						<LegendItem color="#ef4444" label="Speed spike anomaly" dashed />
					</>
				)}
				{pattern === 'PHANTOM_ROUTE' && (
					<>
						<LegendItem color="#ef4444" label="Route trace" />
						<LegendItem color="#ef4444" label="Impossible jump marker" dashed />
					</>
				)}
				{pattern === 'ROSTER_AVOIDANCE' && (
					<>
						<LegendItem color="#3b82f6" label="Driver route" />
						<LegendItem color="#22c55e" label="Avoided pickup zone" dashed />
					</>
				)}
				{pattern === 'GHOST_DELIVERY' && (
					<>
						<LegendItem color="#3b82f6" label="Driver route" />
						<LegendItem color="#dc2626" label="Delivery address (never visited)" dashed />
					</>
				)}
				{pattern === 'CLUSTER_FRAUD' && (
					<>
						{CLUSTER_DRIVER_COLORS.map((c, i) => (
							<LegendItem key={i} color={c} label={clusterTraces[i]?.driverId ?? `Driver ${i + 1}`} />
						))}
						<LegendItem color="#f59e0b" label="Convergence zone" dashed />
					</>
				)}
			</Paper>
		</div>
	);
}

function LegendItem({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
	return (
		<div className="flex items-center gap-1.5 mb-0.5">
			<div
				style={{
					width: 16,
					height: 3,
					backgroundColor: color,
					borderRadius: 1,
					...(dashed ? { backgroundImage: `repeating-linear-gradient(90deg, ${color} 0 4px, transparent 4px 8px)`, backgroundColor: 'transparent' } : {}),
				}}
			/>
			<Typography variant="caption" sx={{ fontSize: '0.65rem' }}>{label}</Typography>
		</div>
	);
}

export default GpsTraceMap;
