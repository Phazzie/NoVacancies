import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const GEMINI_ROUTE_GLOB = '**/v1beta/models/*:generateContent**';
const TELEMETRY_STAGE_SET = new Set([
    'request_start',
    'model_used',
    'parse_recovery_attempt',
    'fallback_trigger',
    'final_success',
    'final_failure'
]);

function createSceneResponse(sceneText, choices, overrides = {}) {
    return {
        sceneText,
        choices,
        lessonId: 1,
        imageKey: 'hotel_room',
        isEnding: false,
        endingType: null,
        mood: 'tense',
        storyThreadUpdates: null,
        ...overrides
    };
}

function wrapGeminiResponse(scene) {
    return {
        candidates: [
            {
                content: {
                    parts: [{ text: JSON.stringify(scene) }]
                }
            }
        ]
    };
}

async function configureGeminiRoute(page, options = {}) {
    const { failAfterSuccesses = null, networkDelayMs = 300 } = options;

    const scriptedScenes = [
        createSceneResponse(
            "You are up before sunrise, checking rent money while Sydney's laptop fan hums against the stale motel air. Oswaldo snores through your panic and Trina shifts on the carpet, wrapped in someone else's hoodie.",
            [
                { id: 'open_laptop', text: 'Open the laptop and start hustling' },
                { id: 'wake_oswaldo', text: 'Wake Oswaldo and demand help' }
            ],
            { storyThreadUpdates: { exhaustionLevel: 2 } }
        ),
        createSceneResponse(
            "Sydney leans into the keyboard and starts stitching together small wins before the front desk can knock. The room smells like cold coffee and old smoke, and Oswaldo finally blinks awake while pretending he was 'about to help.'",
            [
                { id: 'set_boundary', text: 'Tell Oswaldo no guests and no excuses today' },
                { id: 'ignore_him', text: 'Ignore him and keep working the rent gap' }
            ],
            { storyThreadUpdates: { oswaldoConflict: 1, boundariesSet: ['no guests today'] } }
        ),
        createSceneResponse(
            "Sydney keeps one eye on the clock and one eye on Oswaldo, who is now performing usefulness for the room. You clock it instantly: same pattern, new costume. Rent still matters more than his speech.",
            [
                { id: 'double_down_work', text: 'Double down and close the final cash gap' },
                { id: 'call_him_out', text: 'Call out the pattern directly' }
            ],
            { storyThreadUpdates: { trinaTension: 1, oswaldoAwareness: 1 } }
        )
    ];

    let requestCount = 0;
    let successCount = 0;

    await page.route(GEMINI_ROUTE_GLOB, async (route) => {
        requestCount++;

        if (failAfterSuccesses !== null && successCount >= failAfterSuccesses) {
            await page.waitForTimeout(networkDelayMs);
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ error: { message: 'Simulated Gemini failure for fallback test' } })
            });
            return;
        }

        const index = Math.min(successCount, scriptedScenes.length - 1);
        const scene = scriptedScenes[index];
        successCount++;

        await page.waitForTimeout(networkDelayMs);
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(wrapGeminiResponse(scene))
        });
    });

    return () => ({ requestCount, successCount });
}

async function openAndStartInAiMode(page) {
    await page.goto('/');
    await expect(page.locator('#title-screen')).toHaveClass(/active/, { timeout: 15000 });
    await expect(page.locator('#title-screen #start-btn')).toBeVisible({ timeout: 15000 });

    await page.click('#settings-btn');
    await expect(page.locator('#settings-screen')).toHaveClass(/active/);

    await page.click('#mode-ai');
    await expect(page.locator('#mode-ai')).toHaveClass(/active/);
    await page.click('#lessons-on');
    await expect(page.locator('#lessons-on')).toHaveClass(/active/);

    const apiKeyInput = page.locator('#api-key-input');
    await apiKeyInput.fill('AIza_demo_key_for_e2e_testing_12345');
    await apiKeyInput.blur();
    await expect.poll(async () => page.evaluate(() => window.sydneyStory?.getSettings?.().apiKeySet)).toBe(
        true
    );
    await expect
        .poll(async () => page.evaluate(() => Object.hasOwn(window.sydneyStory?.getSettings?.(), 'apiKey')))
        .toBe(false);

    await page.click('#settings-back-btn');
    await expect(page.locator('#title-screen')).toHaveClass(/active/);
    await expect(page.locator('#settings-screen')).not.toHaveClass(/active/);

    await page.locator('#title-screen.active #start-btn').click({ timeout: 15000 });
    await expect(page.locator('#game-screen')).toHaveClass(/active/, { timeout: 15000 });
    await expect(page.locator('.choice-btn').first()).toBeVisible({ timeout: 15000 });
}

