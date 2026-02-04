/**
 * No Vacancies - Renderer
 *
 * Handles all DOM manipulation and UI updates.
 * Keeps app.js clean by separating concerns.
 */

import { getLessonById } from './lessons.js';
import { EndingTypes, ImageKeys } from './contracts.js';

/**
 * Image paths mapping
 */
export const imagePaths = {
    [ImageKeys.HOTEL_ROOM]: 'images/hotel_room.png',
    [ImageKeys.SYDNEY_LAPTOP]: 'images/sydney_laptop.png',
    [ImageKeys.SYDNEY_THINKING]: 'images/sydney_thinking.png',
    [ImageKeys.SYDNEY_FRUSTRATED]: 'images/sydney_frustrated.png',
    [ImageKeys.SYDNEY_TIRED]: 'images/sydney_tired.png',
    [ImageKeys.SYDNEY_PHONE]: 'images/sydney_phone_anxious.png',
    [ImageKeys.SYDNEY_COFFEE]: 'images/sydney_coffee_morning.png',
    [ImageKeys.SYDNEY_WINDOW]: 'images/sydney_window_dawn.png',
    [ImageKeys.OSWALDO_SLEEPING]: 'images/oswaldo_sleeping.png',
    [ImageKeys.OSWALDO_AWAKE]: 'images/oswaldo_awake.png',
    [ImageKeys.THE_DOOR]: 'images/the_door.png',
    [ImageKeys.EMPTY_ROOM]: 'images/empty_room.png',
    [ImageKeys.MOTEL_EXTERIOR]: 'images/motel_exterior.png'
};

/**
 * Ending configuration
 */
const endingConfig = {
    loop: {
        icon: '🔄',
        title: 'The Loop',
        subtitle: "Nothing changed. But you're awake now.",
        color: 'var(--color-ending-loop)'
    },
    shift: {
        icon: '⚖️',
        title: 'The Shift',
        subtitle: 'Small boundaries. Uncomfortable but hopeful.',
        color: 'var(--color-ending-shift)'
    },
    exit: {
        icon: '🚪',
        title: 'The Exit',
        subtitle: "You left. You don't know where. But you're not carrying them anymore.",
        color: 'var(--color-ending-exit)'
    },
    rare: {
        icon: '✨',
        title: 'The Rare',
        subtitle: 'He saw it. He actually saw it.',
        color: 'var(--color-ending-rare)'
    }
};

/**
 * Cache DOM elements
 */
const elements = {
    // State
    currentTypewriterController: null,

    // Screens
    loadingScreen: null,
    titleScreen: null,
    settingsScreen: null,
    gameScreen: null,
    endingScreen: null,

    // Title screen
    startBtn: null,
    settingsBtn: null,

    // Settings screen
    modeMock: null,
    modeAi: null,
    apiKeySection: null,
    apiKeyInput: null,
    toggleKeyVisibility: null,
    lessonsOn: null,
    lessonsOff: null,
    settingsBackBtn: null,

    // Game screen
    sceneImage: null,
    progressFill: null,
    sceneText: null,
    lessonPopup: null,
    lessonTitle: null,
    lessonQuote: null,
    closeLesson: null,
    choicesContainer: null,

    // Ending screen
    endingBadge: null,
    endingTitle: null,
    endingSubtitle: null,
    scenesCount: null,
    lessonsCount: null,
    timePlayed: null,
    playAgainBtn: null,
    mainMenuBtn: null
};

/**
 * Initialize DOM element cache
 */
