import { mergeThreadUpdates, type GameState, type Scene, type StoryThreads } from '$lib/contracts';
import { detectThreadTransitions } from '$lib/game/narrativeContext';

function cloneThreadState(storyThreads: StoryThreads): StoryThreads {
	return {
		...storyThreads,
		boundariesSet: [...storyThreads.boundariesSet]
	};
}

export function derivePendingTransitionBridge(previous: StoryThreads, next: StoryThreads) {
	const transitionBridge = detectThreadTransitions(previous, next);
	return transitionBridge.moments.length > 0 ? transitionBridge : null;
}

export function applyOpeningScene(gameState: GameState, openingScene: Scene): void {
	gameState.currentSceneId = openingScene.sceneId;
	gameState.sceneCount = 1;
	gameState.sceneLog = [
		{
			sceneId: openingScene.sceneId,
			sceneText: openingScene.sceneText,
			viaChoiceText: '',
			isEnding: openingScene.isEnding
		}
	];

	if (openingScene.lessonId != null && !gameState.lessonsEncountered.includes(openingScene.lessonId)) {
		gameState.lessonsEncountered.push(openingScene.lessonId);
	}

	if (openingScene.storyThreadUpdates) {
		gameState.storyThreads = mergeThreadUpdates(gameState.storyThreads, openingScene.storyThreadUpdates);
	}
}

export function applySceneTransition(gameState: GameState, scene: Scene): void {
	const previousThreads = cloneThreadState(gameState.storyThreads);

	if (scene.storyThreadUpdates) {
		gameState.storyThreads = mergeThreadUpdates(gameState.storyThreads, scene.storyThreadUpdates);
	}

	gameState.pendingTransitionBridge = derivePendingTransitionBridge(previousThreads, gameState.storyThreads);
	gameState.currentSceneId = scene.sceneId;
	gameState.sceneCount += 1;

	const lastHistoryEntry = gameState.history[gameState.history.length - 1];
	gameState.sceneLog.push({
		sceneId: scene.sceneId,
		sceneText: scene.sceneText,
		viaChoiceText: lastHistoryEntry?.choiceText ?? '',
		isEnding: scene.isEnding
	});

	if (scene.lessonId != null && !gameState.lessonsEncountered.includes(scene.lessonId)) {
		gameState.lessonsEncountered.push(scene.lessonId);
	}
}
