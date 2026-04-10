import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const cache = new Map<string, { result: string; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * POST /api/lofat/daily-brief — Auto-loaded shift intelligence brief.
 */
export async function POST(request: Request) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 25000);

	try {
		const body = await request.json();
		const { drivers, shiftMetrics, date, forceRefresh } = body;

		const cacheKey = JSON.stringify({ zone: 'global' });
		const cached = cache.get(cacheKey);

		if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
			clearTimeout(timeout);
			return Response.json({ result: cached.result, cached: true });
		}

		// Aggregate driver counts instead of full array
		const activeCount = drivers.filter((d: Record<string, unknown>) => d.status === 'ACTIVE').length;
		const flaggedCount = drivers.filter((d: Record<string, unknown>) => d.status === 'FLAGGED' || d.status === 'UNDER_INVESTIGATION' || d.status === 'SUSPENDED').length;

		const highRisk = drivers
			.filter((d: Record<string, unknown>) => d.status === 'FLAGGED' || d.status === 'UNDER_INVESTIGATION' || d.status === 'SUSPENDED')
			.sort((a: Record<string, unknown>, b: Record<string, unknown>) => (b.fraudScore as number) - (a.fraudScore as number))
			.slice(0, 5)
			.map((d: Record<string, unknown>) => ({
				driverId: d.driverId,
				name: d.name,
				fraudScore: d.fraudScore,
				pattern: d.primaryFraudPattern,
				zone: d.zone,
				status: d.status,
			}));

		// Last 7 days of metrics only
		const recentMetrics = shiftMetrics.slice(-7);
		const todayMetrics = recentMetrics[recentMetrics.length - 1];

		const prompt = `Shift intelligence brief for the fraud detection team. Date: ${date}.

TODAY'S METRICS: ${JSON.stringify(todayMetrics, null, 0)}

TOP 5 HIGHEST-RISK DRIVERS: ${JSON.stringify(highRisk, null, 0)}

FLEET: ${activeCount} active, ${flaggedCount} flagged/investigating
7-DAY TREND: ${JSON.stringify(recentMetrics.map((m: Record<string, unknown>) => ({ date: m.date, alerts: m.totalFraudAlerts, loss: m.estimatedDailyLoss })), null, 0)}

Exactly 4 concise bullet points:
1. Total fraud exposure estimate today ($)
2. Dominant fraud pattern and trend
3. Highest-risk driver to investigate first (name + ID + reason)
4. One operational recommendation

1-2 sentences each. Be specific with numbers.`;

		const response = await client.messages.create(
			{
				model: 'claude-sonnet-4-20250514',
				max_tokens: 1000,
				messages: [{ role: 'user', content: prompt }],
			},
			{ signal: controller.signal }
		);
		clearTimeout(timeout);

		const llmResult = response.content[0].type === 'text' ? response.content[0].text : '';
		cache.set(cacheKey, { result: llmResult, timestamp: Date.now() });

		return Response.json({ result: llmResult, cached: false });
	} catch (error) {
		console.error(`API error in ${import.meta.url}:`, error);
		clearTimeout(timeout);
		if ((error as Error).name === 'AbortError') {
			return Response.json({ error: 'Request timed out — try a shorter query' }, { status: 408 });
		}
		return Response.json({ error: 'Daily brief generation failed' }, { status: 500 });
	}
}