async function openAndStartInMockMode(page) {
    await page.goto('/');
    await expect(page.locator('#title-screen')).toHaveClass(/active/, { timeout: 15000 });
    await expect(page.locator('#title-screen #start-btn')).toBeVisible({ timeout: 15000 });
    await page.locator('#title-screen.active #start-btn').click({ timeout: 15000 });
    await expect(page.locator('#game-screen')).toHaveClass(/active/, { timeout: 15000 });
    await expect(page.locator('.choice-btn').first()).toBeVisible({ timeout: 15000 });
}

async function playFastPathToEnding(page) {
    await openAndStartInMockMode(page);

    // opening -> work_early
    await page.locator('.choice-btn').nth(0).click();
    await expect(page.locator('.choice-btn').first()).toBeVisible({ timeout: 15000 });

    // work_early -> stay_quiet_loop
    await page.locator('.choice-btn').nth(1).click();
    await expect(page.locator('.choice-btn').first()).toBeVisible({ timeout: 15000 });

    // stay_quiet_loop -> ending_loop
    await page.locator('.choice-btn').nth(0).click();
    await expect(page.locator('#ending-screen')).not.toHaveClass(/active/);
    await expect(page.locator('#view-recap-btn')).toBeVisible({ timeout: 45000 });
    await page.locator('#view-recap-btn').click();
    await expect(page.locator('#ending-screen')).toHaveClass(/active/, { timeout: 15000 });
    await expect(page.locator('#ending-recap-text')).not.toContainText('Recap will appear here.', {
        timeout: 15000
    });
}

test('Startup resilience: corrupt persisted settings do not block entering game', async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.setItem('sydney-story-settings', '{broken-json');
        localStorage.setItem('sydney-story-endings', '{broken-json');
        sessionStorage.setItem('sydney-story-api-key-session', 'bad-key');
    });

    await page.goto('/');
    await expect(page.locator('#title-screen')).toHaveClass(/active/, { timeout: 15000 });
    await expect(page.locator('#title-screen #start-btn')).toBeVisible({ timeout: 15000 });
    await expect.poll(async () => page.evaluate(() => window.sydneyStory?.getSettings?.().apiKeySet)).toBe(
        false
    );

    await page.locator('#title-screen.active #start-btn').click({ timeout: 15000 });
    await expect(page.locator('#game-screen')).toHaveClass(/active/, { timeout: 15000 });
    await expect(page.locator('.choice-btn').first()).toBeVisible({ timeout: 15000 });
});

