/**
 * No Vacancies - Main App Controller
 *
 * Orchestrates the game: state management, event handling, service coordination.
 */

import {
    createGameState,
    DEFAULT_FEATURE_FLAGS,
    validateScene,
    mergeThreadUpdates,
    normalizeFeatureFlags,
    validatePlaythroughRecap,
    validateNarrativeContext
} from './contracts.js';
import { lessons } from './lessons.js';
import { buildNarrativeContext } from './prompts.js';
import { mockStoryService } from './services/mockStoryService.js';
import { emitAiTelemetry } from './services/aiTelemetry.js';
import { buildPlaythroughRecap } from './services/playthroughRecap.js';
import {
    initRenderer,
    getElements,
    showScreen,
    renderScene,
    renderEnding,
    renderEndingContinueButton,
    updateProgress,
    updateSettingsUI,
    toggleApiKeyVisibility,
    getApiKey,
    hideLessonPopup,
    showChoicesLoading,
    updateChoicesLoadingMessage,
    showError
} from './renderer.js';

/**
 * App State
 */
let gameState = null;
const settings = {
    useMocks: true,
    showLessons: true,
    apiKey: '',
    unlockedEndings: []
};
let storyService = mockStoryService;
let isProcessing = false;
let currentRecap = null;
let pendingEndingPayload = null;
const SETTINGS_STORAGE_KEY = 'sydney-story-settings';
const ENDINGS_STORAGE_KEY = 'sydney-story-endings';
const FEATURE_FLAGS_STORAGE_KEY = 'sydney-story-feature-flags';
const API_KEY_SESSION_KEY = 'sydney-story-api-key-session';
const API_KEY_PATTERN = /^(xai-)?[A-Za-z0-9_-]{20,160}$/;
const FEATURE_FLAG_QUERY_KEYS = Object.freeze({
    narrativeContextV2: 'ffNarrativeContextV2',
    transitionBridges: 'ffTransitionBridges'
});

/**
 * Normalize and validate an API key.
 * @param {string} value
 * @returns {string} normalized key or empty string if invalid
 */
function normalizeApiKey(value) {
    const normalized = typeof value === 'string' ? value.trim() : '';
    return API_KEY_PATTERN.test(normalized) ? normalized : '';
}

/**
 * Safely read a localStorage item.
 * @param {string} key
 * @returns {string|null}
 */
function safeGetItem(key) {
    try {
        return localStorage.getItem(key);
    } catch (error) {
        console.warn(`[App] localStorage read failed for '${key}':`, error.name);
        return null;
    }
}

/**
 * Parse common boolean flag strings.
 * @param {unknown} value
 * @returns {boolean|undefined}
 */
function parseBooleanFlag(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value !== 'string') return undefined;

    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'on', 'yes', 'enabled', 'enable'].includes(normalized)) return true;
    if (['0', 'false', 'off', 'no', 'disabled', 'disable'].includes(normalized)) return false;
    return undefined;
}

/**
 * Load persisted feature-flag overrides.
 * @returns {Partial<{narrativeContextV2: boolean, transitionBridges: boolean}>}
 */
function loadStoredFeatureFlags() {
    const saved = safeGetItem(FEATURE_FLAGS_STORAGE_KEY);
    if (!saved) return {};

    try {
        const parsed = JSON.parse(saved);
        if (!parsed || typeof parsed !== 'object') return {};

        return normalizeFeatureFlags({
            narrativeContextV2: parseBooleanFlag(parsed.narrativeContextV2),
            transitionBridges: parseBooleanFlag(parsed.transitionBridges)
        });
    } catch (error) {
        console.warn('[App] Could not parse saved feature flags:', error);
        return {};
    }
}

/**
 * Parse URL query flag overrides for runtime testing/operations.
 * Supported keys: ffNarrativeContextV2, ffTransitionBridges
 * @returns {Partial<{narrativeContextV2: boolean, transitionBridges: boolean}>}
 */
