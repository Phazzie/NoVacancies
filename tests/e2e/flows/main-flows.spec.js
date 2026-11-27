import { expect, test } from '@playwright/test';

function trackFailures(page) {
    const failures = [];
    page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`));
    page.on('response', (response) => {
        if (response.status() >= 400 && response.url().includes('/api/')) {
            failures.push(`HTTP ${response.status()} ${response.url()}`);
        }
    });
    return failures;
}

test.describe('main player flow', () => {
    test('home → play → three choices → ending → play again', async ({ page }) => {
        const failures = trackFailures(page);

        await page.goto('/');
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await page.getByRole('button', { name: 'Begin Statement' }).click();
        await expect(page).toHaveURL(/\/play$/);

        await expect(page.getByTestId('mode-pill')).toHaveText(/AI-written record/i);
        await expect(page.getByText(/^Scene 1\./)).toBeVisible();

        // Mix click and quick-key input; both paths must advance the run.
        await page.getByRole('button', { name: /Pay the rent again/i }).click();
        await expect(page.getByText(/^Scene 2\./)).toBeVisible();
        await page.keyboard.press('2');
        await expect(page.getByText(/^Scene 3\./)).toBeVisible();
        await page.keyboard.press('3');

        await expect(page).toHaveURL(/\/ending/);
        await expect(page.locator('.ending-title')).toHaveText(/exit/i);

        await page.getByRole('button', { name: /Open a new period/i }).click();
        await expect(page).toHaveURL(/\/play$/);
        await expect(page.getByText(/^Scene 1\./)).toBeVisible();

        expect(failures).toEqual([]);
    });

    test('share ending falls back to a copyable link when clipboard is unavailable', async ({
        page
    }) => {
        await page.goto('/play');
        for (const scene of [1, 2, 3]) {
            await expect(page.getByText(new RegExp(`^Scene ${scene}\\.`))).toBeVisible();
            await page.keyboard.press('1');
        }
        await expect(page).toHaveURL(/\/ending/);

        await page.evaluate(() => {
            Object.defineProperty(navigator, 'clipboard', {
                value: { writeText: () => Promise.reject(new Error('denied')) },
                configurable: true
            });
        });
        await page.getByRole('button', { name: /Request a copy/i }).click();
        const link = page.locator('.share-fallback-input');
        await expect(link).toBeVisible();
        await expect(link).toHaveValue(/\/ending\?/);

        const sharedUrl = await link.inputValue();
        await page.goto(sharedUrl);
        await expect(page.locator('.ending-title')).toHaveText(/exit/i);
    });

    test('anonymous visitors see settings and debug without creator-only errors', async ({
        page
    }) => {
        const failures = trackFailures(page);

        await page.goto('/settings');
        await expect(page.getByRole('heading', { name: 'Preferences' })).toBeVisible();
        await expect(page.getByTestId('creator-image-panel')).toHaveCount(0);

        await page.goto('/debug');
        await expect(page.getByTestId('debug-ready')).toHaveText('ready');
        await expect(page.getByTestId('debug-image-status')).toHaveCount(0);

        expect(failures).toEqual([]);
    });
});

test.describe('builder flow', () => {
    test('login → generate draft → run QA → download JSON', async ({ page }) => {
        const failures = trackFailures(page);

        await page.goto('/builder');
        await expect(page).toHaveURL(/\/login\?next=%2Fbuilder/);
        await page.getByRole('button', { name: /Enter as author/i }).click();
        await expect(page).toHaveURL(/\/builder$/);

        await page
            .getByLabel(/story premise/i)
            .fill(
                'A night-shift nurse covers for her brother while the hospital audits the drug cabinet.'
            );
        const generated = page.waitForResponse('**/api/builder/generate-draft');
        await page.getByRole('button', { name: 'Generate Draft' }).click();
        const generatedBody = await (await generated).json();
        // Guard against fallback scaffolding silently satisfying the happy path.
        expect(generatedBody.source).toBe('ai');
        expect(generatedBody.draft?.title).toBe('Fixture Draft: Night Shift Ledger');
        await expect(page.getByText(/Draft generated with AI/i)).toBeVisible();

        const evaluated = page.waitForResponse('**/api/builder/evaluate-draft');
        await page.getByRole('button', { name: 'Run Draft QA' }).click();
        expect((await (await evaluated).json()).source).toBe('ai');
        await expect(page.getByText(/Source: AI graded/i)).toBeVisible();
        await expect(page.getByText(/Fixture finding: sleep debt/i)).toBeVisible();

        const download = page.waitForEvent('download');
        await page.getByRole('button', { name: 'Download JSON' }).click();
        expect((await download).suggestedFilename()).toMatch(/\.json$/);

        await page.goto('/settings');
        await expect(page.getByTestId('creator-image-panel')).toBeVisible();

        expect(failures).toEqual([]);
    });
});
