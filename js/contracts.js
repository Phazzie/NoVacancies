/**
 * No Vacancies - Data Contracts
 *
 * JSDoc type definitions for type safety across the application.
 */

/**
 * @typedef {Object} Choice
 * @property {string} id - Unique identifier for the choice
 * @property {string} text - Display text for the choice button
 * @property {string} [outcome] - Brief description of what this leads to
 * @property {string} [nextSceneId] - ID of the scene this choice leads to (for mock service)
 */

/**
 * @typedef {Object} Scene
 * @property {string} sceneId - Unique identifier for this scene
 * @property {string} sceneText - The narrative text to display
 * @property {Choice[]} choices - Array of choices (empty if ending)
 * @property {number|null} lessonId - ID of the lesson being demonstrated (null if none)
 * @property {string} imageKey - Key to look up the image to display
 * @property {string} [imagePrompt] - Prompt for dynamic image generation
 * @property {boolean} isEnding - Whether this is an ending scene
 * @property {string|null} endingType - 'loop'|'shift'|'exit'|'rare' or null if not ending
 * @property {string} [mood] - Current emotional tone: 'neutral'|'tense'|'hopeful'|'dark'|'triumphant'
 * @property {Object|null} [storyThreadUpdates] - Partial updates to story threads (optional)
 */

/**
 * @typedef {Object} Lesson
 * @property {number} id - Unique lesson identifier (1-17)
 * @property {string} title - Short title for the lesson
 * @property {string} quote - Original quote from the source conversation
 * @property {string} insight - The core insight being taught
 * @property {string[]} emotionalStakes - Array of emotional impacts
 * @property {string[]} storyTriggers - Situations that trigger this lesson
 * @property {string} unconventionalAngle - The unexpected perspective
 */

/**
 * @typedef {Object} GameState
 * @property {string} currentSceneId - ID of the current scene
 * @property {Array<{sceneId: string, choiceId: string, timestamp: number}>} history - All previous choices
 * @property {number[]} lessonsEncountered - Array of lesson IDs encountered
 * @property {StoryThreads} storyThreads - Continuity tracking for narrative consistency
 * @property {string} [apiKey] - Gemini API key if using real AI
 * @property {boolean} useMocks - Whether to use mock service
 * @property {number} sceneCount - Number of scenes visited
 * @property {number} startTime - Timestamp when game started
 */

/**
 * @typedef {Object} StoryContext
 * @property {Scene} currentScene - The current scene
 * @property {GameState} gameState - Full game state
 * @property {Lesson[]} lessons - All available lessons
 * @property {Object} characters - Character details
 * @property {string[]} conversationHistory - Previous scenes/choices as text
 */

/**
 * @typedef {Object} Ending
 * @property {string} type - 'loop'|'shift'|'exit'|'rare'
 * @property {string} title - Display title for the ending
 * @property {string} description - Brief description of this ending
 * @property {string} theme - The core theme this ending embodies
 */

/**
 * Ending types enum
 */
export const EndingTypes = {
    LOOP: 'loop',
    SHIFT: 'shift',
    EXIT: 'exit',
    RARE: 'rare'
};

/**
 * @typedef {Object} StoryThreads
 * @property {number} oswaldoConflict - Confrontation level with Oswaldo (-2 to +2: -2=cooperative, -1=mild tension, 0=neutral, +1=defensive, +2=hostile)
 * @property {number} trinaTension - Friction level with Trina (0 to 3: 0=comfortable, 1=annoying, 2=confrontational, 3=explosive)
 * @property {boolean} moneyResolved - Has Sydney solved the $18 problem?
 * @property {boolean} carMentioned - Has "The Incident" (car crash with Krystal) been brought up?
 * @property {number} sydneyRealization - Sydney's self-awareness level (0 to 3: 0=oblivious, 1=questioning, 2=aware, 3=clarity)
 * @property {string[]} boundariesSet - Specific boundaries Sydney has established (e.g., "no guests without asking", "wake up before noon")
 * @property {number} oswaldoAwareness - Oswaldo's awareness of Sydney's labor (0 to 3: 0=blind, 1=glimpse, 2=seeing, 3=understands)
 * @property {number} exhaustionLevel - Sydney's burnout state (1 to 5: 1=functioning, 2=tired, 3=fraying, 4=breaking, 5=collapse)
 */

/**
 * Scene IDs for key scenes
 */