export function initRenderer() {
    // Screens
    elements.loadingScreen = document.getElementById('loading-screen');
    elements.titleScreen = document.getElementById('title-screen');
    elements.settingsScreen = document.getElementById('settings-screen');
    elements.gameScreen = document.getElementById('game-screen');
    elements.endingScreen = document.getElementById('ending-screen');

    // Title screen
    elements.startBtn = document.getElementById('start-btn');
    elements.settingsBtn = document.getElementById('settings-btn');

    // Settings screen
    elements.modeMock = document.getElementById('mode-mock');
    elements.modeAi = document.getElementById('mode-ai');
    elements.apiKeySection = document.getElementById('api-key-section');
    elements.apiKeyInput = document.getElementById('api-key-input');
    elements.toggleKeyVisibility = document.getElementById('toggle-key-visibility');
    elements.lessonsOn = document.getElementById('lessons-on');
    elements.lessonsOff = document.getElementById('lessons-off');
    elements.settingsBackBtn = document.getElementById('settings-back-btn');

    // Game screen
    elements.sceneImage = document.getElementById('scene-image');
    elements.progressFill = document.getElementById('progress-fill');
    elements.sceneText = document.getElementById('scene-text');
    if (elements.sceneText && !elements.sceneText.hasAttribute('tabindex')) {
        elements.sceneText.setAttribute('tabindex', '-1');
    }
    elements.lessonPopup = document.getElementById('lesson-popup');
    elements.lessonTitle = document.getElementById('lesson-title');
    elements.lessonQuote = document.getElementById('lesson-quote');
    elements.closeLesson = document.getElementById('close-lesson');
    elements.choicesContainer = document.getElementById('choices-container');

    // Ending screen
    elements.endingBadge = document.getElementById('ending-badge');
    elements.endingTitle = document.getElementById('ending-title');
    elements.endingSubtitle = document.getElementById('ending-subtitle');
    elements.scenesCount = document.getElementById('scenes-count');
    elements.lessonsCount = document.getElementById('lessons-count');
    elements.timePlayed = document.getElementById('time-played');
    elements.playAgainBtn = document.getElementById('play-again-btn');
    elements.mainMenuBtn = document.getElementById('main-menu-btn');

    console.log('[Renderer] Initialized');
}

/**
 * Get cached elements for event binding
 * @returns {Object}
 */
export function getElements() {
    return elements;
}

/**
 * Focus an element on the next frame for predictable screen-reader/keyboard flow.
 * @param {HTMLElement|null} element
 */
function focusElement(element) {
    if (!element || typeof element.focus !== 'function') return;

    const runFocus = () => {
        try {
            element.focus({ preventScroll: true });
        } catch {
            element.focus();
        }
    };

    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(runFocus);
    } else {
        setTimeout(runFocus, 0);
    }
}

/**
 * Focus scene text when there are no interactive controls available.
 */
function focusSceneTextFallback() {
    if (!elements.sceneText) return;

    // Keep this out of normal tab order while allowing programmatic focus.
    if (!elements.sceneText.hasAttribute('tabindex')) {
        elements.sceneText.setAttribute('tabindex', '-1');
    }

    focusElement(elements.sceneText);
}

/**
 * Show a specific screen
 * @param {string} screenName - 'loading' | 'title' | 'settings' | 'game' | 'ending'
 */
export function showScreen(screenName) {
    const screens = [
        elements.loadingScreen,
        elements.titleScreen,
        elements.settingsScreen,
        elements.gameScreen,
        elements.endingScreen
    ];

    screens.forEach((screen) => {
        if (screen) screen.classList.remove('active');
    });

    const screenMap = {
        loading: elements.loadingScreen,
        title: elements.titleScreen,
        settings: elements.settingsScreen,
        game: elements.gameScreen,
        ending: elements.endingScreen
    };

    const targetScreen = screenMap[screenName];
    if (targetScreen) {
        targetScreen.classList.add('active');
        console.log(`[Renderer] Showing screen: ${screenName}`);

        if (screenName === 'title') {
            focusElement(elements.startBtn);
        } else if (screenName === 'settings') {
            focusElement(elements.settingsBackBtn || elements.modeMock);
        } else if (screenName === 'game') {
            focusSceneTextFallback();
        } else if (screenName === 'ending') {
            focusElement(elements.playAgainBtn);
        }
    }
}

/**
 * Render a scene to the game screen
 * @param {import('./contracts.js').Scene} scene
 * @param {boolean} showLessons - Whether to show lesson popups
 */
