import { test, expect } from '@playwright/test';

const GEMINI_ROUTE_GLOB = '**/v1beta/models/*:generateContent**';

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
    await expect(page.locator('#start-btn')).toBeVisible({ timeout: 15000 });

    await page.click('#settings-btn');
    await expect(page.locator('#settings-screen')).toHaveClass(/active/);

    await page.click('#mode-ai');
    await expect(page.locator('#mode-ai')).toHaveClass(/active/);

    const apiKeyInput = page.locator('#api-key-input');
    await apiKeyInput.fill('AIza-demo-key-for-e2e');
    await apiKeyInput.blur();

    await page.click('#settings-back-btn');
    await expect(page.locator('#title-screen')).toHaveClass(/active/);
    await expect(page.locator('#settings-screen')).not.toHaveClass(/active/);

    await page.locator('#title-screen.active #start-btn').click({ timeout: 15000 });
    await expect(page.locator('#game-screen')).toHaveClass(/active/, { timeout: 15000 });
    await expect(page.locator('.choice-btn').first()).toBeVisible({ timeout: 15000 });
}

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
