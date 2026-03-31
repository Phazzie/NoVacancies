import { AiProviderError, isRetryableStatus } from '$lib/server/ai/provider.interface';

export interface ProviderRequestOptions {
	fetchImpl: typeof fetch;
	url: string;
	apiKey: string;
	requestTimeoutMs: number;
	body: Record<string, unknown>;
	requestType: 'chat' | 'image';
}

function mapStatusToCode(status: number): 'auth' | 'rate_limit' | 'provider_down' {
	if (status === 401 || status === 403) return 'auth';
	if (status === 429) return 'rate_limit';
	return 'provider_down';
}

export async function executeJsonRequest<T>(options: ProviderRequestOptions): Promise<T> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), options.requestTimeoutMs);

	try {
		const response = await options.fetchImpl(options.url, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				authorization: `Bearer ${options.apiKey}`
			},
			body: JSON.stringify(options.body),
			signal: controller.signal
		});

		if (!response.ok) {
			throw new AiProviderError(`xAI ${options.requestType} request failed (${response.status})`, {
				code: mapStatusToCode(response.status),
				retryable: isRetryableStatus(response.status),
				status: response.status
			});
		}

		return (await response.json()) as T;
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') {
			throw new AiProviderError(`xAI ${options.requestType} request timed out`, {
				code: 'timeout',
				retryable: true,
				status: 504
			});
		}
		if (error instanceof AiProviderError) {
			throw error;
		}
		throw new AiProviderError(`xAI ${options.requestType} request failed`, {
			code: 'unknown',
			retryable: false
		});
	} finally {
		clearTimeout(timeout);
	}
}
