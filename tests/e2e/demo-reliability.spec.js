import { test, expect } from '@playwright/test';

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
	test('api story endpoints return contract-shaped scenes in mock mode', async ({ request }) => {
		const openingResponse = await request.post('/api/story/opening', {
			data: {
				useMocks: true,
				featureFlags: { narrativeContextV2: true, transitionBridges: true }
			}
		});
		expect(openingResponse.ok()).toBeTruthy();
		const openingBody = await openingResponse.json();
		expect(typeof openingBody.scene?.sceneId).toBe('string');
		expect(typeof openingBody.scene?.sceneText).toBe('string');
		expect(Array.isArray(openingBody.scene?.choices)).toBeTruthy();

		const nextResponse = await request.post('/api/story/next', {
			data: {
				currentSceneId: openingBody.scene.sceneId,
				choiceId: openingBody.scene.choices[0]?.id ?? 'just_sit',
				gameState: {
					currentSceneId: openingBody.scene.sceneId,
					history: [],
					lessonsEncountered: [],
					storyThreads: {
						oswaldoConflict: 0,
						trinaTension: 0,
						moneyResolved: false,
						carMentioned: false,
						sydneyRealization: 0,
						boundariesSet: [],
						oswaldoAwareness: 0,
						exhaustionLevel: 1
					},
					sceneLog: [],
					pendingTransitionBridge: null,
					featureFlags: { narrativeContextV2: true, transitionBridges: true },
					apiKey: null,
					useMocks: true,
					sceneCount: 1,
					startTime: Date.now()
				}
			}
		});
		expect(nextResponse.ok()).toBeTruthy();
		const nextBody = await nextResponse.json();
		expect(typeof nextBody.scene?.sceneId).toBe('string');
		expect(Array.isArray(nextBody.scene?.choices)).toBeTruthy();
	});

	test('provider probe endpoint is safely gated by config flag', async ({ request }) => {
		const response = await request.get('/api/ai/probe');
		expect([200, 403]).toContain(response.status());
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
		expect(response.ok()).toBeTruthy();
		const body = await response.json();
		expect(typeof body.scene?.sceneText).toBe('string');
		expect(Array.isArray(body.scene?.choices)).toBeTruthy();
		expect(body.scene.choices.length).toBeGreaterThan(0);
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
		await expect(page.getByTestId('mode-pill')).toContainText(/Mock Mode|AI Mode/i);
		await expect(page.locator('.choice-btn').first()).toBeVisible({ timeout: 20000 });
	});

	test('mock playthrough reaches ending route and exposes ending stats', async ({ page }) => {
		await page.goto('/settings');
		await page.getByRole('button', { name: 'Static Story' }).click();

		await page.goto('/play');
		await expect(page.getByTestId('mode-pill')).toContainText('Mock Mode');
		await expect(page.locator('.choice-btn').first()).toBeVisible({ timeout: 20000 });

		// opening -> sit_reflect
		await page
			.getByRole('button', { name: /Just sit with this feeling for a minute\./i })
			.click();
		await expect(page.locator('.choice-btn').first()).toBeVisible({ timeout: 20000 });

		// sit_reflect -> what_am_i
		await page
			.getByRole('button', { name: /Ask yourself the real question: What am I to them\?/i })
			.click();
		await expect(page.locator('.choice-btn').first()).toBeVisible({ timeout: 20000 });

		// what_am_i -> ending_loop (auto navigates)
		await page
			.getByRole('button', {
				name: /Accept it\. Nothing will change, but at least you see it now\./i
			})
			.click();

		await expectPathname(page, '/ending');
		await expect(page.getByRole('heading', { level: 2, name: 'Ending' })).toBeVisible();
		await expect(page.locator('.ending-title')).toContainText(/loop|shift|exit|rare/i);
		await expect(page.getByText(/Scenes:/i)).toBeVisible();
		await expect(page.getByText(/Insights:/i)).toBeVisible();
	});

	test('play route shows ai mode badge when ai generated mode is selected', async ({ page }) => {
		await page.goto('/settings');
		await page.getByRole('button', { name: 'AI Generated' }).click();

		await page.goto('/play');
		await expect(page.getByTestId('mode-pill')).toContainText('AI Mode');
	});
});
