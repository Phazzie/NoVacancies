/**
 * Playthrough recap builder and export helpers.
 */

import { createStoryThreads, EndingTypes } from '../contracts.js';

const RECAP_VERSION = 1;
const MAX_KEY_CHOICES = 6;
const TOTAL_ENDINGS = Object.keys(EndingTypes).length;

const endingTitleMap = {
    loop: 'The Loop',
    shift: 'The Shift',
    exit: 'The Exit',
    rare: 'The Rare'
};

function toIsoTimestamp(now) {
    return new Date(now).toISOString();
}

function humanizeChoiceId(choiceId) {
    if (typeof choiceId !== 'string' || choiceId.trim().length === 0) {
        return 'Continue';
    }
    return choiceId
        .trim()
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function getChoiceText(entry) {
    if (typeof entry?.choiceText === 'string' && entry.choiceText.trim().length > 0) {
        return entry.choiceText.trim();
    }
    return humanizeChoiceId(entry?.choiceId);
}

function getEndingTitle(endingType) {
    if (typeof endingType !== 'string' || endingType.trim().length === 0) {
        return 'Unknown Ending';
    }
    if (endingTitleMap[endingType]) {
        return endingTitleMap[endingType];
    }
    return endingType
        .split(/[\s_]+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function getThreadDeltas(currentThreads) {
    const baseline = createStoryThreads();
    const source = currentThreads && typeof currentThreads === 'object' ? currentThreads : baseline;
    const deltas = {};

    const numericKeys = [
        'oswaldoConflict',
        'trinaTension',
        'sydneyRealization',
        'oswaldoAwareness',
        'exhaustionLevel'
    ];

    numericKeys.forEach((key) => {
        if (source[key] !== baseline[key]) {
            deltas[key] = { from: baseline[key], to: source[key] };
        }
    });

    ['moneyResolved', 'carMentioned'].forEach((key) => {
        if (source[key] !== baseline[key]) {
            deltas[key] = { from: baseline[key], to: source[key] };
        }
    });

    const baselineBoundaries = baseline.boundariesSet || [];
    const currentBoundaries = Array.isArray(source.boundariesSet) ? source.boundariesSet : [];
    const addedBoundaries = currentBoundaries.filter((value) => !baselineBoundaries.includes(value));
    if (addedBoundaries.length > 0) {
        deltas.boundariesSetAdded = [...new Set(addedBoundaries)];
    }

    return deltas;
}

function sanitizeUnlockedEndings(unlockedEndings) {
    if (!Array.isArray(unlockedEndings)) return [];
    return [...new Set(unlockedEndings.filter((value) => typeof value === 'string' && value.trim().length > 0))];
}

function buildKeyChoices(history) {
    if (!Array.isArray(history)) return [];
    return history.slice(-MAX_KEY_CHOICES).map((entry) => ({
        sceneId: typeof entry?.sceneId === 'string' ? entry.sceneId : 'unknown_scene',
        choiceId: typeof entry?.choiceId === 'string' ? entry.choiceId : 'unknown_choice',
        choiceText: getChoiceText(entry),
        timestamp: Number.isInteger(entry?.timestamp) ? entry.timestamp : 0
    }));
}

export function formatPlaythroughRecapText(recap) {
    const lines = [
        'No Vacancies - Playthrough Recap',
        `Generated: ${recap.generatedAt}`,
        `Mode: ${recap.mode.toUpperCase()}`,
        `Ending: ${recap.endingTitle} (${recap.endingType})`,
        `Scenes: ${recap.stats.sceneCount}`,
        `Choices: ${recap.stats.choiceCount}`,
        `Lessons: ${recap.stats.lessonsCount}`,
        `DurationMs: ${recap.stats.durationMs}`,
        `Unlocked Endings: ${recap.unlocked.count}/${recap.unlocked.total}`,
        ''
    ];

    lines.push('Key Choices:');
    if (recap.keyChoices.length === 0) {
        lines.push('- (none recorded)');
    } else {
        recap.keyChoices.forEach((entry, index) => {
            lines.push(`${index + 1}. ${entry.choiceText} [${entry.choiceId}]`);
        });
    }

    lines.push('');
    lines.push('Thread Deltas:');
    const deltaKeys = Object.keys(recap.threadDeltas || {});
    if (deltaKeys.length === 0) {
        lines.push('- (no changes)');
    } else {
        deltaKeys.forEach((key) => {
            const value = recap.threadDeltas[key];
            if (value && typeof value === 'object' && 'from' in value && 'to' in value) {
                lines.push(`- ${key}: ${value.from} -> ${value.to}`);
            } else if (Array.isArray(value)) {
                lines.push(`- ${key}: ${value.join(', ')}`);
            } else {
                lines.push(`- ${key}: ${JSON.stringify(value)}`);
            }
        });
    }

    return lines.join('\n');
}

function buildRecap(options) {
    const now = Number.isFinite(options?.now) ? options.now : Date.now();
    const gameState = options?.gameState || {};
    const endingType =
        typeof options?.endingScene?.endingType === 'string' && options.endingScene.endingType.trim().length > 0
            ? options.endingScene.endingType
            : 'loop';
    const unlocked = sanitizeUnlockedEndings(options?.unlockedEndings);
    const keyChoices = buildKeyChoices(gameState.history);

    const recap = {
        version: RECAP_VERSION,
        generatedAt: toIsoTimestamp(now),
        mode: gameState.useMocks ? 'mock' : 'ai',
        endingType,
        endingTitle: getEndingTitle(endingType),
        stats: {
            sceneCount: Number.isInteger(gameState.sceneCount) ? gameState.sceneCount : 0,
            choiceCount: Array.isArray(gameState.history) ? gameState.history.length : 0,
            lessonsCount: Array.isArray(gameState.lessonsEncountered)
                ? gameState.lessonsEncountered.length
                : 0,
            durationMs: Math.max(
                0,
                now - (Number.isFinite(gameState.startTime) ? gameState.startTime : now)
            )
        },
        unlocked: {
            count: unlocked.length,
            total: TOTAL_ENDINGS,
            list: unlocked
        },
        keyChoices,
        threadDeltas: getThreadDeltas(gameState.storyThreads),
        text: ''
    };

    recap.text = formatPlaythroughRecapText(recap);
    return recap;
}

/**
 * Real recap builder used by the app ending flow.
 * @param {{
 *   gameState: import('../contracts.js').GameState,
 *   endingScene: {endingType?: string|null},
 *   unlockedEndings: string[],
 *   now?: number
 * }} options
 * @returns {import('../contracts.js').PlaythroughRecap}
 */
export function buildPlaythroughRecap(options) {
    return buildRecap(options);
}

/**
 * Mock recap builder kept for contract-first testing and staged wiring.
 * @param {{
 *   gameState: import('../contracts.js').GameState,
 *   endingScene: {endingType?: string|null},
 *   unlockedEndings: string[],
 *   now?: number
 * }} options
 * @returns {import('../contracts.js').PlaythroughRecap}
 */
export function buildPlaythroughRecapMock(options) {
    return buildRecap(options);
}
