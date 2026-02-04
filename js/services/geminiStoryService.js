/**
 * No Vacancies - Gemini Story Service
 *
 * Generates dynamic story content using Google's Gemini API.
 * Falls back to mock service on errors.
 */

import {
    SYSTEM_PROMPT,
    getOpeningPrompt,
    getContinuePrompt,
    getRecoveryPrompt,
    validateImageKey,
    suggestEndingFromHistory
} from '../prompts.js';
import { ImageKeys, Moods, SceneIds, validateScene, validateEndingType } from '../contracts.js';
import { emitAiTelemetry } from './aiTelemetry.js';

/**
 * Gemini API Configuration
 */
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const PRIMARY_MODEL = 'gemini-3-pro-preview';
const FALLBACK_MODEL = 'gemini-3-flash-preview';
const REQUEST_TIMEOUT_MS = 15000;

/**
 * Map API image keys to our internal keys
 */
const imageKeyMap = {
    hotel_room: ImageKeys.HOTEL_ROOM,
    sydney_laptop: ImageKeys.SYDNEY_LAPTOP,
    sydney_thinking: ImageKeys.SYDNEY_THINKING,
    sydney_frustrated: ImageKeys.SYDNEY_FRUSTRATED,
    sydney_tired: ImageKeys.SYDNEY_TIRED,
    sydney_phone: ImageKeys.SYDNEY_PHONE,
    sydney_coffee: ImageKeys.SYDNEY_COFFEE,
    sydney_window: ImageKeys.SYDNEY_WINDOW,
    oswaldo_sleeping: ImageKeys.OSWALDO_SLEEPING,
    oswaldo_awake: ImageKeys.OSWALDO_AWAKE,
    the_door: ImageKeys.THE_DOOR,
    empty_room: ImageKeys.EMPTY_ROOM,
    motel_exterior: ImageKeys.MOTEL_EXTERIOR
};

/**
 * Map API mood strings to our internal moods
 */
const moodMap = {
    neutral: Moods.NEUTRAL,
    tense: Moods.TENSE,
    hopeful: Moods.HOPEFUL,
    dark: Moods.DARK,
    triumphant: Moods.TRIUMPHANT
};

/**
 * Gemini Story Service Class
 */
class GeminiStoryService {
    constructor() {
        this.apiKey = null;
        this.conversationHistory = [];
        this.sceneCount = 0;
        this.currentModel = PRIMARY_MODEL;
        this.requestTimeoutMs = REQUEST_TIMEOUT_MS;
    }

    /**
     * Set the API key
     * @param {string} apiKey
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        console.log('[GeminiService] API key set');
    }

    /**
     * Check if service is available
     * @returns {boolean}
     */
    isAvailable() {
        return !!this.apiKey;
    }

    /**
     * Reset for a new game
     */
    reset() {
        this.conversationHistory = [];
        this.sceneCount = 0;
        this.currentModel = PRIMARY_MODEL;
    }

    /**
     * Get the opening scene
     * @returns {Promise<import('../contracts.js').Scene>}
     */
    async getOpeningScene() {
        this.reset();

        const prompt = getOpeningPrompt();
        let response = await this.callGemini(prompt);

        const openingQuality = this.evaluateResponseQuality(response, null, null);
        if (!openingQuality.ok) {
            console.warn('[GeminiService] Opening quality check failed, retrying once:', openingQuality.issues);
            const repairPrompt = this.buildQualityRepairPrompt(prompt, response, openingQuality.issues);
            response = await this.callGemini(repairPrompt);
        }

        this.conversationHistory.push(response.sceneText);
        this.sceneCount = 1;

        return this.formatScene(response, SceneIds.OPENING);
    }

    /**
     * Get the next scene based on a choice
     * @param {string} currentSceneId
     * @param {string} choiceId
     * @param {import('../contracts.js').GameState} gameState
     * @returns {Promise<import('../contracts.js').Scene>}
     */
    async getNextScene(currentSceneId, choiceId, gameState) {
        // Find the choice text from the last response or use the ID
        const choiceText = this.lastChoices?.find((c) => c.id === choiceId)?.text || choiceId;

        let suggestedEnding = null;
        if (this.sceneCount >= 8) {
            suggestedEnding = suggestEndingFromHistory(gameState.history);
            console.log(`[GeminiService] Suggested ending: ${suggestedEnding}`);
        }

        const prompt = getContinuePrompt(
            this.conversationHistory,
            choiceText,
            this.sceneCount,
            suggestedEnding,
            gameState.storyThreads
        );

        let response = await this.callGemini(prompt);

        const quality = this.evaluateResponseQuality(response, gameState, choiceText);
        if (!quality.ok) {
            console.warn('[GeminiService] Response quality check failed, retrying once:', quality.issues);
            const repairPrompt = this.buildQualityRepairPrompt(prompt, response, quality.issues);
            response = await this.callGemini(repairPrompt);
        }

        this.conversationHistory.push(`[Choice: ${choiceText}]\n${response.sceneText}`);
        this.sceneCount++;

        // Generate a scene ID
        const sceneId = `scene_${this.sceneCount}_${Date.now()}`;

        return this.formatScene(response, sceneId);
    }

