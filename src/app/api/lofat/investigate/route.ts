import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

/**
 * POST /api/lofat/investigate — Formal fraud investigation summary for a driver.
 */
export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { driver, recentDeliveries, fraudPattern, flaggedShifts } = body;

		const prompt = `You are a senior fraud investigator at a last-mile delivery company. Analyze this delivery driver profile and provide a formal investigation summary.

DRIVER PROFILE:
${JSON.stringify(driver, null, 2)}

RECENT DELIVERIES (sample):
${JSON.stringify(recentDeliveries?.slice(0, 10), null, 2)}

PRIMARY FRAUD PATTERN: ${fraudPattern}
FLAGGED SHIFTS: ${flaggedShifts}

Provide a structured investigation summary covering:
1. PRIMARY FRAUD PATTERN & CONFIDENCE: Identify the pattern and give a confidence level (%).
2. TOP 3 EVIDENCE POINTS: Cite specific numbers from the data (fraud score, complaint rate, delivery completion ratio, earnings vs deliveries).
3. ESTIMATED FINANCIAL IMPACT: Calculate based on hourly rate × estimated fraudulent hours (flagged shifts × 8 hours).
4. RECOMMENDED ACTION: Choose one: MONITOR / SUSPEND / TERMINATE / ESCALATE_LEGAL. Justify why.
5. NEXT INVESTIGATIVE STEPS: 2-3 specific actions to take.

Be specific — reference actual numbers from the data provided. Use formal third-person language.`;

		const response = await client.messages.create({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 1000,
			messages: [{ role: 'user', content: prompt }],
		});

		return Response.json({
			result: response.content[0].type === 'text' ? response.content[0].text : '',
		});
	} catch (error) {
		return Response.json({ error: 'Investigation analysis failed' }, { status: 500 });
	}
}
