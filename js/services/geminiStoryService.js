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
    validateImageKey,
    suggestEndingFromHistory
} from '../prompts.js';
import { ImageKeys, Moods, SceneIds, validateScene, validateEndingType } from '../contracts.js';

/**
 * Gemini API Configuration
 */
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const PRIMARY_MODEL = 'gemini-3-pro-preview';
const FALLBACK_MODEL = 'gemini-3-flash-preview';

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
        const response = await this.callGemini(prompt);

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

        const response = await this.callGemini(prompt);

        this.conversationHistory.push(`[Choice: ${choiceText}]\n${response.sceneText}`);
        this.sceneCount++;

        // Generate a scene ID
        const sceneId = `scene_${this.sceneCount}_${Date.now()}`;

        return this.formatScene(response, sceneId);
    }

    /**
     * Call the Gemini API
     * @param {string} userPrompt
     * @returns {Promise<Object>}
     */
    async callGemini(userPrompt) {
        if (!this.apiKey) {
            throw new Error('No API key set');
        }

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
                        sceneText: { type: 'string' },
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

        try {
            console.log(`[GeminiService] Calling ${this.currentModel}...`);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('[GeminiService] API error:', errorData);

                // Try fallback model if primary fails
                if (this.currentModel === PRIMARY_MODEL) {
                    console.log('[GeminiService] Trying fallback model...');
                    this.currentModel = FALLBACK_MODEL;
                    return this.callGemini(userPrompt);
                }

                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            // Extract the text content
            const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!textContent) {
                throw new Error('No content in response');
            }

            // Parse JSON from the response
            return this.parseResponse(textContent);
        } catch (error) {
            console.error('[GeminiService] Request failed:', error);

            // Try fallback model
            if (this.currentModel === PRIMARY_MODEL) {
                console.log('[GeminiService] Trying fallback model after error...');
                this.currentModel = FALLBACK_MODEL;
                return this.callGemini(userPrompt);
            }

            throw error;
        }
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
