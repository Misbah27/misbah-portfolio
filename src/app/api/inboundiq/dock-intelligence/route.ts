import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

/**
 * POST /api/inboundiq/dock-intelligence
 * Generates actionable dock operations recommendations based on current yard and dock state.
 */
export async function POST(request: Request) {
	try {
		const { yardQueue, dockedTrucks, fcId, totalDoors } = await request.json();

		const occupied = dockedTrucks.length;
		const available = totalDoors - occupied;

		// Get top 3 yard trucks by rank
		const top3 = [...yardQueue]
			.sort((a: { rank: number }, b: { rank: number }) => a.rank - b.rank)
			.slice(0, 3);

		// Get doors freeing soonest
		const doorsFreeing = dockedTrucks
			.filter((t: { unloadingEta: string | null }) => t.unloadingEta)
			.sort((a: { unloadingEta: string }, b: { unloadingEta: string }) =>
				new Date(a.unloadingEta).getTime() - new Date(b.unloadingEta).getTime()
			)
			.slice(0, 2);

		const prompt = `You are an FC dock operations advisor. Given the following state for ${fcId}:

- Total doors: ${totalDoors}, Occupied: ${occupied}, Available: ${available}
- ${yardQueue.length} trucks waiting in yard queue

Top 3 queue trucks (highest priority):
${top3.map((t: { isaVrid: string; lowInstockPct: number; apptType: string; dwellHours: number; rank: number }) =>
	`  #${t.rank} ${t.isaVrid}: lowInstockPct=${t.lowInstockPct}%, apptType=${t.apptType}, dwellHours=${t.dwellHours}h`
).join('\n')}

Doors freeing soonest:
${doorsFreeing.map((t: { dockDoor: number; isaVrid: string; unloadingEta: string }) =>
	`  Door ${t.dockDoor} (${t.isaVrid}): ETA ${t.unloadingEta}`
).join('\n') || '  No ETAs available'}

Give 2-3 specific, actionable recommendations for the next 30 minutes of dock operations. Be concrete — name truck ISA/VRID and door numbers. Keep each recommendation to 1-2 sentences. Format as numbered list.`;

		const response = await client.messages.create({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 1000,
			messages: [{ role: 'user', content: prompt }],
		});

		return Response.json({
			result: response.content[0].type === 'text' ? response.content[0].text : '',
		});
	} catch (error) {
		return Response.json({ error: 'LLM request failed' }, { status: 500 });
	}
}
