import type { EndingType, GameSettings, GameState, Scene } from '$lib/contracts';
import type { SettingsStorage } from '$lib/services';
import type { EndingPayload } from '$lib/game/runtime/contracts';

export type { EndingPayload };

export function cloneSettings(settings: GameSettings): GameSettings {
	return {
		...settings,
		unlockedEndings: [...settings.unlockedEndings]
	};
}

export function normalizeEndingList(endings: EndingType[]): EndingType[] {
	const deduped = new Set(
		endings
			.filter((ending): ending is string => typeof ending === 'string')
			.map((ending) => ending.trim())
			.filter((ending) => ending.length > 0)
	);
	return [...deduped] as EndingType[];
}

export function buildEndingPayload(params: {
	scene: Scene;
	gameState: GameState | null;
	settings: GameSettings;
	settingsStorage: Pick<SettingsStorage, 'saveUnlockedEndings'>;
	now: () => number;
	onSettingsChange: (settings: GameSettings) => void;
}): EndingPayload {
	const { scene, gameState, settings, settingsStorage, now, onSettingsChange } = params;
	let effectiveSettings = settings;

	if (!gameState || !scene.endingType) {
		throw new Error('Ending payload requires ending scene and active game state');
	}

	if (!settings.unlockedEndings.includes(scene.endingType)) {
		const nextEndings = normalizeEndingList([...settings.unlockedEndings, scene.endingType]);
		const nextSettings = {
			...settings,
			unlockedEndings: settingsStorage.saveUnlockedEndings(nextEndings)
		};
		onSettingsChange(nextSettings);
		effectiveSettings = nextSettings;
	}

	return {
		endingType: scene.endingType,
		sceneId: scene.sceneId,
		stats: {
			sceneCount: gameState.sceneCount,
			lessonsCount: gameState.lessonsEncountered.length,
			durationMs: Math.max(0, now() - gameState.startTime)
		},
		unlockedEndings: [...effectiveSettings.unlockedEndings]
	};
}
