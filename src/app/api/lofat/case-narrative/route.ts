import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

/**
 * POST /api/lofat/case-narrative — Streaming formal case report for HR/legal review.
 */
export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { caseData, driver, evidence } = body;

		// Compact driver profile
		const driverProfile = {
			driverId: driver.driverId,
			name: driver.name,
			zone: driver.zone,
			fraudScore: driver.fraudScore,
			status: driver.status,
			hourlyRate: driver.hourlyRate,
			totalEarnings: driver.totalEarnings,
			flaggedShifts: driver.flaggedShifts,
			customerComplaintRate: driver.customerComplaintRate,
			deliveriesCompleted: driver.deliveriesCompleted,
			deliveriesAttempted: driver.deliveriesAttempted,
		};

		// Top 5 evidence items if evidence is an array, otherwise use as string
		const evidenceSummary = Array.isArray(evidence)
			? evidence.slice(0, 5).map((e: string) => e).join('\n')
			: String(evidence).slice(0, 1000);

		const prompt = `Draft a formal case report for HR/legal review. Use ${driver.name}'s name throughout. Formal third-person.

CASE: ${JSON.stringify(caseData, null, 0)}
DRIVER: ${JSON.stringify(driverProfile, null, 0)}
EVIDENCE: ${evidenceSummary}

Sections:
1. INCIDENT SUMMARY — what happened, dates, fraud pattern detected.
2. EVIDENCE — specific data anomalies with numbers (fraud score, delivery rates, GPS, complaints, financial).
3. POLICY VIOLATIONS — which policies violated (attendance fraud, GPS tampering, etc).
4. FINANCIAL IMPACT — estimated fraud: hourlyRate × flaggedShifts × 8hrs, total payroll impact.
5. RECOMMENDED ACTION — termination/suspension/legal referral/monitoring with justification.

Include specific numbers from the data. Professional language. 400 words maximum.`;

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
		return Response.json({ error: 'Case narrative generation failed' }, { status: 500 });
	}
}
