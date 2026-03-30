import { cloneScene, createGameState, isValidChoiceId, validateScene, type GameState, type Scene } from '$lib/contracts';
import { buildNarrativeContext } from '$lib/game/narrativeContext';
import { applyOpeningScene, applySceneTransition } from '$lib/game/runtime/stateTransitions';
import type { EndingPayload } from '$lib/game/runtime/contracts';
import type { StoryService } from '$lib/services';
import type { StoryCartridge } from '$lib/stories/types';

export interface RuntimeRefs {
	gameState: GameState | null;
	currentScene: Scene | null;
	lastEnding: EndingPayload | null;
	processing: boolean;
}

export interface TurnProcessorDependencies {
	storyService: StoryService;
	cartridge: Pick<StoryCartridge, 'initialSceneId' | 'createInitialStoryThreads'>;
	now: () => number;
	refs: RuntimeRefs;
	buildTurnResult: (scene: Scene) => { scene: Scene; gameState: GameState; isEnding: boolean; ending: EndingPayload | null };
	buildEndingPayload: (scene: Scene) => EndingPayload;
}

export function createTurnProcessor(deps: TurnProcessorDependencies) {
	const { storyService, cartridge, now, refs, buildTurnResult, buildEndingPayload } = deps;

	const startGame = async () => {
		refs.gameState = createGameState({
			apiKey: null,
			now,
			initialSceneId: cartridge.initialSceneId,
			initialStoryThreads: cartridge.createInitialStoryThreads()
		});

		const openingScene = await storyService.getOpeningScene();
		if (!validateScene(openingScene)) {
			throw new Error('Story service returned invalid opening scene');
		}

		applyOpeningScene(refs.gameState, openingScene);
		refs.currentScene = cloneScene(openingScene);
		refs.lastEnding = openingScene.isEnding ? buildEndingPayload(openingScene) : null;
		return buildTurnResult(openingScene);
	};

	const handleChoice = async (choiceId: string, choiceText = '') => {
		if (!refs.gameState || !refs.currentScene) {
			throw new Error('Game has not started. Call startGame() first.');
		}
		if (refs.processing) {
			throw new Error('Choice processing already in progress');
		}
		if (!isValidChoiceId(choiceId)) {
			throw new Error(`Invalid choice id: ${choiceId}`);
		}

		refs.processing = true;
		const historyLengthSnapshot = refs.gameState.history.length;
		refs.gameState.history.push({
			sceneId: refs.gameState.currentSceneId,
			choiceId,
			choiceText,
			timestamp: now()
		});

		let sceneApplied = false;
		try {
			const narrativeContext = buildNarrativeContext(refs.gameState, { lastChoiceText: choiceText });
			const nextScene = await storyService.getNextScene(
				refs.gameState.currentSceneId,
				choiceId,
				refs.gameState,
				narrativeContext,
				{
					enableTransitionBridges: true
				}
			);
			if (!validateScene(nextScene)) {
				throw new Error('Story service returned invalid scene payload');
			}

			applySceneTransition(refs.gameState, nextScene);
			refs.currentScene = cloneScene(nextScene);
			refs.lastEnding = nextScene.isEnding ? buildEndingPayload(nextScene) : null;
			sceneApplied = true;
			return buildTurnResult(nextScene);
		} finally {
			if (!sceneApplied && refs.gameState) {
				refs.gameState.history.length = historyLengthSnapshot;
			}
			refs.processing = false;
		}
	};

	return { startGame, handleChoice };
}
