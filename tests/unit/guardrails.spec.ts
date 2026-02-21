import { test, expect } from '@playwright/test';
import { assertImagePromptGuardrails } from '../../src/lib/server/ai/guardrails';
import { AiProviderError } from '../../src/lib/server/ai/provider.interface';

test.describe('Image Prompt Guardrails', () => {
	test('throws 400 for empty or whitespace-only prompts', () => {
		expect(() => assertImagePromptGuardrails('')).toThrow(AiProviderError);
		expect(() => assertImagePromptGuardrails('   ')).toThrow(AiProviderError);

		try {
			assertImagePromptGuardrails(' ');
		} catch (error) {
			const err = error as AiProviderError;
			expect(err.status).toBe(400);
			expect(err.code).toBe('invalid_response');
		}
	});

	test('allows valid prompts without Oswaldo', () => {
		expect(() => assertImagePromptGuardrails('Sydney drinking coffee at a motel')).not.toThrow();
		expect(() => assertImagePromptGuardrails('Cramped motel room at dawn')).not.toThrow();
	});

	test('allows valid prompts WITH Oswaldo (following visual rules)', () => {
		expect(() => assertImagePromptGuardrails('Oswaldo sleeping from behind, covered by blanket')).not.toThrow();
		expect(() => assertImagePromptGuardrails('Silhouette of Oswaldo in the background')).not.toThrow();
	});

	test('blocks Oswaldo face violations', () => {
		expect(() => assertImagePromptGuardrails('Oswaldo face visible')).toThrow(AiProviderError);
		expect(() => assertImagePromptGuardrails('Close up of Oswaldo face')).toThrow(AiProviderError);

		try {
			assertImagePromptGuardrails('oswaldo face');
		} catch (error) {
			const err = error as AiProviderError;
			expect(err.status).toBe(422);
			expect(err.code).toBe('guardrail');
		}
	});

	test('blocks Oswaldo skin violations', () => {
		expect(() => assertImagePromptGuardrails('Oswaldo bare skin')).toThrow();
		expect(() => assertImagePromptGuardrails('Oswaldo shirtless')).toThrow();
		expect(() => assertImagePromptGuardrails('Oswaldo nude')).toThrow();
		expect(() => assertImagePromptGuardrails('Oswaldo naked')).toThrow();
		expect(() => assertImagePromptGuardrails('Oswaldo skin exposed')).toThrow();
		expect(() => assertImagePromptGuardrails('Oswaldo exposed skin')).toThrow();
	});

	test('blocks strengthened body part violations for Oswaldo', () => {
		expect(() => assertImagePromptGuardrails('Oswaldo torso visible')).toThrow();
		expect(() => assertImagePromptGuardrails('Oswaldo chest visible')).toThrow();
		expect(() => assertImagePromptGuardrails('Oswaldo eyes visible')).toThrow();
		expect(() => assertImagePromptGuardrails('Oswaldo features visible')).toThrow();
	});

	test('handles variations and whitespace in forbidden phrases', () => {
		expect(() => assertImagePromptGuardrails('Oswaldo bare   skin')).toThrow();
		expect(() => assertImagePromptGuardrails('Oswaldo skin   exposed')).toThrow();
	});

	test('uses word boundaries to prevent false positives for other characters', () => {
		// "Sydney face" is allowed if Oswaldo is NOT in the prompt
		expect(() => assertImagePromptGuardrails('Sydney face visible')).not.toThrow();

		// "Oswaldo face" is blocked
		expect(() => assertImagePromptGuardrails('Oswaldo face visible')).toThrow();
	});
});
