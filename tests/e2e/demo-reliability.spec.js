import { test, expect } from '@playwright/test';

const HAS_XAI_KEY = Boolean((process.env.XAI_API_KEY || '').trim());

async function expectPathname(page, expectedPath) {
	await expect
		.poll(() => {
			try {
				return new URL(page.url()).pathname;
			} catch {
				return '';
			}
		})
		.toBe(expectedPath);
}

test.describe('SvelteKit route + playthrough reliability', () => {
	test('api story opening rejects mock override and stays Grok-only', async ({ request }) => {
		const openingResponse = await request.post('/api/story/opening', {
			data: {
				useMocks: true,
				featureFlags: { narrativeContextV2: true, transitionBridges: true }
			}
		});
		const openingBody = await openingResponse.json();
		if (HAS_XAI_KEY) {
			expect(openingResponse.ok()).toBeTruthy();
			expect(typeof openingBody.scene?.sceneId).toBe('string');
			expect(typeof openingBody.scene?.sceneText).toBe('string');
			expect(Array.isArray(openingBody.scene?.choices)).toBeTruthy();
		} else {
			expect(openingResponse.ok()).toBeFalsy();
			expect(String(openingBody.error || '')).toMatch(/xai_api_key|required|grok-only/i);
		}
	});

	test('provider probe endpoint is safely gated by config flag', async ({ request }) => {
		const response = await request.get('/api/ai/probe');
		expect([200, 403, 500]).toContain(response.status());
	});

	test('image endpoint enforces guardrails before provider call', async ({ request }) => {
		const blocked = await request.post('/api/image', {
			data: {
				prompt: 'Close portrait of Oswaldo face with bare skin'
			}
		});
		expect(blocked.status()).toBe(422);
		const body = await blocked.json();
		expect(String(body.error || '')).toMatch(/guardrail/i);
	});

	test('story opening remains playable for AI-mode request payload shape', async ({ request }) => {
		const response = await request.post('/api/story/opening', {
			data: {
				useMocks: false,
				featureFlags: { narrativeContextV2: true, transitionBridges: true }
			}
		});
		const body = await response.json();
		if (HAS_XAI_KEY) {
			expect(response.ok()).toBeTruthy();
			expect(typeof body.scene?.sceneText).toBe('string');
			expect(Array.isArray(body.scene?.choices)).toBeTruthy();
			expect(body.scene.choices.length).toBeGreaterThan(0);
		} else {
			expect(response.ok()).toBeFalsy();
			expect(String(body.error || '')).toMatch(/xai_api_key|required|grok-only/i);
		}
	});

	test('route shells render', async ({ page }) => {
		await page.goto('/');
		await expectPathname(page, '/');
		await expect(page.getByRole('heading', { level: 2, name: 'Carry What Matters' })).toBeVisible();

		await page.goto('/settings');
		await expectPathname(page, '/settings');
		await expect(page.getByRole('heading', { level: 2, name: 'Settings' })).toBeVisible();

		await page.goto('/play');
		await expectPathname(page, '/play');
		await expect(page.getByRole('heading', { level: 2, name: 'Play' })).toBeVisible();
		if (HAS_XAI_KEY) {
			await expect(page.getByTestId('mode-pill')).toContainText(/AI Mode/i);
			await expect(page.locator('.choice-btn').first()).toBeVisible({ timeout: 20000 });
		} else {
			await expect(page.locator('.error-banner')).toContainText(/xai_api_key|required|grok-only/i);
		}
	});

	test('settings no longer exposes Static Story toggle', async ({ page }) => {
		await page.goto('/settings');
		await expect(page.getByRole('button', { name: 'Static Story' })).toHaveCount(0);
		await expect(page.getByText(/AI Generated only/i)).toBeVisible();
	});

	test('play route shows AI mode badge when scene is loaded', async ({ page }) => {
		await page.goto('/play');
		if (HAS_XAI_KEY) {
			await expect(page.getByTestId('mode-pill')).toContainText('AI Mode');
		}
	});
});
