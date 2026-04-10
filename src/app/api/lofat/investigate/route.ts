import Anthropic from '@anthropic-ai/sdk';
import { rateLimitResponse } from '@/lib/rate-limit';

const client = new Anthropic();

/**
 * POST /api/lofat/investigate — Streaming fraud investigation summary.
 */
export async function POST(request: Request) {
	const limited = rateLimitResponse(request);
	if (limited) return limited;
	try {
		const body = await request.json();
		const { driver, recentDeliveries, fraudPattern, flaggedShifts, gpsTrace } = body;

		// Compact driver profile
		const driverProfile = {
			driverId: driver.driverId,
			name: driver.name,
			zone: driver.zone,
			fraudScore: driver.fraudScore,
			status: driver.status,
			totalShifts: driver.totalShifts,
			flaggedShifts: driver.flaggedShifts,
			customerComplaintRate: driver.customerComplaintRate,
			onTimeRate: driver.onTimeRate,
			deliveriesCompleted: driver.deliveriesCompleted,
			deliveriesAttempted: driver.deliveriesAttempted,
			hourlyRate: driver.hourlyRate,
			totalEarnings: driver.totalEarnings,
		};

		// Last 10 deliveries only
		const compactDeliveries = (recentDeliveries || []).slice(0, 10).map((d: Record<string, unknown>) => ({
			deliveryId: d.deliveryId,
			deliveryStatus: d.deliveryStatus,
			fraudFlagType: d.fraudFlagType,
			fraudConfidence: d.fraudConfidence,
			distanceFromAddressAtCompletion: d.distanceFromAddressAtCompletion,
			timeAtDeliveryAddress: d.timeAtDeliveryAddress,
		}));

		// GPS trace as summary, not full pings
		const gpsSummary = gpsTrace ? {
			fraudPattern: gpsTrace.fraudPattern,
			pingCount: gpsTrace.pings?.length ?? 0,
			maxSpeedAnomaly: gpsTrace.pings ? Math.max(...gpsTrace.pings.map((p: { speed: number }) => p.speed)) : 0,
			locationVarianceMeters: gpsTrace.pings ? calculateVariance(gpsTrace.pings) : 0,
		} : null;

		const prompt = `Senior fraud investigator at a last-mile delivery company. Analyze this driver and provide a formal investigation summary.

DRIVER: ${JSON.stringify(driverProfile, null, 0)}
RECENT DELIVERIES (last 10): ${JSON.stringify(compactDeliveries, null, 0)}
PRIMARY PATTERN: ${fraudPattern}
FLAGGED SHIFTS: ${flaggedShifts}
${gpsSummary ? `GPS SUMMARY: ${JSON.stringify(gpsSummary, null, 0)}` : ''}

Provide a structured report:
1. FRAUD PATTERN & CONFIDENCE: Pattern name and confidence %.
2. TOP 3 EVIDENCE POINTS: Cite specific numbers from the data.
3. ESTIMATED FINANCIAL IMPACT: hourlyRate × flaggedShifts × 8 hours.
4. RECOMMENDED ACTION: MONITOR / SUSPEND / TERMINATE / ESCALATE_LEGAL with justification.
5. NEXT STEPS: 2-3 specific investigative actions.

Reference actual numbers. Formal third-person language. 300 words maximum.`;

		const stream = client.messages.stream({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 1000,
			messages: [{ role: 'user', content: prompt }],
		});

		const readableStream = new ReadableStream({
			async start(controller) {
				try {
					for await (const chunk of stream) {
						if (
							chunk.type === 'content_block_delta' &&
							chunk.delta.type === 'text_delta'
						) {
							controller.enqueue(
								new TextEncoder().encode(chunk.delta.text)
							);
						}
					}
					controller.close();
				} catch {
					controller.close();
				}
			},
		});

		return new Response(readableStream, {
			headers: {
				'Content-Type': 'text/plain; charset=utf-8',
				'Transfer-Encoding': 'chunked',
				'Cache-Control': 'no-cache',
			},
		});
	} catch (error) {
		console.error(`API error in ${import.meta.url}:`, error);
		return Response.json({ error: 'Investigation analysis failed' }, { status: 500 });
	}
}

function calculateVariance(pings: { lat: number; lng: number }[]): number {
	if (pings.length < 2) return 0;
	const avgLat = pings.reduce((s, p) => s + p.lat, 0) / pings.length;
	const avgLng = pings.reduce((s, p) => s + p.lng, 0) / pings.length;
	const maxDist = Math.max(
		...pings.map((p) => Math.sqrt(Math.pow((p.lat - avgLat) * 111000, 2) + Math.pow((p.lng - avgLng) * 85000, 2)))
	);
	return Math.round(maxDist);
}
