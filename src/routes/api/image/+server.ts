import { json, type RequestHandler } from '@sveltejs/kit';
import { asRouteError } from '$lib/server/ai/routeHelpers';
import { getImagePipeline, type CreatorImageAction } from '$lib/server/ai/imagePipeline';

interface ImagePostPayload {
	action?: CreatorImageAction;
	prompt?: string;
	requestId?: string;
}

function assertPromptGuardrail(prompt: string): string | null {
	const lower = prompt.toLowerCase();
	if (/oswaldo/.test(lower) && /(face|bare skin|shirtless|nude|naked|skin exposed)/.test(lower)) {
		return 'Image request blocked by safety guardrails. Adjust the prompt and try again.';
	}
	return null;
}

function normalizeAction(value: unknown): CreatorImageAction {
	if (typeof value !== 'string') return 'generate';
	if (value === 'generate' || value === 'regenerate' || value === 'accept' || value === 'reject' || value === 'fallback_to_static') {
		return value;
	}
	return 'generate';
}

export const GET: RequestHandler = async () => {
	const pipeline = getImagePipeline();
	return json({ status: pipeline.summary() });
};

export const POST: RequestHandler = async (event) => {
	try {
		const payload = (await event.request.json().catch(() => ({}))) as ImagePostPayload;
		const action = normalizeAction(payload.action);
		const pipeline = getImagePipeline();

		if (action === 'accept' || action === 'reject' || action === 'fallback_to_static') {
			const requestId = typeof payload.requestId === 'string' ? payload.requestId.trim() : '';
			if (!requestId) {
				return json({ error: 'requestId is required for creator decision actions' }, { status: 400 });
			}
			const decision = action === 'accept' ? 'accepted' : action === 'reject' ? 'rejected' : 'fallback_to_static';
			const updated = pipeline.applyDecision(requestId, decision);
			if (!updated) {
				return json({ error: 'Image request not found' }, { status: 404 });
			}
			return json({ request: updated, status: pipeline.summary() });
		}

		const prompt = typeof payload.prompt === 'string' ? payload.prompt.trim() : '';
		if (!prompt) {
			return json({ error: 'prompt is required' }, { status: 400 });
		}

		const guardrailMessage = assertPromptGuardrail(prompt);
		if (guardrailMessage) {
			return json(
				{
					request: {
						status: 'failed',
						error: { reasonCode: 'guardrail', message: guardrailMessage }
					},
					error: guardrailMessage,
					status: pipeline.summary()
				},
				{ status: 422 }
			);
		}

		const request = await pipeline.generate(prompt, action === 'regenerate' ? 'regenerate' : 'generate');
		const statusCode = request.status === 'failed' ? 422 : 200;
		return json({ request, image: request.result, status: pipeline.summary() }, { status: statusCode });
	} catch (error) {
		return asRouteError(event, error);
	}
};
