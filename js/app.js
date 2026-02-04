/**
 * No Vacancies - Main App Controller
 *
 * Orchestrates the game: state management, event handling, service coordination.
 */

import { createGameState, validateScene, mergeThreadUpdates } from './contracts.js';
import { lessons } from './lessons.js';
import { mockStoryService } from './services/mockStoryService.js';
import { emitAiTelemetry } from './services/aiTelemetry.js';
import {
    initRenderer,
    getElements,
    showScreen,
    renderScene,
    renderEnding,
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
let settings = {
    useMocks: true,
    showLessons: true,
    apiKey: ''
};
let storyService = mockStoryService;
let geminiService = null;
let isProcessing = false;

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
 * Load Gemini service dynamically
 */
async function loadGeminiService() {
    try {
        const module = await import('./services/geminiStoryService.js');
        geminiService = module.geminiStoryService;
        return geminiService;
    } catch (error) {
        console.warn('[App] Could not load Gemini service:', error);
        return null;
    }
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

    // Pre-load Gemini service
    loadGeminiService();

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
    try {
        const saved = localStorage.getItem('sydney-story-settings');
        if (saved) {
            const parsed = JSON.parse(saved);
            settings = { ...settings, ...parsed };
        }

        // Load unlocked endings
        const endings = localStorage.getItem('sydney-story-endings');
        if (endings) {
            settings.unlockedEndings = JSON.parse(endings);
        } else {
            settings.unlockedEndings = [];
        }
    } catch (error) {
        console.warn('[App] Could not load settings:', error);
    }
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
        'sydney-story-settings',
        JSON.stringify({
            useMocks: settings.useMocks,
            showLessons: settings.showLessons,
            apiKey: settings.apiKey
        })
    );
}

/**
 * Save unlocked endings
 */
function saveUnlockedEndings() {
    safeSetItem('sydney-story-endings', JSON.stringify(settings.unlockedEndings));
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
        
        // Basic validation
        if (key && !key.startsWith('AIza')) {
            console.warn('[App] API key may be invalid - expected format: AIza...');
            els.apiKeyInput.classList.add('invalid');
        } else {
            els.apiKeyInput.classList.remove('invalid');
        }
        
        settings.apiKey = key;
        saveSettings();
    });

    els.settingsBackBtn?.addEventListener('click', () => {
        showScreen('title');
    });

    // Game screen - choice selection (event delegation)
    els.choicesContainer?.addEventListener('click', async (e) => {
        const choiceBtn = e.target.closest('.choice-btn');
        if (choiceBtn) {
            const choiceId = choiceBtn.dataset.choiceId;
            await handleChoice(choiceId);
        }

        // Retry button
        if (e.target.id === 'retry-btn') {
            await retryLastChoice();
        }
    });

    // Lesson popup close
    els.closeLesson?.addEventListener('click', hideLessonPopup);

    // Ending screen
    els.playAgainBtn?.addEventListener('click', startGame);
    els.mainMenuBtn?.addEventListener('click', () => {
        showScreen('title');
    });
}

/**
 * Start a new game
 */
async function startGame() {
    console.log('[App] Starting new game...');

    // Create fresh game state
    gameState = createGameState();
    gameState.useMocks = settings.useMocks;
    gameState.apiKey = settings.apiKey;

    // Select story service
    if (settings.useMocks) {
        storyService = mockStoryService;
        console.log('[App] Using mock story service');
    } else {
        // Try to use Gemini service
        const gemini = await loadGeminiService();
        if (gemini && settings.apiKey) {
            gemini.setApiKey(settings.apiKey);
            storyService = gemini;
            console.log('[App] Using Gemini story service');
        } else {
            console.warn('[App] No API key or Gemini unavailable, falling back to mocks');
            storyService = mockStoryService;
            gameState.useMocks = true;
        }
    }

    // Get opening scene
    try {
        const openingScene = await storyService.getOpeningScene();

        if (!validateScene(openingScene)) {
            throw new Error('Invalid opening scene');
        }

        gameState.currentSceneId = openingScene.sceneId;
        gameState.sceneCount = 1;

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
 * @returns {Promise<boolean>} true if scene was successfully applied, false on failure
 */
async function handleChoice(choiceId) {
    if (!gameState || isProcessing) return false;
    isProcessing = true;

    console.log(`[App] Choice selected: ${choiceId}`);

    // Record choice in history
    gameState.history.push({
        sceneId: gameState.currentSceneId,
        choiceId: choiceId,
        timestamp: Date.now()
    });

    // Show loading state
    showChoicesLoading();
    const loadingTimers = startLoadingThresholdTimers();

    try {
        // Get next scene
        const nextScene = await storyService.getNextScene(
            gameState.currentSceneId,
            choiceId,
            gameState
        );

        if (!validateScene(nextScene)) {
            throw new Error('Invalid scene returned');
        }

        applyScene(nextScene);
        return true;
    } catch (error) {
        console.error('[App] Failed to get next scene:', error);

        // Auto-fallback to mock service if Gemini failed
        if (!gameState.useMocks && storyService !== mockStoryService) {
            console.warn('[App] Gemini unavailable, continuing in mock recovery mode');
            emitAiTelemetry('fallback_trigger', {
                fromService: 'gemini',
                toService: 'mock',
                reason: error?.name || 'gemini_unavailable'
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
 * Get a fallback scene from mock service when Gemini fails mid-game.
 * Handles incompatible scene IDs (Gemini IDs don't exist in mock graph).
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

    // Gemini scene ID not in mock graph — use recovery scene to keep playing
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

    // Update game state
    gameState.currentSceneId = scene.sceneId;
    gameState.sceneCount++;

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

    // First render the final scene briefly
    renderScene(endingScene, settings.showLessons);

    // Then show ending screen after a delay
    setTimeout(() => {
        renderEnding(endingScene.endingType, stats, settings.unlockedEndings);
        showScreen('ending');
    }, 3000);
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

    const success = await handleChoice(lastEntry.choiceId);
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
    getSettings: () => settings,
    getLessons: () => lessons
};