function loadQueryFeatureFlags() {
    try {
        const params = new URLSearchParams(window.location.search);
        const narrativeContextRaw = params.get(FEATURE_FLAG_QUERY_KEYS.narrativeContextV2);
        const transitionBridgesRaw = params.get(FEATURE_FLAG_QUERY_KEYS.transitionBridges);

        return {
            ...(parseBooleanFlag(narrativeContextRaw) !== undefined
                ? { narrativeContextV2: parseBooleanFlag(narrativeContextRaw) }
                : {}),
            ...(parseBooleanFlag(transitionBridgesRaw) !== undefined
                ? { transitionBridges: parseBooleanFlag(transitionBridgesRaw) }
                : {})
        };
    } catch (error) {
        console.warn('[App] Could not parse query feature flags:', error);
        return {};
    }
}

/**
 * Resolve effective runtime feature flags in precedence order:
 * defaults < persisted overrides < query overrides.
 * @returns {{narrativeContextV2: boolean, transitionBridges: boolean}}
 */
function resolveRuntimeFeatureFlags() {
    const resolved = normalizeFeatureFlags({
        ...DEFAULT_FEATURE_FLAGS,
        ...loadStoredFeatureFlags(),
        ...loadQueryFeatureFlags()
    });
    return resolved;
}

/**
 * Persist runtime feature-flag overrides for future sessions.
 * @param {Partial<{narrativeContextV2: boolean, transitionBridges: boolean}>} overrides
 */
function saveFeatureFlagOverrides(overrides) {
    const normalized = normalizeFeatureFlags(overrides || {});
    safeSetItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(normalized));
}

/**
 * Clear persisted feature-flag overrides.
 */
function clearFeatureFlagOverrides() {
    try {
        localStorage.removeItem(FEATURE_FLAGS_STORAGE_KEY);
    } catch (error) {
        console.warn('[App] localStorage remove failed for feature flags:', error.name);
    }
}

/**
 * Persist API key to sessionStorage only (not localStorage).
 * @param {string} apiKey
 */
function saveSessionApiKey(apiKey) {
    try {
        if (apiKey) {
            sessionStorage.setItem(API_KEY_SESSION_KEY, apiKey);
        } else {
            sessionStorage.removeItem(API_KEY_SESSION_KEY);
        }
    } catch (error) {
        console.warn('[App] sessionStorage write failed for API key:', error.name);
    }
}

/**
 * Load API key from sessionStorage.
 * @returns {string}
 */
function loadSessionApiKey() {
    try {
        return sessionStorage.getItem(API_KEY_SESSION_KEY) || '';
    } catch (error) {
        console.warn('[App] sessionStorage read failed for API key:', error.name);
        return '';
    }
}

/**
 * Validate choice IDs to prevent malformed or hostile input from UI tampering.
 * @param {string} choiceId
 * @returns {boolean}
 */
function isValidChoiceId(choiceId) {
    return typeof choiceId === 'string' && /^[a-z0-9_-]{1,80}$/i.test(choiceId);
}

/**
 * Build loading message timers for long AI calls.
 * @returns {number[]}
 */
function startLoadingThresholdTimers() {
    const timerIds = [];
    timerIds.push(
        setTimeout(() => {
            updateChoicesLoadingMessage('Still writing the next scene...');
        }, 6000)
    );
    timerIds.push(
        setTimeout(() => {
            updateChoicesLoadingMessage('Taking longer than usual. Thanks for waiting...');
        }, 12000)
    );
    return timerIds;
}

/**
 * Clear active loading timers.
 * @param {number[]} timerIds
 */
function clearLoadingThresholdTimers(timerIds) {
    timerIds.forEach((id) => clearTimeout(id));
}

/**
 * Initialize the application
 */
async function init() {
    console.log('[App] Initializing...');

    // Initialize renderer
    initRenderer();

    // Load settings from localStorage
    loadSettings();

    // Bind event listeners
    bindEvents();

    // Register service worker
    registerServiceWorker();

    // Show title screen after brief loading
    setTimeout(() => {
        showScreen('title');
    }, 1500);

    console.log('[App] Initialized successfully');
}

/**
 * Load settings from localStorage
 */
