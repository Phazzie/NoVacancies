import { json, type RequestHandler } from '@sveltejs/kit';
import { asRouteError } from '$lib/server/ai/routeHelpers';
import { getImagePipeline, type CreatorImageAction } from '$lib/server/ai/imagePipeline';
import { assertImagePromptGuardrails } from '$lib/server/ai/guardrails';
import { AiProviderError } from '$lib/server/ai/provider.interface';
import { authErrorResponse, getSessionUser, isBuilderRole, BUILDER_ROLES } from '$lib/server/auth';

interface ImagePostPayload {
    action?: CreatorImageAction;
    prompt?: string;
    requestId?: string;
}

async function requireCreatorSession(event: Parameters<RequestHandler>[0]): Promise<Response | null> {
    const sessionUser = await getSessionUser(event);
    if (!sessionUser) {
        return authErrorResponse({
            status: 401,
            code: 'auth_required',
            message: 'You must be signed in to use image creator tools.',
            path: event.url.pathname
        });
    }
    if (!isBuilderRole(sessionUser.role)) {
        return authErrorResponse({
            status: 403,
            code: 'insufficient_role',
            message: `Image creator access requires one of: ${BUILDER_ROLES.join(', ')}.`,
            path: event.url.pathname
        });
    }
    return null;
}

function normalizeAction(value: unknown): CreatorImageAction {
    if (typeof value !== 'string') return 'generate';
    if (
        value === 'generate' ||
        value === 'regenerate' ||
        value === 'accept' ||
        value === 'reject' ||
        value === 'fallback_to_static'
    ) {
        return value;
    }
    return 'generate';
}

export const GET: RequestHandler = async (event) => {
    const authError = await requireCreatorSession(event);
    if (authError) return authError;

    const pipeline = getImagePipeline();
    return json({ status: pipeline.summary() });
};

export const POST: RequestHandler = async (event) => {
    const authError = await requireCreatorSession(event);
    if (authError) return authError;

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

        try {
            assertImagePromptGuardrails(prompt);
        } catch (guardrailError) {
            if (guardrailError instanceof AiProviderError && guardrailError.code === 'guardrail') {
                return json(
                    { error: guardrailError.message, status: pipeline.summary() },
                    { status: 422 }
                );
            }
            throw guardrailError;
        }

        const request = await pipeline.generate(prompt, action === 'regenerate' ? 'regenerate' : 'generate');
        const statusCode = request.status === 'failed' ? 422 : 200;
        return json({ request, image: request.result, status: pipeline.summary() }, { status: statusCode });
    } catch (error) {
        return asRouteError(event, error);
    }
};

