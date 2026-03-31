import type { EndingType, GameSettings, GameState, Scene } from '../../contracts';
import type { SettingsStorage } from '../../services';
import type { EndingPayload } from '../gameRuntime';

export function cloneSettings(settings: GameSettings): GameSettings {
    return {
        ...settings,
        unlockedEndings: [...settings.unlockedEndings]
    };
}

export function normalizeEndingList(endings: EndingType[]): EndingType[] {
    const deduped = new Set(
        endings.filter((ending) => typeof ending === 'string' && ending.trim().length > 0)
    );
    return [...deduped];
}

interface EndingPayloadOptions {
    scene: Scene;
    gameState: GameState;
    settings: GameSettings;
    settingsStorage: SettingsStorage;
    now: () => number;
}

export function buildEndingPayload({
    scene,
    gameState,
    settings,
    settingsStorage,
    now
}: EndingPayloadOptions): EndingPayload {
    if (!scene.endingType) {
        throw new Error('Ending payload requires ending scene and active game state');
    }

    if (!settings.unlockedEndings.includes(scene.endingType)) {
        const nextEndings = normalizeEndingList([...settings.unlockedEndings, scene.endingType]);
        settings.unlockedEndings = settingsStorage.saveUnlockedEndings(nextEndings);
    }

    return {
        endingType: scene.endingType,
        sceneId: scene.sceneId,
        stats: {
            sceneCount: gameState.sceneCount,
            lessonsCount: gameState.lessonsEncountered.length,
            durationMs: Math.max(0, now() - gameState.startTime)
        },
        unlockedEndings: [...settings.unlockedEndings]
    };
}