export const SceneIds = {
    OPENING: 'opening'
};

/**
 * Image keys for pre-generated images
 */
export const ImageKeys = {
    HOTEL_ROOM: 'hotel_room',
    SYDNEY_LAPTOP: 'sydney_laptop',
    SYDNEY_THINKING: 'sydney_thinking',
    SYDNEY_FRUSTRATED: 'sydney_frustrated',
    SYDNEY_TIRED: 'sydney_tired',
    SYDNEY_PHONE: 'sydney_phone',
    SYDNEY_COFFEE: 'sydney_coffee',
    SYDNEY_WINDOW: 'sydney_window',
    OSWALDO_SLEEPING: 'oswaldo_sleeping',
    OSWALDO_AWAKE: 'oswaldo_awake',
    THE_DOOR: 'the_door',
    EMPTY_ROOM: 'empty_room',
    MOTEL_EXTERIOR: 'motel_exterior'
};

/**
 * Mood types for scene atmosphere
 */
export const Moods = {
    NEUTRAL: 'neutral',
    TENSE: 'tense',
    HOPEFUL: 'hopeful',
    DARK: 'dark',
    TRIUMPHANT: 'triumphant'
};

/**
 * Create a new empty game state
 * @returns {GameState}
 */
export function createGameState() {
    return {
        currentSceneId: SceneIds.OPENING,
        history: [],
        lessonsEncountered: [],
        storyThreads: createStoryThreads(),
        apiKey: null,
        useMocks: true,
        sceneCount: 0,
        startTime: Date.now()
    };
}

/**
 * Create a new StoryThreads object with default values
 * @returns {StoryThreads}
 */
export function createStoryThreads() {
    return {
        oswaldoConflict: 0,
        trinaTension: 0,
        moneyResolved: false,
        carMentioned: false,
        sydneyRealization: 0,
        boundariesSet: [],
        oswaldoAwareness: 0,
        exhaustionLevel: 1
    };
}

/**
 * Merge partial storyThread updates into current threads
 * Returns a new object (no mutation of original)
 * @param {StoryThreads} currentThreads - Current thread state
 * @param {Object|null} updates - Partial updates from AI response
 * @returns {StoryThreads} - Merged thread state
 */
export function mergeThreadUpdates(currentThreads, updates) {
    if (!updates) return currentThreads;

    const merged = {
        ...currentThreads,
        boundariesSet: [...currentThreads.boundariesSet]
    };

    Object.keys(updates).forEach(key => {
        if (!(key in merged)) return;

        if (key === 'boundariesSet') {
            if (Array.isArray(updates.boundariesSet) && updates.boundariesSet.length > 0) {
                merged.boundariesSet = [...merged.boundariesSet, ...updates.boundariesSet];
            }
        } else if (updates[key] !== undefined) {
            merged[key] = updates[key];
        }
    });

    return merged;
}

/**
 * Validate a scene object has required fields
 * @param {Scene} scene
 * @returns {boolean}
 */
export function validateScene(scene) {
    if (!scene) return false;
    if (typeof scene.sceneId !== 'string') return false;
    if (typeof scene.sceneText !== 'string') return false;
    if (!Array.isArray(scene.choices)) return false;
    if (typeof scene.isEnding !== 'boolean') return false;
    if (scene.isEnding && !scene.endingType) return false;
    return true;
}

/**
 * Validate a choice object
 * @param {Choice} choice
 * @returns {boolean}
 */
export function validateChoice(choice) {
    if (!choice) return false;
    if (typeof choice.id !== 'string') return false;
    if (typeof choice.text !== 'string') return false;
    return true;
}

/**
 * Validate and normalize ending type
 * Allows custom endings but validates they're reasonable (not garbage)
 * @param {string} type - Raw ending type from AI
 * @returns {string} - Validated ending type or fallback to 'loop'
 */
export function validateEndingType(type) {
    if (!type || typeof type !== 'string') return EndingTypes.LOOP;
    
    const normalized = type.toLowerCase().trim();
    
    // Known types pass through as-is
    if (Object.values(EndingTypes).includes(normalized)) {
        return normalized;
    }
    
    // Custom endings: 3-30 chars, letters and spaces only
    const CUSTOM_PATTERN = /^[a-z\s]{3,30}$/;
    if (CUSTOM_PATTERN.test(normalized)) {
        return normalized;
    }
    
    // Invalid → fallback to loop
    return EndingTypes.LOOP;
}