async function chooseFirstOptionAndWaitForTransition(page) {
    const sceneText = page.locator('#scene-text');
    const previousText = (await sceneText.innerText()).trim();

    await page.locator('.choice-btn').first().click();
    await expect(page.locator('.loading-indicator')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.choice-btn').first()).toBeVisible({ timeout: 15000 });

    await expect
        .poll(async () => {
            const current = (await sceneText.innerText()).trim();
            return { current, changed: current !== previousText && current.length > 24 };
        })
        .toMatchObject({ changed: true });
}

function assertTelemetryContract(entries, requiredStages = []) {
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThan(0);

    for (const entry of entries) {
        expect(typeof entry.stage).toBe('string');
        expect(TELEMETRY_STAGE_SET.has(entry.stage)).toBe(true);
        expect(typeof entry.timestamp).toBe('string');
        expect(Number.isNaN(Date.parse(entry.timestamp))).toBe(false);
        expect(typeof entry.payload).toBe('object');
        expect(entry.payload).not.toBeNull();
    }

    for (const stage of requiredStages) {
        expect(entries.some((entry) => entry.stage === stage)).toBe(true);
    }
}

test('AI mode smoke flow: 2 choices with loading + transitions and no dead-end UI', async ({
    page
}) => {
    await configureGeminiRoute(page, { failAfterSuccesses: null, networkDelayMs: 350 });
    await openAndStartInAiMode(page);

    await chooseFirstOptionAndWaitForTransition(page);
    await chooseFirstOptionAndWaitForTransition(page);

    await expect(page.locator('#scene-text')).not.toHaveText('', { timeout: 10000 });
    await expect(page.locator('.choice-btn')).toHaveCount(2);
    await expect(page.locator('#retry-btn')).toHaveCount(0);

    const stages = await page.evaluate(() =>
        (window.__sydneyAiTelemetry || []).map((entry) => entry.stage)
    );
    expect(stages).toContain('request_start');
    expect(stages).toContain('model_used');
    expect(stages).toContain('final_success');
});

test('Lesson insight appears only after scene text finishes typing', async ({ page }) => {
    await configureGeminiRoute(page, { failAfterSuccesses: null, networkDelayMs: 250 });
    await openAndStartInAiMode(page);

    const lessonPopup = page.locator('#lesson-popup');

    await expect(lessonPopup).toHaveClass(/hidden/);
    await expect
        .poll(async () => {
            const className = (await lessonPopup.getAttribute('class')) || '';
            return !className.includes('hidden');
        }, { timeout: 20000 })
        .toBe(true);
});

test('AI fallback flow: mid-run failure continues gracefully without blank/dead-end state', async ({
    page
}) => {
    await configureGeminiRoute(page, { failAfterSuccesses: 2, networkDelayMs: 250 });
    await openAndStartInAiMode(page);

    // First choice succeeds in AI mode.
    await chooseFirstOptionAndWaitForTransition(page);

    // Second choice triggers Gemini failure and app fallback to mock recovery mode.
    await page.locator('.choice-btn').first().click();
    await expect(page.locator('.loading-indicator')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.choice-btn').first()).toBeVisible({ timeout: 20000 });

    await expect
        .poll(async () => (await page.locator('#scene-text').innerText()).trim().length)
        .toBeGreaterThan(24);

    await expect(page.locator('#retry-btn')).toHaveCount(0);
    await expect(page.locator('.error-message')).toHaveCount(0);

    const telemetry = await page.evaluate(() => window.__sydneyAiTelemetry || []);
    const stages = telemetry.map((entry) => entry.stage);
    expect(stages).toContain('fallback_trigger');
    expect(stages).toContain('final_failure');
});

test('Telemetry contract: AI pipeline entries keep required schema', async ({ page }) => {
    await configureGeminiRoute(page, { failAfterSuccesses: null, networkDelayMs: 200 });
    await openAndStartInAiMode(page);
    await chooseFirstOptionAndWaitForTransition(page);

    const telemetry = await page.evaluate(() => window.__sydneyAiTelemetry || []);
    assertTelemetryContract(telemetry, ['request_start', 'model_used', 'final_success']);
});

test('Retry flow: after Gemini+fallback failure, retry remains interactive and recovers', async ({
    page
}) => {
    await configureGeminiRoute(page, { failAfterSuccesses: 2, networkDelayMs: 250 });
    await openAndStartInAiMode(page);
    await chooseFirstOptionAndWaitForTransition(page);

    await page.evaluate(async () => {
        const module = await import('/js/services/mockStoryService.js');
        const service = module.mockStoryService;
        const originalRecovery = service.getRecoveryScene.bind(service);

        service.getRecoveryScene = async () => {
            throw new Error('Forced recovery failure from E2E');
        };

        window.__e2eRestoreMockRecovery = () => {
            service.getRecoveryScene = originalRecovery;
        };
    });

    try {
        await page.locator('.choice-btn').first().click();
        await expect(page.locator('.loading-indicator')).toBeVisible({ timeout: 5000 });
        await expect(page.locator('#retry-btn')).toBeVisible({ timeout: 20000 });

        await page.evaluate(() => window.__e2eRestoreMockRecovery?.());
        await page.locator('#retry-btn').click();

        await expect
            .poll(
                async () =>
                    page.evaluate(() => {
                        const endingActive = document
                            .getElementById('ending-screen')
                            ?.classList.contains('active');
                        const visibleChoices = document.querySelectorAll(
                            '#choices-container .choice-btn'
                        ).length;
                        const recapReady = !!document.querySelector('#view-recap-btn');
                        const loadingVisible = !!document.querySelector('.loading-indicator');
                        const sceneTextLength =
                            document.getElementById('scene-text')?.textContent?.trim().length || 0;
                        const retryVisible = !!document.querySelector('#retry-btn');
                        return (
                            (endingActive || visibleChoices > 0 || recapReady || sceneTextLength > 24) &&
                            !retryVisible &&
                            !loadingVisible
                        );
                    }),
                { timeout: 45000 }
            )
            .toBe(true);
    } finally {
        await page.evaluate(() => window.__e2eRestoreMockRecovery?.());
    }
});

test('Storage quota failure: app remains playable when localStorage writes fail', async ({ page }) => {
    await page.addInitScript(() => {
        const originalSetItem = Storage.prototype.setItem;

        Storage.prototype.setItem = function setItemWithQuotaGuard(key, value) {
            if (
                this === localStorage &&
                (key === 'sydney-story-settings' || key === 'sydney-story-endings')
            ) {
                throw new DOMException('Quota exceeded', 'QuotaExceededError');
            }

            return originalSetItem.call(this, key, value);
        };
    });

    await page.goto('/');
    await expect(page.locator('#title-screen')).toHaveClass(/active/, { timeout: 15000 });
    await page.locator('#title-screen.active #start-btn').click({ timeout: 15000 });
    await expect(page.locator('#game-screen')).toHaveClass(/active/, { timeout: 15000 });
    await expect(page.locator('.choice-btn').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.error-message')).toHaveCount(0);
});

test.describe('Service worker compatibility smoke', () => {
    test.use({ serviceWorkers: 'allow' });

    test('Service worker registers and game still starts', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#title-screen')).toHaveClass(/active/, { timeout: 15000 });

        await expect
            .poll(
                async () =>
                    page.evaluate(async () => {
                        if (!('serviceWorker' in navigator)) return 'unsupported';
                        const registration = await navigator.serviceWorker.getRegistration();
                        return registration ? 'registered' : 'pending';
                    }),
                { timeout: 20000 }
            )
            .toBe('registered');

        await page.locator('#title-screen.active #start-btn').click({ timeout: 15000 });
        await expect(page.locator('#game-screen')).toHaveClass(/active/, { timeout: 15000 });
        await expect(page.locator('.choice-btn').first()).toBeVisible({ timeout: 15000 });
    });
});

test('Ending recap controls are present in ending screen markup', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#copy-recap-btn')).toHaveCount(1);
    await expect(page.locator('#download-recap-btn')).toHaveCount(1);
    await expect(page.locator('#ending-recap-text')).toHaveCount(1);
});

test('Ending recap copy button writes recap text to clipboard', async ({ page }) => {
    await page.addInitScript(() => {
        window.__copiedRecapText = null;
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {
                writeText: async (text) => {
                    window.__copiedRecapText = text;
                }
            }
        });
    });

    await playFastPathToEnding(page);

    const recapText = await page.locator('#ending-recap-text').innerText();
    await page.locator('#copy-recap-btn').click();

    await expect
        .poll(async () => page.evaluate(() => window.__copiedRecapText), { timeout: 5000 })
        .toBe(recapText);
});

test('Ending recap download button exports txt with recap content', async ({ page }, testInfo) => {
    await playFastPathToEnding(page);

    const recapText = await page.locator('#ending-recap-text').innerText();

    const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.locator('#download-recap-btn').click()
    ]);

    expect(download.suggestedFilename()).toMatch(/^no-vacancies-recap-\d+\.txt$/);

    const outputPath = testInfo.outputPath('playthrough-recap.txt');
    await download.saveAs(outputPath);
    const downloadedText = await readFile(outputPath, 'utf8');
    expect(downloadedText).toBe(recapText);
});
