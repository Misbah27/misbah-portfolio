import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

/**
 * POST /api/lofat/case-narrative — Formal case report for HR/legal review.
 */
export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { caseData, driver, evidence } = body;

		const prompt = `Draft a formal case report for HR and legal review. Use the driver's name (${driver.name}) throughout. Write in formal third-person.

CASE DETAILS:
${JSON.stringify(caseData, null, 2)}

DRIVER PROFILE:
${JSON.stringify(driver, null, 2)}

EVIDENCE SUMMARY:
${evidence}

Structure the report with these sections:

INCIDENT SUMMARY
What happened, relevant dates, the fraud pattern detected.

EVIDENCE
Specific data anomalies with numbers — fraud score, delivery completion rates, GPS anomalies, complaint rates, financial figures.

POLICY VIOLATIONS
Which company policies were violated (attendance fraud, service manipulation, GPS tampering, coordinated fraud).

FINANCIAL IMPACT
Estimated fraud amount, hourly rate, total hours of suspected fraudulent activity, total payroll impact.

RECOMMENDED ACTION
Specific recommendation: termination, suspension, legal referral, or monitoring with justification.

Write professionally. Include specific numbers from the data. This document may be used in legal proceedings.`;

		const response = await client.messages.create({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 1000,
			messages: [{ role: 'user', content: prompt }],
		});

		return Response.json({
			result: response.content[0].type === 'text' ? response.content[0].text : '',
		});
	} catch (error) {
		return Response.json({ error: 'Case narrative generation failed' }, { status: 500 });
	}
}
