import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

/**
 * POST /api/nova/exec-summary
 * Generates an executive summary report of delay alerts.
 */
export async function POST(request: Request) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 25000);

	try {
		const { vehicles } = await request.json();

		const delayed = vehicles.filter((v: { delayHours: number }) => v.delayHours > 0);

		const top20 = delayed
			.map((v: Record<string, unknown>) => ({
				vrid: v.vrid,
				lane: v.lane,
				delayHours: v.delayHours,
				eddToday: v.eddToday,
				zone: v.zone,
				reason: v.reasonCodedBy,
			}))
			.sort((a: { delayHours: number; eddToday: number }, b: { delayHours: number; eddToday: number }) =>
				(b.delayHours * b.eddToday) - (a.delayHours * a.eddToday))
			.slice(0, 20);

		const prompt = `Senior logistics analyst writing an executive summary for NOC leadership.

Total: ${vehicles.length} vehicles, ${delayed.length} delayed.

Top 20 critical (by delayHours × eddToday):
${JSON.stringify(top20, null, 0)}

Return ONLY valid JSON. No prose, no markdown, no backticks.
{"reportTitle":"Nova Delay Alert Executive Summary","generatedAt":"${new Date().toISOString()}","totalDelayed":${delayed.length},"totalVehicles":${vehicles.length},"totalEddAtRisk":"sum of eddToday for delayed","avgDelayHours":"1 decimal","criticalVehicles":[{"vrid":"...","lane":"...","delayHours":0,"eddToday":0,"reason":"..."}],"escalations":["action 1 with lanes/zones","action 2 with carriers","action 3"]}

Include exactly 5 criticalVehicles and 3 escalations.`;

		const response = await client.messages.create(
			{
				model: 'claude-sonnet-4-20250514',
				max_tokens: 1000,
				messages: [{ role: 'user', content: prompt }],
			},
			{ signal: controller.signal }
		);
		clearTimeout(timeout);

		const text = response.content[0].type === 'text' ? response.content[0].text : '';
		const cleaned = text.trim().replace(/```json\n?/g, '').replace(/```/g, '').trim();
		const result = JSON.parse(cleaned);

		return Response.json({ result });
	} catch (error) {
		clearTimeout(timeout);
		if ((error as Error).name === 'AbortError') {
			return Response.json({ error: 'Request timed out — try a shorter query' }, { status: 408 });
		}
		return Response.json({ error: 'LLM request failed' }, { status: 500 });
	}
}
