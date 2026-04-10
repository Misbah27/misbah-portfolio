import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

interface ChatMessage {
	role: 'user' | 'assistant';
	content: string;
}

/**
 * POST /api/inboundiq/chat
 * Conversational yard assistant with full context of current yard and dock state.
 */
export async function POST(request: Request) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 25000);

	try {
		const { message, history, yardTrucks, dockedTrucks, fcId } = await request.json();

		const compactYard = yardTrucks.slice(0, 40).map((t: Record<string, unknown>) => ({
			rank: t.rank,
			isaVrid: t.isaVrid,
			apptType: t.apptType,
			dwellHours: t.dwellHours,
			lowInstockPct: t.lowInstockPct,
			arrivalStatus: t.arrivalStatus,
			units: t.units,
		}));

		const compactDocked = dockedTrucks.map((t: Record<string, unknown>) => ({
			door: t.dockDoor,
			isaVrid: t.isaVrid,
			unloadingEta: t.unloadingEta,
		}));

		const occupiedDoors = dockedTrucks.filter(
			(t: { dockDoor: number | null }) => t.dockDoor !== null
		).length;

		const systemPrompt = `"Yard Intel" AI assistant for FC ${fcId}. Answer yard queue and dock status questions using the data below. Be concise, reference truck ISA/VRIDs and door numbers.

FC: ${fcId} | Doors occupied: ${occupiedDoors}

Yard Queue (${yardTrucks.length} waiting):
${JSON.stringify(compactYard)}

Docked:
${JSON.stringify(compactDocked)}

Keep responses under 150 words. Use bullet points for lists.`;

		const messages: Anthropic.MessageParam[] = [
			...(history as ChatMessage[]).map((m) => ({
				role: m.role as 'user' | 'assistant',
				content: m.content,
			})),
			{ role: 'user' as const, content: message },
		];

		const response = await client.messages.create(
			{
				model: 'claude-sonnet-4-20250514',
				max_tokens: 1000,
				system: systemPrompt,
				messages,
			},
			{ signal: controller.signal }
		);
		clearTimeout(timeout);

		return Response.json({
			result: response.content[0].type === 'text' ? response.content[0].text : '',
		});
	} catch (error) {
		console.error(`API error in ${import.meta.url}:`, error);
		clearTimeout(timeout);
		if ((error as Error).name === 'AbortError') {
			return Response.json(
				{ error: 'Request timed out — try a shorter query' },
				{ status: 408 }
			);
		}
		const msg = error instanceof Error ? error.message : 'LLM request failed'; return Response.json({ error: msg }, { status: 500 });
	}
}
