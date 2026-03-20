import { AiProviderError } from './provider.interface';

const OSWALDO_NAME_PATTERN = /oswaldo/i;

const VIOLATION_PATTERNS = [
	/\bface\b/i,
	/\bbare\s*skin\b/i,
	/\bskin\s*exposed\b/i,
	/\bexposed\s*skin\b/i,
	/\bshirtless\b/i,
	/\bnude\b/i,
	/\bnaked\b/i,
	/\bunclothed\b/i,
	/\btorso\b/i,
	/\bchest\b/i,
	/\bbare\s*chest\b/i,
	/\bbody\b/i,
	/\bfeatures\b/i,
	/\beyes\b/i,
	/\bmouth\b/i,
	/\bnose\b/i
];

/**
 * Centralized guardrails for AI image generation prompts.
 * Enforces visual constraints and content moderation.
 *
 * @param prompt The image prompt to validate
 * @throws {AiProviderError} If the prompt violates any guardrails
 */
export function assertImagePromptGuardrails(prompt: string): void {
	const trimmed = prompt.trim();
	if (!trimmed) {
		throw new AiProviderError('Image prompt is required', {
			code: 'invalid_response',
			retryable: false,
			status: 400
		});
	}

	const lower = trimmed.toLowerCase();

	// Visual Rule: Never show Oswaldo's face or bare skin.
	// We check for "oswaldo" combined with forbidden body parts or states.
	if (OSWALDO_NAME_PATTERN.test(lower)) {
		for (const pattern of VIOLATION_PATTERNS) {
			if (pattern.test(lower)) {
				throw new AiProviderError('Image prompt violates Oswaldo guardrail', {
					code: 'guardrail',
					retryable: false,
					status: 422
				});
			}
		}
	}
}