    /**
     * Call the Gemini API
     * @param {string} userPrompt
     * @param {number} parseRecoveryAttemptsRemaining
     * @param {string} basePrompt
     * @returns {Promise<Object>}
     */
    async callGemini(userPrompt, parseRecoveryAttemptsRemaining = 1, basePrompt = userPrompt) {
        if (!this.apiKey) {
            throw new Error('No API key set');
        }

        const promptType = userPrompt === basePrompt ? 'primary' : 'recovery';
        const url = `${GEMINI_API_URL}/${this.currentModel}:generateContent?key=${this.apiKey}`;

        const requestBody = {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: SYSTEM_PROMPT + '\n\n' + userPrompt }]
                }
            ],
            generationConfig: {
                temperature: 0.8,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: 'object',
                    properties: {
                        sceneText: { type: 'string', minLength: 200, maxLength: 2600 },
                        choices: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    text: { type: 'string' }
                                },
                                required: ['id', 'text']
                            }
                        },
                        lessonId: { type: 'integer' },
                        imageKey: { type: 'string' },
                        isEnding: { type: 'boolean' },
                        endingType: { type: 'string' },
                        mood: {
                            type: 'string',
                            enum: ['neutral', 'tense', 'hopeful', 'dark', 'triumphant']
                        },
                        storyThreadUpdates: {
                            type: 'object',
                            description: 'Updates to story continuity threads (only include fields that changed)',
                            properties: {
                                oswaldoConflict: { type: 'integer', minimum: -2, maximum: 2 },
                                trinaTension: { type: 'integer', minimum: 0, maximum: 3 },
                                moneyResolved: { type: 'boolean' },
                                carMentioned: { type: 'boolean' },
                                sydneyRealization: { type: 'integer', minimum: 0, maximum: 3 },
                                boundariesSet: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description: 'NEW boundaries set this scene (not all boundaries)'
                                },
                                oswaldoAwareness: { type: 'integer', minimum: 0, maximum: 3 },
                                exhaustionLevel: { type: 'integer', minimum: 1, maximum: 5 }
                            }
                        }
                    },
                    required: ['sceneText', 'choices', 'isEnding']
                }
            },
            safetySettings: [
                {
                    category: 'HARM_CATEGORY_HARASSMENT',
                    threshold: 'BLOCK_NONE'
                },
                {
                    category: 'HARM_CATEGORY_HATE_SPEECH',
                    threshold: 'BLOCK_NONE'
                },
                {
                    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                },
                {
                    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                    threshold: 'BLOCK_NONE'
                }
            ]
        };

        const timeoutMs =
            this.currentModel === PRIMARY_MODEL ? this.requestTimeoutMs : this.requestTimeoutMs + 5000;
        const timeoutController = new AbortController();
        let timeoutId = null;

        try {
            emitAiTelemetry('request_start', {
                model: this.currentModel,
                promptType,
                parseRecoveryAttemptsRemaining
            });
            emitAiTelemetry('model_used', { model: this.currentModel });
            console.log(`[GeminiService] Calling ${this.currentModel}...`);
            timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody),
                signal: timeoutController.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('[GeminiService] API error:', errorData);

                // Try fallback model if primary fails
                if (this.currentModel === PRIMARY_MODEL) {
                    console.log('[GeminiService] Trying fallback model...');
                    emitAiTelemetry('fallback_trigger', {
                        fromModel: PRIMARY_MODEL,
                        toModel: FALLBACK_MODEL,
                        reason: `api_error_${response.status}`
                    });
                    this.currentModel = FALLBACK_MODEL;
                    return this.callGemini(userPrompt, parseRecoveryAttemptsRemaining, basePrompt);
                }

                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            // Extract the text content
            const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!textContent) {
                throw new Error('No content in response');
            }

            try {
                // Parse JSON from the response
                const parsed = this.parseResponse(textContent);
                emitAiTelemetry('final_success', { model: this.currentModel, promptType });
                return parsed;
            } catch (parseError) {
                parseError.name = 'ParseError';

                if (parseRecoveryAttemptsRemaining > 0) {
                    console.warn('[GeminiService] Parse failed, attempting one JSON recovery call');
                    emitAiTelemetry('parse_recovery_attempt', {
                        model: this.currentModel,
                        promptType,
                        remainingBeforeRetry: parseRecoveryAttemptsRemaining
                    });
                    const recoveryPrompt = getRecoveryPrompt(textContent);
                    return this.callGemini(recoveryPrompt, parseRecoveryAttemptsRemaining - 1, basePrompt);
                }
                throw parseError;
            }
        } catch (error) {
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
            }
            console.error('[GeminiService] Request failed:', error);

            if (error.name === 'AbortError') {
                const timeoutError = new Error('Gemini request timed out');
                timeoutError.name = 'TimeoutError';
                emitAiTelemetry('final_failure', {
                    model: this.currentModel,
                    promptType,
                    reason: timeoutError.name
                });
                throw timeoutError;
            }

            // Parse failures: after one JSON-recovery retry on primary, try fallback model once.
            if (error.name === 'ParseError') {
                if (this.currentModel === PRIMARY_MODEL) {
                    console.log('[GeminiService] Trying fallback model after parse failure...');
                    emitAiTelemetry('fallback_trigger', {
                        fromModel: PRIMARY_MODEL,
                        toModel: FALLBACK_MODEL,
                        reason: 'parse_failure'
                    });
                    this.currentModel = FALLBACK_MODEL;
                    return this.callGemini(basePrompt, 1, basePrompt);
                }
                emitAiTelemetry('final_failure', {
                    model: this.currentModel,
                    promptType,
                    reason: error.name
                });
                throw error;
            }

            // Try fallback model
            if (this.currentModel === PRIMARY_MODEL) {
                console.log('[GeminiService] Trying fallback model after error...');
                emitAiTelemetry('fallback_trigger', {
                    fromModel: PRIMARY_MODEL,
                    toModel: FALLBACK_MODEL,
                    reason: error.name || 'request_error'
                });
                this.currentModel = FALLBACK_MODEL;
                return this.callGemini(userPrompt, parseRecoveryAttemptsRemaining, basePrompt);
            }

            emitAiTelemetry('final_failure', {
                model: this.currentModel,
                promptType,
                reason: error.name || 'request_error'
            });
            throw error;
        }
    }

    /**
     * Determine whether choice texts are meaningfully distinct.
     * @param {{text: string}[]} choices
     * @returns {boolean}
     */
    hasDistinctChoices(choices) {
        if (!Array.isArray(choices) || choices.length < 2) return true;

        const STOP_WORDS = new Set([
            'the', 'a', 'an', 'to', 'and', 'or', 'of', 'for', 'with', 'in', 'on', 'at', 'it', 'this', 'that',
            'you', 'your', 'i', 'we', 'is', 'are', 'be', 'do', 'does', 'now', 'just'
        ]);

        const tokenize = (text) =>
            (text || '')
                .toLowerCase()
                .split(/[^a-z]+/)
                .filter((token) => token && !STOP_WORDS.has(token));

        const sets = choices.map((choice) => new Set(tokenize(choice.text)));
        for (let i = 0; i < sets.length; i++) {
            for (let j = i + 1; j < sets.length; j++) {
                const a = sets[i];
                const b = sets[j];
                const union = new Set([...a, ...b]);
                if (union.size === 0) continue;

                let overlap = 0;
                a.forEach((token) => {
                    if (b.has(token)) overlap++;
                });
                const jaccard = overlap / union.size;

                if (jaccard >= 0.72) return false;
            }
        }

        return true;
    }

    /**
     * Build continuity anchors from state to validate callback references.
     * @param {import('../contracts.js').GameState} gameState
     * @param {string} lastChoiceText
     * @returns {string[]}
     */
    getContinuityAnchors(gameState, lastChoiceText) {
        if (!gameState) return [];

        const anchors = ['sydney', 'oswaldo', 'trina', 'dex', 'room', 'rent', 'laptop'];
        const threads = gameState.storyThreads;

        if (threads) {
            if (threads.moneyResolved) anchors.push('paid', 'money');
            if (threads.carMentioned) anchors.push('car', 'krystal', 'insurance');
            if (threads.trinaTension > 0) anchors.push('trina');
            if (threads.oswaldoConflict !== 0 || threads.oswaldoAwareness > 0) anchors.push('oswaldo');
            if (threads.exhaustionLevel > 2) anchors.push('tired', 'exhausted', 'burnout');
            if (threads.boundariesSet.length > 0) {
                anchors.push('boundary');
                threads.boundariesSet.forEach((boundary) => {
                    boundary
                        .toLowerCase()
                        .split(/[^a-z]+/)
                        .filter(Boolean)
                        .forEach((token) => anchors.push(token));
                });
            }
        }

        if (lastChoiceText) {
            lastChoiceText
                .toLowerCase()
                .split(/[^a-z]+/)
                .filter((token) => token.length > 3)
                .forEach((token) => anchors.push(token));
        }

        return [...new Set(anchors)];
    }

    /**
     * Evaluate semantic quality beyond JSON validity.
     * @param {Object} response
     * @param {import('../contracts.js').GameState|null} gameState
     * @param {string|null} lastChoiceText
     * @returns {{ok: boolean, issues: string[]}}
     */
    evaluateResponseQuality(response, gameState = null, lastChoiceText = null) {
        const issues = [];

        if (!response?.isEnding && !this.hasDistinctChoices(response?.choices || [])) {
            issues.push('Choices are too similar; provide clearly different strategies.');
        }

        if (gameState && this.sceneCount >= 2) {
            const sceneText = (response?.sceneText || '').toLowerCase();
            const anchors = this.getContinuityAnchors(gameState, lastChoiceText);
            if (anchors.length > 0 && !anchors.some((anchor) => sceneText.includes(anchor))) {
                issues.push('Scene lacks a concrete callback to established continuity.');
            }
        }

        return { ok: issues.length === 0, issues };
    }

    /**
     * Build a targeted quality repair prompt.
     * @param {string} originalPrompt
     * @param {Object} response
     * @param {string[]} issues
     * @returns {string}
     */
    buildQualityRepairPrompt(originalPrompt, response, issues) {
        return `${originalPrompt}

QUALITY REVISION REQUIRED:
- ${issues.join('\n- ')}

Prior JSON (for reference):
${JSON.stringify(response).slice(0, 900)}

Return corrected JSON only.`;
    }

    /**
     * Parse the AI response into a structured object
     * @param {string} text
     * @returns {Object}
     */
    parseResponse(text) {
        try {
            // Try to parse as JSON directly
            const parsed = JSON.parse(text);
            this.lastChoices = parsed.choices;
            return parsed;
        } catch {
            // Try to extract JSON from markdown code blocks
            const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                try {
                    const parsed = JSON.parse(jsonMatch[1]);
                    this.lastChoices = parsed.choices;
                    return parsed;
                } catch {
                    console.error('[GeminiService] Failed to parse JSON from code block');
                }
            }

            // Try to find JSON object in the text
            const objectMatch = text.match(/\{[\s\S]*\}/);
            if (objectMatch) {
                try {
                    const parsed = JSON.parse(objectMatch[0]);
                    this.lastChoices = parsed.choices;
                    return parsed;
                } catch {
                    console.error('[GeminiService] Failed to parse JSON object');
                }
            }

            console.error('[GeminiService] Could not parse response:', text);
            throw new Error('Could not parse AI response as JSON');
        }
    }

    /**
     * Format the API response into a Scene object
     * @param {Object} response
     * @param {string} sceneId
     * @returns {import('../contracts.js').Scene}
     */
    formatScene(response, sceneId) {
        // Map the image key
        const rawImageKey = validateImageKey(response.imageKey || 'hotel_room');
        const imageKey = imageKeyMap[rawImageKey] || ImageKeys.HOTEL_ROOM;

        // Map the mood
        const mood = moodMap[response.mood] || Moods.NEUTRAL;

        // Map ending type
        // Map ending type
        let endingType = null;
        if (response.isEnding) {
            endingType = validateEndingType(response.endingType);
        }

        // Format choices
        const choices = (response.choices || []).map((c, i) => ({
            id: c.id || `choice_${i}`,
            text: c.text || 'Continue...'
        }));

        const scene = {
            sceneId: sceneId,
            sceneText: response.sceneText || '',
            choices: choices,
            lessonId: typeof response.lessonId === 'number' ? response.lessonId : null,
            imageKey: imageKey,
            isEnding: !!response.isEnding,
            endingType: endingType,
            mood: mood,
            storyThreadUpdates: response.storyThreadUpdates || null
        };

        // Validate before returning
        if (!validateScene(scene)) {
            console.warn('[GeminiService] Generated scene failed validation, fixing...');
            scene.sceneText = scene.sceneText || 'The story continues...';
            scene.choices =
                scene.choices.length > 0
                    ? scene.choices
                    : [{ id: 'continue', text: 'Continue...' }];
        }

        return scene;
    }

    /**
     * Get a scene by ID (not supported for dynamic generation)
     * @param {string} sceneId
     * @returns {undefined}
     */
    getSceneById(_sceneId) {
        // Dynamic service doesn't store scenes
        return undefined;
    }
}

// Export singleton instance
export const geminiStoryService = new GeminiStoryService();
export default geminiStoryService;
