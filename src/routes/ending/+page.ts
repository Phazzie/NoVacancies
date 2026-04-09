import { EndingTypes } from '$lib/contracts';
import type { EndingPayload } from '$lib/game';
import type { PageLoad } from './$types';

const KNOWN_ENDING_TYPES = new Set(Object.values(EndingTypes));

function safeParseNonNegativeInt(value: string | null): number {
    if (value === null) return 0;
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, parsed);
}

function parseEndingFromUrl(params: URLSearchParams): EndingPayload | null {
    const type = params.get('type');
    if (!type) return null;

    const trimmedType = type.trim();
    if (!trimmedType) return null;

    const scenes = safeParseNonNegativeInt(params.get('scenes'));
    const lessons = safeParseNonNegativeInt(params.get('lessons'));
    const durationMinutes = safeParseNonNegativeInt(params.get('duration'));

    return {
        endingType: trimmedType,
        sceneId: '',
        stats: {
            sceneCount: scenes,
            lessonsCount: lessons,
            durationMs: durationMinutes * 60_000
        },
        unlockedEndings: KNOWN_ENDING_TYPES.has(
            trimmedType as (typeof EndingTypes)[keyof typeof EndingTypes]
        )
            ? [trimmedType as (typeof EndingTypes)[keyof typeof EndingTypes]]
            : []
    };
}

export const load: PageLoad = ({ url }) => {
    return {
        urlEnding: parseEndingFromUrl(url.searchParams)
    };
};
