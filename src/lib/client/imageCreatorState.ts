import { writable } from 'svelte/store';
import { appendDebugError } from '$lib/debug/errorLog';
import type {
	ImagePipelineSummary,
	ImageRequestRecord,
	CreatorImageAction
} from '$lib/server/ai/imagePipeline';

interface ImageApiSuccess {
	request?: ImageRequestRecord;
	status?: ImagePipelineSummary;
	error?: string;
}

export interface ImageCreatorState {
	prompt: string;
	activeRequest: ImageRequestRecord | null;
	status: ImagePipelineSummary | null;
	isWorking: boolean;
	error: string;
}

const initialState: ImageCreatorState = {
	prompt: '',
	activeRequest: null,
	status: null,
	isWorking: false,
	error: ''
};

function mapImageError(raw: unknown): string {
	const text = raw instanceof Error ? raw.message : String(raw ?? 'Image request failed');
	if (/guardrail/i.test(text)) return 'Image prompt blocked by safety guardrails. Please revise and retry.';
	if (/rate|429/i.test(text)) return 'Image generation is temporarily rate-limited. Try again shortly.';
	if (/timed out|timeout/i.test(text)) return 'Image generation timed out. Please retry.';
	return text;
}

async function callImageApi(payload: Record<string, unknown>): Promise<ImageApiSuccess> {
	const response = await fetch('/api/image', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(payload)
	});
	const body = (await response.json().catch(() => ({}))) as ImageApiSuccess;
	if (!response.ok) {
		throw new Error(body.error || `image request failed (${response.status})`);
	}
	return body;
}

function normalizeAction(action: CreatorImageAction): CreatorImageAction {
	if (action === 'generate' || action === 'regenerate' || action === 'accept' || action === 'reject' || action === 'fallback_to_static') {
		return action;
	}
	return 'generate';
}

function createImageCreatorStore() {
	const { subscribe, update } = writable<ImageCreatorState>(initialState);

	return {
		subscribe,
		setPrompt(prompt: string): void {
			update((state) => ({ ...state, prompt }));
		},
		clearError(): void {
			update((state) => ({ ...state, error: '' }));
		},
		async refreshStatus(): Promise<void> {
			try {
				const response = await fetch('/api/image');
				if (!response.ok) throw new Error(`Failed to load image status (${response.status})`);
				const body = (await response.json()) as { status?: ImagePipelineSummary };
				update((state) => ({ ...state, status: body.status ?? null }));
			} catch (error) {
				const message = mapImageError(error);
				appendDebugError({
					scope: 'image.status',
					message,
					details: { raw: error instanceof Error ? error.message : String(error) }
				});
				update((state) => ({ ...state, error: message }));
			}
		},
		async triggerAction(actionInput: CreatorImageAction, overrides: { prompt?: string; requestId?: string } = {}): Promise<void> {
			const action = normalizeAction(actionInput);
			update((state) => ({ ...state, isWorking: true, error: '' }));
			try {
				const payload: Record<string, unknown> = { action };
				if (action === 'generate' || action === 'regenerate') {
					payload.prompt = (overrides.prompt ?? '').trim();
				} else {
					payload.requestId = overrides.requestId;
				}
				const body = await callImageApi(payload);
				update((state) => ({
					...state,
					activeRequest: body.request ?? state.activeRequest,
					status: body.status ?? state.status,
					isWorking: false,
					error: ''
				}));
			} catch (error) {
				const message = mapImageError(error);
				appendDebugError({
					scope: 'image.action',
					message,
					details: {
						action,
						raw: error instanceof Error ? error.message : String(error)
					}
				});
				update((state) => ({ ...state, isWorking: false, error: message }));
			}
		}
	};
}

export const imageCreatorStore = createImageCreatorStore();
