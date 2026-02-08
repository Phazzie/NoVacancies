import { test, expect } from '@playwright/test';

const LIVE_GROK_ENABLED = process.env.LIVE_GROK === '1';
const LIVE_GROK_API_KEY = (process.env.XAI_API_KEY || '').trim();

test.skip(
    !LIVE_GROK_ENABLED || !LIVE_GROK_API_KEY,
    'Set LIVE_GROK=1 and XAI_API_KEY to run live canary.'
);

test.describe('Live Grok canary (opt-in)', () => {
    test('AI mode can generate opening and one continuation scene', async ({ page }) => {
        test.setTimeout(180000);

        await page.goto('/settings');
        await expect(page.getByRole('heading', { level: 2, name: 'Settings' })).toBeVisible({
            timeout: 20000
        });

        const apiKeyInput = page.getByPlaceholder('Enter AI key');
        await expect(apiKeyInput).toBeVisible();
        await apiKeyInput.fill(LIVE_GROK_API_KEY);
        await apiKeyInput.blur();
        await page.goto('/play');
        await expect(page.getByRole('heading', { level: 2, name: 'Play' })).toBeVisible({
            timeout: 20000
        });
        await expect(page.getByTestId('mode-pill')).toContainText('AI Mode');
        await expect(page.locator('.choice-btn').first()).toBeVisible({ timeout: 90000 });

        const sceneText = page.locator('.scene-text');
        const before = (await sceneText.innerText()).trim();

        await page.locator('.choice-btn').first().click();
        await expect(page.locator('.choice-btn').first()).toBeVisible({ timeout: 90000 });

        await expect
            .poll(async () => (await sceneText.innerText()).trim(), { timeout: 90000 })
            .not.toBe(before);

        await expect(page.locator('.error-banner')).toHaveCount(0);
    });
});