function loadSettings() {
    const saved = safeGetItem(SETTINGS_STORAGE_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            settings.useMocks = typeof parsed.useMocks === 'boolean' ? parsed.useMocks : settings.useMocks;
            settings.showLessons =
                typeof parsed.showLessons === 'boolean' ? parsed.showLessons : settings.showLessons;
        } catch (error) {
            console.warn('[App] Could not parse saved settings:', error);
        }
    }

    settings.apiKey = normalizeApiKey(loadSessionApiKey());
    settings.unlockedEndings = [];

    // Load unlocked endings
    const endings = safeGetItem(ENDINGS_STORAGE_KEY);
    if (endings) {
        try {
            const parsedEndings = JSON.parse(endings);
            if (Array.isArray(parsedEndings)) {
                settings.unlockedEndings = parsedEndings.filter(
                    (ending) => typeof ending === 'string' && ending.trim().length > 0
                );
            }
        } catch (error) {
            console.warn('[App] Could not parse saved endings:', error);
        }
    }

    // Remove legacy API key persistence if present.
    saveSettings();
}

/**
 * Safe localStorage write with quota detection
 * @param {string} key
 * @param {string} value
 * @returns {boolean} true if write succeeded
 */
function safeSetItem(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (error) {
        console.warn(`[App] localStorage write failed for '${key}':`, error.name);
        if (error.name === 'QuotaExceededError') {
            console.warn('[App] Storage quota exceeded');
        }
        return false;
    }
}

/**
 * Save settings to localStorage
 */
function saveSettings() {
    safeSetItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify({
            useMocks: settings.useMocks,
            showLessons: settings.showLessons
        })
    );
}

/**
 * Save unlocked endings
 */
function saveUnlockedEndings() {
    safeSetItem(ENDINGS_STORAGE_KEY, JSON.stringify(settings.unlockedEndings));
}

/**
 * Bind event listeners
 */
function bindEvents() {
    const els = getElements();

    // Title screen
    els.startBtn?.addEventListener('click', startGame);
    els.settingsBtn?.addEventListener('click', () => {
        updateSettingsUI(settings);
        showScreen('settings');
    });

    // Settings screen
    els.modeMock?.addEventListener('click', () => {
        settings.useMocks = true;
        updateSettingsUI(settings);
        saveSettings();
    });

    els.modeAi?.addEventListener('click', () => {
        settings.useMocks = false;
        updateSettingsUI(settings);
        saveSettings();
    });

    els.lessonsOn?.addEventListener('click', () => {
        settings.showLessons = true;
        updateSettingsUI(settings);
        saveSettings();
    });

    els.lessonsOff?.addEventListener('click', () => {
        settings.showLessons = false;
        updateSettingsUI(settings);
        saveSettings();
    });

    els.toggleKeyVisibility?.addEventListener('click', toggleApiKeyVisibility);

    els.apiKeyInput?.addEventListener('change', () => {
        const key = getApiKey();
        const normalizedKey = normalizeApiKey(key);

        if (key && !normalizedKey) {
            console.warn('[App] API key appears invalid.');
            els.apiKeyInput.classList.add('invalid');
            settings.apiKey = '';
            saveSessionApiKey('');
        } else {
            els.apiKeyInput.classList.remove('invalid');
            settings.apiKey = normalizedKey;
            saveSessionApiKey(normalizedKey);
        }

        saveSettings();
    });

    els.settingsBackBtn?.addEventListener('click', () => {
        showScreen('title');
    });

    // Game screen - choice selection (event delegation)
    els.choicesContainer?.addEventListener('click', async (e) => {
        const recapButton = e.target.closest('#view-recap-btn');
        if (recapButton) {
            showEndingRecapScreen();
            return;
        }

        // Retry button
        if (e.target.id === 'retry-btn') {
            await retryLastChoice();
            return;
        }

        const choiceBtn = e.target.closest('.choice-btn');
        if (choiceBtn) {
            const choiceId = choiceBtn.dataset.choiceId;
            const choiceText = (choiceBtn.textContent || '').trim();
            await handleChoice(choiceId, choiceText);
        }
    });

    // Lesson popup close
    els.closeLesson?.addEventListener('click', hideLessonPopup);

    // Ending screen
    els.playAgainBtn?.addEventListener('click', startGame);
    els.mainMenuBtn?.addEventListener('click', () => {
        showScreen('title');
    });
    els.copyRecapBtn?.addEventListener('click', copyCurrentRecap);
    els.downloadRecapBtn?.addEventListener('click', downloadCurrentRecap);
}

