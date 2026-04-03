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
	try {
		const { message, history, yardTrucks, dockedTrucks, fcId } = await request.json();

		const totalDoors = dockedTrucks.length;
		const occupiedDoors = dockedTrucks.filter(
			(t: { dockDoor: number | null }) => t.dockDoor !== null
		).length;

		const systemPrompt = `You are "Yard Intel", an AI assistant for FC ${fcId} dock operations. Answer questions about the yard queue and dock status using the data below. Be concise, specific, and reference truck ISA/VRIDs and door numbers.

Current FC: ${fcId}
Doors occupied: ${occupiedDoors}

Yard Queue (${yardTrucks.length} trucks waiting for dock):
${JSON.stringify(
	yardTrucks.map((t: { rank: number; isaVrid: string; apptType: string; dwellHours: number; lowInstockPct: number; arrivalStatus: string; units: number }) => ({
		rank: t.rank,
		isaVrid: t.isaVrid,
		apptType: t.apptType,
		dwellHours: t.dwellHours,
		lowInstockPct: t.lowInstockPct,
		arrivalStatus: t.arrivalStatus,
		units: t.units,
	}))
)}

Docked Trucks:
${JSON.stringify(
	dockedTrucks.map((t: { dockDoor: number; isaVrid: string; unloadingEta: string | null; apptType: string }) => ({
		door: t.dockDoor,
		isaVrid: t.isaVrid,
		unloadingEta: t.unloadingEta,
		apptType: t.apptType,
	}))
)}

Keep responses under 150 words. Use bullet points for lists.`;

		const messages: Anthropic.MessageParam[] = [
			...(history as ChatMessage[]).map((m) => ({
				role: m.role as 'user' | 'assistant',
				content: m.content,
			})),
			{ role: 'user' as const, content: message },
		];

		const response = await client.messages.create({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 1000,
			system: systemPrompt,
			messages,
		});

		return Response.json({
			result: response.content[0].type === 'text' ? response.content[0].text : '',
		});
	} catch (error) {
		return Response.json({ error: 'LLM request failed' }, { status: 500 });
	}
}
