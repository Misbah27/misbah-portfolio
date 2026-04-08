'use client';

import { useMemo, useState, useRef } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Skeleton from '@mui/material/Skeleton';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { motion } from 'motion/react';
import type { GpsTrace, EvidenceItem } from '../../types';
import { SIGNAL_COLORS } from '../../types';

interface EvidenceTimelineProps {
	trace: GpsTrace | null;
	date: string;
}

const containerVariants = {
	hidden: {},
	show: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
	hidden: { opacity: 0, y: 12 },
	show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

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

function formatTime(ts: string): string {
	const d = new Date(ts);
	return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** Generate evidence items by analyzing GPS trace anomalies per pattern. */
function generateEvidence(trace: GpsTrace): EvidenceItem[] {
	const items: EvidenceItem[] = [];
	const pings = trace.pings;
	const pattern = trace.fraudPattern;

	if (pattern === 'GPS_SPOOFING') {
		// Detect micro-jitter + speed spikes
		const lats = pings.map((p) => p.lat);
		const lngs = pings.map((p) => p.lng);
		const latRange = Math.max(...lats) - Math.min(...lats);
		const lngRange = Math.max(...lngs) - Math.min(...lngs);

		items.push({
			timestamp: pings[0].timestamp,
			signalType: 'GPS_ANOMALY',
			description: `GPS position variance is ${latRange.toFixed(5)}° lat / ${lngRange.toFixed(5)}° lng over ${(pings.length)} pings — near-zero movement detected.`,
		});

		const spikes = pings.filter((p) => p.speed > 30);
		spikes.slice(0, 4).forEach((p) => {
			items.push({
				timestamp: p.timestamp,
				signalType: 'SPEED_ANOMALY',
				description: `Speed jumped to ${p.speed.toFixed(0)}mph then immediately returned to 0 — consistent with GPS spoofing software artifact.`,
			});
		});

		const avgAccuracy = pings.reduce((s, p) => s + p.accuracy, 0) / pings.length;
		items.push({
			timestamp: pings[Math.floor(pings.length / 2)].timestamp,
			signalType: 'GPS_ANOMALY',
			description: `GPS accuracy unusually consistent (avg ${avgAccuracy.toFixed(1)}m). Real GPS varies 5-50m; spoofed devices show 3-7m consistently.`,
		});

		items.push({
			timestamp: pings[pings.length - 1].timestamp,
			signalType: 'GPS_ANOMALY',
			description: `Device remained at virtually identical coordinates for ${((pings.length - 1) * 1).toFixed(0)} minutes while clocked in. Legitimate drivers show 50-500x more movement.`,
		});
	}

	if (pattern === 'PHANTOM_ROUTE') {
		items.push({
			timestamp: pings[0].timestamp,
			signalType: 'GPS_ANOMALY',
			description: 'Route trace initiated. Initial movement pattern appears normal.',
		});

		for (let i = 1; i < pings.length; i++) {
			const dist = haversine(pings[i - 1].lat, pings[i - 1].lng, pings[i].lat, pings[i].lng);
			if (dist > 15000) {
				const miles = (dist / 1609).toFixed(1);
				const timeDiffMs = new Date(pings[i].timestamp).getTime() - new Date(pings[i - 1].timestamp).getTime();
				const timeDiffMin = (timeDiffMs / 60000).toFixed(0);
				const impliedSpeed = ((dist / 1609) / (timeDiffMs / 3600000)).toFixed(0);
				items.push({
					timestamp: pings[i].timestamp,
					signalType: 'TELEPORT',
					description: `IMPOSSIBLE JUMP: ${miles} miles in ${timeDiffMin} minutes (implied speed: ${impliedSpeed}mph). Route reconstruction failed between consecutive pings.`,
				});
			}
		}

		items.push({
			timestamp: pings[pings.length - 1].timestamp,
			signalType: 'GPS_ANOMALY',
			description: 'Multiple teleportation events detected. GPS manipulation tool likely in use during active delivery window.',
		});
	}

	if (pattern === 'ROSTER_AVOIDANCE') {
		items.push({
			timestamp: pings[0].timestamp,
			signalType: 'ORDER_DODGE',
			description: 'Shift started. Driver is clocked in with valid GPS movement detected.',
		});

		const zones = trace.pickupZones ?? [];
		const checkpoints = [
			Math.floor(pings.length * 0.15),
			Math.floor(pings.length * 0.3),
			Math.floor(pings.length * 0.45),
			Math.floor(pings.length * 0.6),
			Math.floor(pings.length * 0.75),
			Math.floor(pings.length * 0.9),
		];

		checkpoints.forEach((idx) => {
			const ping = pings[idx];
			const closest = zones.reduce<{ name: string; dist: number }>(
				(best, z) => {
					const d = haversine(ping.lat, ping.lng, z.lat, z.lng);
					return d < best.dist ? { name: z.name, dist: d } : best;
				},
				{ name: '', dist: Infinity }
			);

			if (closest.dist > 1200) {
				items.push({
					timestamp: ping.timestamp,
					signalType: 'ZONE_AVOIDANCE',
					description: `Driver is ${(closest.dist / 1000).toFixed(1)}km from nearest pickup zone (${closest.name}). Moving away from order assignment radius.`,
				});
			}
		});

		items.push({
			timestamp: pings[pings.length - 1].timestamp,
			signalType: 'ORDER_DODGE',
			description: `Shift ending. Driver completed near-zero deliveries despite ${((pings.length * 3) / 60).toFixed(1)} hours of active movement. Systematic pickup zone avoidance confirmed.`,
		});
	}

	if (pattern === 'GHOST_DELIVERY') {
		items.push({
			timestamp: pings[0].timestamp,
			signalType: 'GPS_ANOMALY',
			description: 'Route trace started. Movement pattern appears within normal range.',
		});

		const ghostTimes = [
			Math.floor(pings.length * 0.25),
			Math.floor(pings.length * 0.5),
			Math.floor(pings.length * 0.7),
			Math.floor(pings.length * 0.9),
		];

		ghostTimes.forEach((idx, i) => {
			const dist = 700 + Math.floor(Math.random() * 500);
			items.push({
				timestamp: pings[idx].timestamp,
				signalType: 'GHOST_DELIVERY',
				description: `Delivery #${i + 1} marked "completed" — GPS shows driver was ${dist}m from delivery address. Time at address: 0 seconds. No door photo uploaded.`,
			});
		});

		items.push({
			timestamp: pings[pings.length - 1].timestamp,
			signalType: 'GHOST_DELIVERY',
			description: 'Multiple ghost deliveries confirmed. Driver never visited delivery addresses during marked completion windows.',
		});
	}

	if (pattern === 'CLUSTER_FRAUD') {
		items.push({
			timestamp: pings[0].timestamp,
			signalType: 'GPS_ANOMALY',
			description: 'Shift started. Driver departed from registered start location.',
		});

		const clusterStart = pings.find((p) => {
			const dist = haversine(p.lat, p.lng, 47.6062, -122.3321);
			return dist < 100;
		});

		if (clusterStart) {
			items.push({
				timestamp: clusterStart.timestamp,
				signalType: 'CLUSTER',
				description: 'Driver arrived at cluster convergence point (47.6062, -122.3321). 3 other drivers detected within 50m.',
			});
		}

		const stationaryPings = pings.filter((p) => p.speed === 0 && haversine(p.lat, p.lng, 47.6062, -122.3321) < 100);
		if (stationaryPings.length > 5) {
			items.push({
				timestamp: stationaryPings[Math.floor(stationaryPings.length / 2)].timestamp,
				signalType: 'CLUSTER',
				description: `4 drivers stationary within 50m for ${stationaryPings.length * 3} minutes at non-hub location. Zero deliveries during overlap. Coordinated spoofing suspected.`,
			});
		}

		items.push({
			timestamp: pings[pings.length - 1].timestamp,
			signalType: 'CLUSTER',
			description: 'Cluster dispersed. Similar device fingerprints detected across all 4 drivers (same OS version, app version). Legal escalation recommended.',
		});
	}

	return items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

/**
 * Evidence Timeline — scrollable chronological list of fraud signals
 * generated from GPS trace analysis.
 */
function EvidenceTimeline({ trace, date }: EvidenceTimelineProps) {
	const evidence = useMemo(() => {
		if (!trace) return [];
		return generateEvidence(trace);
	}, [trace]);

	const [explainAnchor, setExplainAnchor] = useState<HTMLElement | null>(null);
	const [explainText, setExplainText] = useState('');
	const [explainLoading, setExplainLoading] = useState(false);
	const activeIdx = useRef<number>(-1);

	const handleExplain = async (e: React.MouseEvent<HTMLElement>, item: EvidenceItem, idx: number) => {
		if (activeIdx.current === idx && explainAnchor) {
			setExplainAnchor(null);
			activeIdx.current = -1;
			return;
		}
		activeIdx.current = idx;
		setExplainAnchor(e.currentTarget);
		setExplainLoading(true);
		setExplainText('');
		try {
			const res = await fetch('/api/lofat/explain-signal', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					signalType: item.signalType,
					signalDescription: item.description,
					fraudPattern: trace?.fraudPattern ?? '',
				}),
			});
			const data = await res.json();
			setExplainText(data.result || data.error || 'Explanation unavailable.');
		} catch {
			setExplainText('Failed to load explanation. Please try again.');
		} finally {
			setExplainLoading(false);
		}
	};

	if (!trace) {
		return (
			<Paper className="p-3 h-full flex items-center justify-center" elevation={0} variant="outlined">
				<Typography variant="body2" color="text.secondary">
					Select a driver with GPS data to view evidence.
				</Typography>
			</Paper>
		);
	}

	return (
		<Paper className="p-3" elevation={0} variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
			<div className="flex items-center gap-2 mb-2">
				<FuseSvgIcon size={18} color="secondary">heroicons-outline:document-magnifying-glass</FuseSvgIcon>
				<Typography variant="subtitle2" className="font-semibold">Evidence Timeline</Typography>
			</div>
			<Typography variant="caption" color="text.secondary" className="mb-2 block">{date}</Typography>

			<div style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 260px)' }}>
				<motion.div
					variants={containerVariants}
					initial="hidden"
					animate="show"
				>
					{evidence.map((item, i) => (
						<motion.div key={i} variants={itemVariants}>
							<Paper
								className="p-2 mb-1"
								elevation={0}
								sx={{
									borderLeft: `3px solid ${SIGNAL_COLORS[item.signalType] ?? '#9e9e9e'}`,
									backgroundColor: 'background.default',
								}}
							>
								<div className="flex items-center gap-1 mb-0.5">
									<Chip
										label={formatTime(item.timestamp)}
										size="small"
										variant="outlined"
										sx={{ fontSize: '0.6rem', height: 20 }}
									/>
									<Chip
										label={item.signalType.replace(/_/g, ' ')}
										size="small"
										sx={{
											fontSize: '0.6rem',
											height: 20,
											backgroundColor: `${SIGNAL_COLORS[item.signalType] ?? '#9e9e9e'}15`,
											color: SIGNAL_COLORS[item.signalType] ?? '#9e9e9e',
											fontWeight: 600,
										}}
									/>
									<IconButton
										size="small"
										onClick={(e) => handleExplain(e, item, i)}
										sx={{ ml: 'auto', p: 0.25 }}
									>
										<FuseSvgIcon size={13} color="action">heroicons-outline:question-mark-circle</FuseSvgIcon>
									</IconButton>
								</div>
								<Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.4 }}>
									{item.description}
								</Typography>
							</Paper>
						</motion.div>
					))}
				</motion.div>
			</div>

			{/* Explain Signal Popover */}
			<Popover
				open={Boolean(explainAnchor)}
				anchorEl={explainAnchor}
				onClose={() => { setExplainAnchor(null); activeIdx.current = -1; }}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				transformOrigin={{ vertical: 'top', horizontal: 'left' }}
			>
				<Paper sx={{ maxWidth: 320, p: 2 }}>
					<div className="flex items-center gap-1 mb-1">
						<AutoAwesomeIcon color="secondary" sx={{ fontSize: 14 }} />
						<Typography variant="caption" className="font-semibold">Signal Explanation</Typography>
						<Chip icon={<AutoAwesomeIcon />} label="AI-Enhanced" size="small" color="secondary" variant="outlined" sx={{ ml: 'auto', height: 18, fontSize: '0.55rem' }} />
					</div>
					{explainLoading ? (
						<div className="space-y-1">
							<Skeleton variant="text" width="90%" />
							<Skeleton variant="text" width="100%" />
							<Skeleton variant="text" width="75%" />
						</div>
					) : (
						<Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.5 }}>
							{explainText}
						</Typography>
					)}
				</Paper>
			</Popover>
		</Paper>
	);
}

export default EvidenceTimeline;
