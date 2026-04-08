import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

/**
 * POST /api/lofat/daily-brief — Auto-loaded shift intelligence brief.
 */
export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { drivers, shiftMetrics, date } = body;

		const flagged = drivers.filter((d: Record<string, unknown>) =>
			d.status === 'FLAGGED' || d.status === 'UNDER_INVESTIGATION' || d.status === 'SUSPENDED'
		);
		const highRisk = flagged.sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
			(b.fraudScore as number) - (a.fraudScore as number)
		);

		const todayMetrics = shiftMetrics[shiftMetrics.length - 1];

		const prompt = `Generate a shift intelligence brief for the fraud detection team. Today is ${date}.

TODAY'S METRICS:
${JSON.stringify(todayMetrics, null, 2)}

TOP 5 HIGHEST-RISK DRIVERS:
${JSON.stringify(highRisk.slice(0, 5).map((d: Record<string, unknown>) => ({
	driverId: d.driverId, name: d.name, fraudScore: d.fraudScore,
	pattern: d.primaryFraudPattern, zone: d.zone, status: d.status,
})), null, 2)}

FLEET SUMMARY:
- Total active: ${drivers.filter((d: Record<string, unknown>) => d.status === 'ACTIVE').length}
- Flagged: ${flagged.length}
- Patterns active: ${JSON.stringify(todayMetrics?.patternBreakdown)}

Provide exactly 4 concise bullet points:
1. Total fraud exposure estimate today ($) — based on flagged drivers × avg hourly rate × remaining shift hours
2. Dominant fraud pattern and trend
3. The single highest-risk driver to investigate first (name + ID + specific reason)
4. One operational recommendation for this shift

Keep each bullet to 1-2 sentences. Be specific with numbers.`;

		const response = await client.messages.create({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 1000,
			messages: [{ role: 'user', content: prompt }],
		});

		return Response.json({
			result: response.content[0].type === 'text' ? response.content[0].text : '',
		});
	} catch (error) {
		return Response.json({ error: 'Daily brief generation failed' }, { status: 500 });
	}
}
