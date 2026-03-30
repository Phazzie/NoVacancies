import { loadAiConfig } from '$lib/server/ai/config';

const XAI_CHAT_URL = 'https://api.x.ai/v1/chat/completions';

interface ChatChoice {
	message?: { content?: string | null };
}

interface ChatResponse {
	choices?: ChatChoice[];
}

export function extractJsonObject(text: string): string {
	const trimmed = text.trim();
	if (!trimmed) throw new Error('Empty builder response');

	const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
	if (fenced?.[1]) {
		return fenced[1].trim();
	}

	if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
		return trimmed;
	}

	const firstBrace = trimmed.indexOf('{');
	const lastBrace = trimmed.lastIndexOf('}');
	if (firstBrace >= 0 && lastBrace > firstBrace) {
		return trimmed.slice(firstBrace, lastBrace + 1);
	}

	throw new Error('No JSON object found in builder response');
}

export async function callBuilderModel(systemPrompt: string, userPrompt: string): Promise<string> {
	const config = loadAiConfig();
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 30_000);

	let response: Response;
	try {
		response = await fetch(XAI_CHAT_URL, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				authorization: `Bearer ${config.xaiApiKey}`
			},
			body: JSON.stringify({
				model: config.grokTextModel,
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userPrompt }
				],
				max_tokens: Math.min(config.maxOutputTokens, 1400),
				temperature: 0.7
			}),
			signal: controller.signal
		});
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') {
			throw new Error('Builder model request timed out after 30 seconds');
		}
		throw error;
	} finally {
		clearTimeout(timeoutId);
	}

	if (!response.ok) {
		throw new Error(`Builder model request failed (${response.status})`);
	}

	const payload = (await response.json()) as ChatResponse;
	const text = payload.choices?.[0]?.message?.content;
	if (!text || typeof text !== 'string') {
		throw new Error('Builder model returned empty content');
	}

	return text;
}