/**
 * Start a new game
 */
async function startGame() {
    console.log('[App] Starting new game...');
    currentRecap = null;
    pendingEndingPayload = null;

    // Create fresh game state
    gameState = createGameState(resolveRuntimeFeatureFlags());
    gameState.useMocks = settings.useMocks;
    gameState.apiKey = settings.apiKey;
    console.log('[App] Runtime feature flags:', gameState.featureFlags);

    // Select story service
    if (settings.useMocks) {
        storyService = mockStoryService;
        console.log('[App] Using mock story service');
    } else {
        console.warn('[App] Legacy runtime does not provide an AI adapter. Falling back to mock mode.');
        storyService = mockStoryService;
        gameState.useMocks = true;
    }

    // Get opening scene
    try {
        const openingScene = await storyService.getOpeningScene();

        if (!validateScene(openingScene)) {
            throw new Error('Invalid opening scene');
        }

        gameState.currentSceneId = openingScene.sceneId;
        gameState.sceneCount = 1;
        gameState.pendingTransitionBridge = null;
        gameState.sceneLog = [
            {
                sceneId: openingScene.sceneId,
                sceneText: openingScene.sceneText || '',
                viaChoiceText: '',
                isEnding: !!openingScene.isEnding
            }
        ];

        // Track lesson
        if (openingScene.lessonId) {
            gameState.lessonsEncountered.push(openingScene.lessonId);
        }

        // Show game screen and render scene
        showScreen('game');
        renderScene(openingScene, settings.showLessons);
        updateProgress(gameState.sceneCount);

        console.log('[App] Game started with scene:', openingScene.sceneId);
    } catch (error) {
        console.error('[App] Failed to start game:', error);
        showError('Failed to start the story. Please try again.');
    }
}

/**
 * Handle a choice selection
 * @param {string} choiceId
 * @param {string} [choiceText]
 * @returns {Promise<boolean>} true if scene was successfully applied, false on failure
 */
async function handleChoice(choiceId, choiceText = '') {
    if (!gameState || isProcessing) return false;
    if (!isValidChoiceId(choiceId)) {
        console.warn('[App] Rejected invalid choice ID:', choiceId);
        showError('Invalid choice input. Please try again.');
        return false;
    }
    isProcessing = true;

    console.log(`[App] Choice selected: ${choiceId}`);

    // Record choice in history
    gameState.history.push({
        sceneId: gameState.currentSceneId,
        choiceId: choiceId,
        choiceText: typeof choiceText === 'string' ? choiceText : '',
        timestamp: Date.now()
    });

    const previousThreads = {
        ...gameState.storyThreads,
        boundariesSet: [...gameState.storyThreads.boundariesSet]
    };

    // Show loading state
    showChoicesLoading();
    const loadingTimers = startLoadingThresholdTimers();

    try {
        const useNarrativeContext = !!gameState.featureFlags?.narrativeContextV2;
        let narrativeContext = null;

        if (useNarrativeContext) {
            const candidateContext = buildNarrativeContext(gameState, {
                lastChoiceText: choiceText
            });

            if (validateNarrativeContext(candidateContext)) {
                narrativeContext = candidateContext;
                emitAiTelemetry('context_built', {
                    contextChars: narrativeContext.meta.contextChars,
                    budgetChars: narrativeContext.meta.budgetChars,
                    truncated: narrativeContext.meta.truncated,
                    recentSceneCount: narrativeContext.recentSceneProse.length,
                    olderSummaryCount: narrativeContext.olderSceneSummaries.length
                });

                if (narrativeContext.meta.truncated) {
                    emitAiTelemetry('context_truncated', {
                        droppedOlderSummaries: narrativeContext.meta.droppedOlderSummaries,
                        droppedRecentProse: narrativeContext.meta.droppedRecentProse
                    });
                }

            } else {
                console.warn('[App] NarrativeContext validation failed; falling back to legacy prompt path');
            }
        }

        // Get next scene
        const nextScene = await storyService.getNextScene(
            gameState.currentSceneId,
            choiceId,
            gameState,
            narrativeContext,
            {
                useNarrativeContext: !!narrativeContext,
                previousThreads,
                enableTransitionBridges: !!gameState.featureFlags?.transitionBridges
            }
        );

        if (!validateScene(nextScene)) {
            throw new Error('Invalid scene returned');
        }

        applyScene(nextScene);
        return true;
    } catch (error) {
        console.error('[App] Failed to get next scene:', error);

        // Auto-fallback to mock service if non-mock provider failed
        if (!gameState.useMocks && storyService !== mockStoryService) {
            console.warn('[App] Provider unavailable, continuing in mock recovery mode');
            updateChoicesLoadingMessage('AI is unavailable. Switching to backup story mode...');
            emitAiTelemetry('fallback_trigger', {
                fromService: 'ai-provider',
                toService: 'mock',
                reason: error?.name || 'provider_unavailable'
            });
            storyService = mockStoryService;
            gameState.useMocks = true;

            try {
                const fallbackScene = await getFallbackScene(choiceId);
                if (!validateScene(fallbackScene)) {
                    throw new Error('Invalid fallback scene');
                }
                applyScene(fallbackScene);
                return true;
            } catch (fallbackError) {
                console.error('[App] Mock fallback also failed:', fallbackError);
                showError('Something went wrong. Please try again.');
                return false;
            }
        } else {
            showError('Something went wrong. Please try again.');
            return false;
        }
    } finally {
        clearLoadingThresholdTimers(loadingTimers);
        isProcessing = false;
    }
}