export function renderScene(scene, showLessons = true) {
    if (!scene) {
        console.error('[Renderer] No scene to render');
        return;
    }

    // Update image
    const imagePath = imagePaths[scene.imageKey] || imagePaths[ImageKeys.HOTEL_ROOM];
    if (elements.sceneImage) {
        elements.sceneImage.classList.add('loading');
        elements.sceneImage.src = imagePath;
        elements.sceneImage.onload = () => {
            elements.sceneImage.classList.remove('loading');
        };
    }

    // Update scene text
    if (elements.sceneText) {
        // Clear previous content
        elements.sceneText.innerHTML = '';
        const text = scene.sceneText;
        
        // Use typewriter effect
        if (elements.currentTypewriterController) {
            elements.currentTypewriterController.abort();
        }
        elements.currentTypewriterController = new AbortController();
        typewriterEffect(elements.sceneText, text, 20, elements.currentTypewriterController.signal);
        elements.sceneText.scrollTop = 0;
    }

    // Handle lesson popup
    if (scene.lessonId && showLessons) {
        const lesson = getLessonById(scene.lessonId);
        if (lesson) {
            showLessonPopup(lesson);
        }
    } else {
        hideLessonPopup();
    }

    // Render choices
    renderChoices(scene.choices, scene.isEnding);

    console.log(`[Renderer] Rendered scene: ${scene.sceneId}`);
}

/**
 * Render choice buttons
 * @param {import('./contracts.js').Choice[]} choices
 * @param {boolean} isEnding
 */
function renderChoices(choices, isEnding) {
    if (!elements.choicesContainer) return;

    elements.choicesContainer.innerHTML = '';

    if (isEnding || !choices || choices.length === 0) {
        // No choices for endings - they're handled by the ending screen.
        // For non-ending states (loading/errors), keep keyboard focus in game content.
        if (!isEnding) {
            focusSceneTextFallback();
        }
        return;
    }

    choices.forEach((choice, index) => {
        const button = document.createElement('button');
        button.className = 'choice-btn slide-up';
        button.style.animationDelay = `${index * 100}ms`;
        button.dataset.choiceId = choice.id;
        button.textContent = choice.text;
        button.setAttribute('aria-label', `Choice ${index + 1}: ${choice.text}`);

        elements.choicesContainer.appendChild(button);
    });

    const firstChoice = elements.choicesContainer.querySelector('.choice-btn');
    focusElement(firstChoice);
}

/**
 * Show lesson popup
 * @param {import('./contracts.js').Lesson} lesson
 */
function showLessonPopup(lesson) {
    if (!elements.lessonPopup) return;

    elements.lessonTitle.textContent = lesson.title;
    elements.lessonQuote.textContent = `"${lesson.quote}"`;
    elements.lessonPopup.classList.remove('hidden');
}

/**
 * Hide lesson popup
 */
export function hideLessonPopup() {
    if (elements.lessonPopup) {
        elements.lessonPopup.classList.add('hidden');
    }
}

/**
 * Update progress bar
 * @param {number} sceneCount
 * @param {number} maxScenes - Estimated max scenes for a typical playthrough (~15 min at ~1 min/scene)
 */
export function updateProgress(sceneCount, maxScenes = 15) {
    if (!elements.progressFill) return;

    const progress = Math.min((sceneCount / maxScenes) * 100, 100);
    elements.progressFill.style.width = `${progress}%`;
}

/**
 * Format a custom ending type as a display title
 * @param {string} endingType - e.g., "cold clarity"
 * @returns {string} - e.g., "Cold Clarity"
 */
