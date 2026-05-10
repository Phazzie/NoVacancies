import { loadAiConfig } from '$lib/server/ai/config';

const XAI_CHAT_URL = 'https://api.x.ai/v1/chat/completions';

interface ChatChoice {
	message?: { content?: string | null };
}

interface ChatResponse {
	choices?: ChatChoice[];
}

async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callBuilderModel(systemPrompt: string, userPrompt: string): Promise<string> {
	const config = loadAiConfig();
	const maxAttempts = 1 + config.maxRetries;
	let lastError: Error | null = null;

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		if (attempt > 0) {
			const backoffMs =
				config.retryBackoffMs[attempt - 1] ?? config.retryBackoffMs.at(-1) ?? 1200;
			await sleep(backoffMs);
		}

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), config.requestTimeoutMs);
		const startMs = Date.now();

		try {
			const response = await fetch(XAI_CHAT_URL, {
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
					max_tokens: config.builderMaxTokens,
					temperature: config.builderTemperature
				}),
				signal: controller.signal
			});
			clearTimeout(timeoutId);

			if (!response.ok) {
				const err = new Error(`Builder model request failed (${response.status})`);
				if (response.status >= 500 && attempt < maxAttempts - 1) {
					lastError = err;
					console.warn(`[provider_build] attempt=${attempt + 1} status=${response.status} retrying`);
					continue;
				}
				throw err;
			}

			const payload = (await response.json()) as ChatResponse;
			const text = payload.choices?.[0]?.message?.content;
			if (!text || typeof text !== 'string') {
				throw new Error('Builder model returned empty content');
			}

			const durationMs = Date.now() - startMs;
			console.info(`[provider_build] ok attempt=${attempt + 1} duration_ms=${durationMs}`);
			return text;
		} catch (error) {
			clearTimeout(timeoutId);
			if (error instanceof Error && error.name === 'AbortError') {
				const timeoutErr = new Error(
					`Builder model request timed out after ${config.requestTimeoutMs}ms`
				);
				if (attempt < maxAttempts - 1) {
					lastError = timeoutErr;
					console.warn(`[provider_build] attempt=${attempt + 1} timeout retrying`);
					continue;
				}
				throw timeoutErr;
			}
			throw error;
		}
	}

	throw lastError ?? new Error('Builder model request failed after all retries');
}