/**
 * Get a fallback scene from mock service when AI fails mid-game.
 * Handles incompatible scene IDs (external provider IDs don't exist in mock graph).
 * @param {string} choiceId
 * @returns {Promise<import('./contracts.js').Scene>}
 */
async function getFallbackScene(choiceId) {
    // Check if current scene ID exists in mock service
    const mockScene = mockStoryService.getSceneById(gameState.currentSceneId);

    if (mockScene) {
        // Scene exists in mock graph — continue from it
        return mockStoryService.getNextScene(gameState.currentSceneId, choiceId, gameState);
    }

    // External scene ID not in mock graph — use recovery scene to keep playing
    console.warn('[App] Scene ID incompatible with mock service, using recovery scene');
    return mockStoryService.getRecoveryScene();
}

/**
 * Apply a validated scene to game state and render it
 * @param {import('./contracts.js').Scene} scene
 */
function applyScene(scene) {
    // Merge story thread updates
    if (scene.storyThreadUpdates) {
        console.log('[App] Updating story threads:', scene.storyThreadUpdates);
        gameState.storyThreads = mergeThreadUpdates(
            gameState.storyThreads,
            scene.storyThreadUpdates
        );
        console.log('[App] Updated threads:', gameState.storyThreads);
    }

    // Transition bridge handling moved to same-turn AI generation checks.
    // Keep pending field empty to avoid one-turn-late bridge injection.
    gameState.pendingTransitionBridge = null;

    // Update game state
    gameState.currentSceneId = scene.sceneId;
    gameState.sceneCount++;

    const lastHistoryEntry = gameState.history[gameState.history.length - 1];
    const viaChoiceText = lastHistoryEntry?.choiceText || '';
    if (!Array.isArray(gameState.sceneLog)) {
        gameState.sceneLog = [];
    }
    gameState.sceneLog.push({
        sceneId: scene.sceneId,
        sceneText: scene.sceneText || '',
        viaChoiceText,
        isEnding: !!scene.isEnding
    });

    // Track lesson
    if (scene.lessonId && !gameState.lessonsEncountered.includes(scene.lessonId)) {
        gameState.lessonsEncountered.push(scene.lessonId);
    }

    // Check for ending
    if (scene.isEnding) {
        handleEnding(scene);
    } else {
        renderScene(scene, settings.showLessons);
        updateProgress(gameState.sceneCount);
    }
}

/**
 * Handle game ending
 * @param {import('./contracts.js').Scene} endingScene
 */
