import { test, expect } from '@playwright/test';

const LIVE_GEMINI_ENABLED = process.env.LIVE_GEMINI === '1';
const LIVE_GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();

test.skip(
    !LIVE_GEMINI_ENABLED || !LIVE_GEMINI_API_KEY,
    'Set LIVE_GEMINI=1 and GEMINI_API_KEY to run live canary.'
);

test.describe('Live Gemini canary (opt-in)', () => {
    test('AI mode can generate opening and one continuation scene', async ({ page }) => {
        test.setTimeout(180000);

        await page.goto('/');
        await expect(page.locator('#title-screen')).toHaveClass(/active/, { timeout: 20000 });

        await page.click('#settings-btn');
        await expect(page.locator('#settings-screen')).toHaveClass(/active/);
        await page.click('#mode-ai');
        await expect(page.locator('#mode-ai')).toHaveClass(/active/);

        const apiKeyInput = page.locator('#api-key-input');
        await apiKeyInput.fill(LIVE_GEMINI_API_KEY);
        await apiKeyInput.blur();
        await expect.poll(async () => page.evaluate(() => window.sydneyStory?.getSettings?.().apiKeySet)).toBe(
            true
        );

        await page.click('#settings-back-btn');
        await expect(page.locator('#title-screen')).toHaveClass(/active/);

        await page.locator('#title-screen.active #start-btn').click({ timeout: 20000 });
        await expect(page.locator('#game-screen')).toHaveClass(/active/, { timeout: 20000 });
        await expect(page.locator('.choice-btn').first()).toBeVisible({ timeout: 60000 });

        const sceneText = page.locator('#scene-text');
        const before = (await sceneText.innerText()).trim();

        await page.locator('.choice-btn').first().click();
        await expect(page.locator('.loading-indicator')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('.choice-btn').first()).toBeVisible({ timeout: 90000 });

        await expect
            .poll(async () => (await sceneText.innerText()).trim(), { timeout: 90000 })
            .not.toBe(before);

        await expect(page.locator('.error-message')).toHaveCount(0);
    });
});