function formatEndingTitle(endingType) {
    return endingType
        .split(/[\s_]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Render ending screen
 * @param {string} endingType - 'loop' | 'shift' | 'exit' | 'rare' | custom phrase
 * @param {Object} stats - { sceneCount, lessonsCount, duration }
 * @param {string[]} unlockedEndings - Array of ending types unlocked
 */
export function renderEnding(endingType, stats, unlockedEndings) {
    // Check if it's a known ending or custom
    const config = endingConfig[endingType] || {
        // Default config for custom endings
        icon: '🌙',
        title: formatEndingTitle(endingType),
        subtitle: 'Your story found its own ending.',
        color: 'var(--color-text-secondary)'
    };

    // Update badge
    if (elements.endingBadge) {
        elements.endingBadge.innerHTML = config.icon;
        elements.endingBadge.dataset.ending = endingType;
    }

    // Update title and subtitle
    if (elements.endingTitle) {
        elements.endingTitle.textContent = config.title;
        elements.endingTitle.style.color = config.color;
    }

    if (elements.endingSubtitle) {
        elements.endingSubtitle.textContent = config.subtitle;
    }

    // Update stats
    if (elements.scenesCount) {
        elements.scenesCount.textContent = stats.sceneCount || 0;
    }

    if (elements.lessonsCount) {
        elements.lessonsCount.textContent = stats.lessonsCount || 0;
    }

    if (elements.timePlayed) {
        elements.timePlayed.textContent = formatDuration(stats.duration || 0);
    }

    // Update ending badges
    updateEndingBadges(unlockedEndings);

    console.log(`[Renderer] Rendered ending: ${endingType}`);
}

/**
 * Update the ending badges grid
 * @param {string[]} unlockedEndings
 */
function updateEndingBadges(unlockedEndings) {
    const endings = Object.values(EndingTypes);

    endings.forEach((ending) => {
        const badge = document.getElementById(`ending-${ending}-badge`);
        if (badge) {
            if (unlockedEndings.includes(ending)) {
                badge.classList.remove('locked');
                badge.classList.add('unlocked');
            } else {
                badge.classList.add('locked');
                badge.classList.remove('unlocked');
            }
        }
    });
}

/**
 * Update settings UI
 * @param {Object} settings - { useMocks, showLessons, apiKey }
 */
export function updateSettingsUI(settings) {
    // Mode toggle
    if (settings.useMocks) {
        elements.modeMock?.classList.add('active');
        elements.modeAi?.classList.remove('active');
        elements.apiKeySection?.classList.add('hidden');
    } else {
        elements.modeMock?.classList.remove('active');
        elements.modeAi?.classList.add('active');
        elements.apiKeySection?.classList.remove('hidden');
    }

    // Lessons toggle
    if (settings.showLessons) {
        elements.lessonsOn?.classList.add('active');
        elements.lessonsOff?.classList.remove('active');
    } else {
        elements.lessonsOn?.classList.remove('active');
        elements.lessonsOff?.classList.add('active');
    }

    // API key
    if (elements.apiKeyInput && settings.apiKey) {
        elements.apiKeyInput.value = settings.apiKey;
    }
}

/**
 * Toggle API key visibility
 */
export function toggleApiKeyVisibility() {
    if (!elements.apiKeyInput || !elements.toggleKeyVisibility) return;

    const isPassword = elements.apiKeyInput.type === 'password';
    elements.apiKeyInput.type = isPassword ? 'text' : 'password';
    elements.toggleKeyVisibility.textContent = isPassword ? '🔒' : '👁';
}

/**
 * Get API key from input
 * @returns {string}
 */
export function getApiKey() {
    return elements.apiKeyInput?.value?.trim() || '';
}

/**
 * Show loading state on choices
 */
export function showChoicesLoading() {
    if (!elements.choicesContainer) return;

    elements.choicesContainer.innerHTML = `
        <div class="loading-indicator" role="status" aria-live="polite" style="text-align: center; padding: 1rem; color: var(--color-text-muted);">
            <span class="loading-text">Generating next scene...</span>
        </div>
    `;
}

/**
 * Update loading message while waiting on AI responses.
 * @param {string} message
 */
export function updateChoicesLoadingMessage(message) {
    if (!elements.choicesContainer) return;
    const loadingText = elements.choicesContainer.querySelector('.loading-text');
    if (loadingText) {
        loadingText.textContent = message;
    }
}

/**
 * Show error message
 * @param {string} message
 */
export function showError(message) {
    if (!elements.choicesContainer) return;

    elements.choicesContainer.innerHTML = `
        <div class="error-message" role="alert" style="text-align: center; padding: 1rem; color: var(--color-error);">
            <p>${escapeHtml(message)}</p>
            <button class="btn btn-secondary" id="retry-btn">Try Again</button>
        </div>
    `;

    const retryButton = document.getElementById('retry-btn');
    focusElement(retryButton);
}

/**
 * Format duration in mm:ss
 * @param {number} ms - Duration in milliseconds
 * @returns {string}
 */
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Add typewriter effect to text
 * @param {HTMLElement} element
 * @param {string} text
 * @param {number} speed - ms per character
 */
export async function typewriterEffect(element, text, speed = 20, signal = null) {
    element.textContent = '';
    for (let i = 0; i < text.length; i++) {
        if (signal?.aborted) return;
        element.textContent += text[i];
        await new Promise((resolve) => setTimeout(resolve, speed));
    }
}