function handleEnding(endingScene) {
    console.log(`[App] Game ended with: ${endingScene.endingType}`);

    // Unlock this ending
    if (!settings.unlockedEndings.includes(endingScene.endingType)) {
        settings.unlockedEndings.push(endingScene.endingType);
        saveUnlockedEndings();
    }

    // Calculate stats
    const duration = Date.now() - gameState.startTime;
    const stats = {
        sceneCount: gameState.sceneCount,
        lessonsCount: gameState.lessonsEncountered.length,
        duration: duration
    };

    const builtRecap = buildPlaythroughRecap({
        gameState,
        endingScene,
        unlockedEndings: settings.unlockedEndings,
        now: Date.now()
    });
    currentRecap = validatePlaythroughRecap(builtRecap)
        ? builtRecap
        : {
              text: 'Recap unavailable for this run.'
          };

    pendingEndingPayload = {
        endingType: endingScene.endingType,
        stats,
        unlockedEndings: [...settings.unlockedEndings],
        recap: currentRecap,
        sceneId: endingScene.sceneId
    };

    // Render the ending scene text first, then allow user-controlled recap transition.
    const renderComplete = renderScene(endingScene, settings.showLessons);
    Promise.resolve(renderComplete)
        .then((finished) => {
            if (!finished || !pendingEndingPayload) return;
            if (pendingEndingPayload.sceneId !== endingScene.sceneId) return;
            renderEndingContinueButton();
        })
        .catch((error) => {
            console.warn('[App] Ending scene render completion check failed:', error?.name || error);
            if (pendingEndingPayload?.sceneId === endingScene.sceneId) {
                renderEndingContinueButton();
            }
        });
}

function showEndingRecapScreen() {
    if (!pendingEndingPayload) return;

    renderEnding(
        pendingEndingPayload.endingType,
        pendingEndingPayload.stats,
        pendingEndingPayload.unlockedEndings,
        pendingEndingPayload.recap
    );
    showScreen('ending');
    pendingEndingPayload = null;
}

async function copyCurrentRecap() {
    if (!currentRecap?.text) {
        return;
    }

    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(currentRecap.text);
            return;
        }
    } catch (error) {
        console.warn('[App] Clipboard API failed, falling back to legacy copy:', error?.name);
    }

    try {
        const textarea = document.createElement('textarea');
        textarea.value = currentRecap.text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    } catch (error) {
        console.warn('[App] Legacy copy failed:', error?.name || error);
    }
}

function downloadCurrentRecap() {
    if (!currentRecap?.text) {
        return;
    }

    const blob = new Blob([currentRecap.text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    try {
        const link = document.createElement('a');
        link.href = url;
        link.download = `no-vacancies-recap-${Date.now()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } finally {
        URL.revokeObjectURL(url);
    }
}

/**
 * Retry the last choice (for error recovery)
 */
async function retryLastChoice() {
    if (!gameState || gameState.history.length === 0) {
        startGame();
        return;
    }

    const lastEntry = gameState.history[gameState.history.length - 1];
    const historyBackup = [...gameState.history];
    gameState.history.pop();

    const success = await handleChoice(lastEntry.choiceId, lastEntry.choiceText || '');
    if (!success) {
        gameState.history = historyBackup;
    }
}

/**
 * Register service worker for PWA
 */
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('[App] Service worker registered:', registration.scope);
        } catch (error) {
            console.warn('[App] Service worker registration failed:', error);
        }
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for debugging
window.sydneyStory = {
    getState: () => gameState,
    getSettings: () => ({
        useMocks: settings.useMocks,
        showLessons: settings.showLessons,
        unlockedEndings: [...settings.unlockedEndings],
        apiKeySet: !!settings.apiKey
    }),
    getLessons: () => lessons,
    getFeatureFlags: () => ({ ...(gameState?.featureFlags || resolveRuntimeFeatureFlags()) }),
    setFeatureFlags: (overrides = {}) => {
        saveFeatureFlagOverrides(overrides);
        return resolveRuntimeFeatureFlags();
    },
    clearFeatureFlags: () => {
        clearFeatureFlagOverrides();
        return resolveRuntimeFeatureFlags();
    }
};
