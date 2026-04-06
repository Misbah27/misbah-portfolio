import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

/**
 * POST /api/nova/exec-summary
 * Generates an executive summary report of delay alerts.
 */
export async function POST(request: Request) {
	try {
		const { vehicles } = await request.json();

		const delayed = vehicles.filter((v: { delayHours: number }) => v.delayHours > 0);

		const prompt = `You are a senior logistics analyst writing an executive summary for NOC leadership. Analyze the delay alert data and produce a structured report.

Total vehicles: ${vehicles.length}
Delayed vehicles: ${delayed.length}

Top 20 most critical delayed vehicles (sorted by delayHours × eddToday):
${JSON.stringify(
	delayed
		.map((v: { vrid: string; lane: string; delayHours: number; eddToday: number; eddTomorrow: number; zone: string; reasonCodedBy: string }) => ({
			vrid: v.vrid, lane: v.lane, delayHours: v.delayHours,
			eddToday: v.eddToday, eddTomorrow: v.eddTomorrow,
			zone: v.zone, reason: v.reasonCodedBy,
		}))
		.sort((a: { delayHours: number; eddToday: number }, b: { delayHours: number; eddToday: number }) =>
			(b.delayHours * b.eddToday) - (a.delayHours * a.eddToday))
		.slice(0, 20),
	null, 0
)}

Return ONLY a JSON object (no markdown, no backticks):
{
  "reportTitle": "Nova Delay Alert Executive Summary",
  "generatedAt": "${new Date().toISOString()}",
  "totalDelayed": ${delayed.length},
  "totalVehicles": ${vehicles.length},
  "totalEddAtRisk": "sum of eddToday for all delayed vehicles",
  "avgDelayHours": "average delay hours (1 decimal)",
  "criticalVehicles": [
    { "vrid": "...", "lane": "...", "delayHours": 0, "eddToday": 0, "reason": "..." },
    { "vrid": "...", "lane": "...", "delayHours": 0, "eddToday": 0, "reason": "..." },
    { "vrid": "...", "lane": "...", "delayHours": 0, "eddToday": 0, "reason": "..." },
    { "vrid": "...", "lane": "...", "delayHours": 0, "eddToday": 0, "reason": "..." },
    { "vrid": "...", "lane": "...", "delayHours": 0, "eddToday": 0, "reason": "..." }
  ],
  "escalations": [
    "specific escalation action 1 referencing lanes or zones",
    "specific escalation action 2 referencing carriers or patterns",
    "specific escalation action 3 referencing operational next steps"
  ]
}`;

		const response = await client.messages.create({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 1000,
			messages: [{ role: 'user', content: prompt }],
		});

		const text = response.content[0].type === 'text' ? response.content[0].text : '';
		const cleaned = text.trim().replace(/```json\n?/g, '').replace(/```/g, '').trim();
		const result = JSON.parse(cleaned);

		return Response.json({ result });
	} catch (error) {
		return Response.json({ error: 'LLM request failed' }, { status: 500 });
	}
}
