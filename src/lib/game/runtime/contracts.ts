import type { EndingType, GameState, Scene } from '$lib/contracts';

export interface EndingPayload {
	endingType: EndingType;
	sceneId: string;
	stats: {
		sceneCount: number;
		lessonsCount: number;
		durationMs: number;
	};
	unlockedEndings: EndingType[];
}

export interface GameTurnResult {
	scene: Scene;
	gameState: GameState;
	isEnding: boolean;
	ending: EndingPayload | null;
}
