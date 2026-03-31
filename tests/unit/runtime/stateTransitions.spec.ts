import { expect, test } from '@playwright/test';
import { createGameState, type Scene } from '../../../src/lib/contracts/game';
import { applyOpeningScene, applySceneTransition, derivePendingTransitionBridge } from '../../../src/lib/game/runtime/stateTransitions';

function makeScene(overrides: Partial<Scene> = {}): Scene {
	return {
		sceneId: 'scene_1',
		sceneText: 'Default scene text',
		choices: [{ id: 'c1', text: 'Continue' }],
		lessonId: null,
		imageKey: 'hotel_room',
		isEnding: false,
		endingType: null,
		...overrides
	};
}

test.describe('runtime/stateTransitions', () => {
	test('applyOpeningScene initializes opening log and applies opening thread updates', () => {
		const state = createGameState();
		const opening = makeScene({
			sceneId: 'opening',
			sceneText: 'The motel exhales.',
			lessonId: 2,
			storyThreadUpdates: { oswaldoConflict: 4 }
		});

		applyOpeningScene(state, opening);

		expect(state.currentSceneId).toBe('opening');
		expect(state.sceneCount).toBe(1);
		expect(state.storyThreads.oswaldoConflict).toBe(4);
		expect(state.lessonsEncountered).toEqual([2]);
		expect(state.sceneLog).toEqual([
			{
				sceneId: 'opening',
				sceneText: 'The motel exhales.',
				viaChoiceText: '',
				isEnding: false
			}
		]);
	});

	test('applySceneTransition records bridge and choice text for changed threads', () => {
		const state = createGameState();
		state.currentSceneId = 'opening';
		state.history.push({ sceneId: 'opening', choiceId: '1', choiceText: 'Push back', timestamp: 10 });
		const next = makeScene({
			sceneId: 'scene_2',
			storyThreadUpdates: { oswaldoConflict: 2 }
		});

		applySceneTransition(state, next);

		expect(state.currentSceneId).toBe('scene_2');
		expect(state.sceneCount).toBe(1);
		expect(state.pendingTransitionBridge?.keys).toContain('oswaldoConflict');
		expect(state.sceneLog[0]?.viaChoiceText).toBe('Push back');
	});

	test('derivePendingTransitionBridge returns null when nothing changed', () => {
		const state = createGameState();
		const bridge = derivePendingTransitionBridge(state.storyThreads, { ...state.storyThreads });
		expect(bridge).toBeNull();
	});
});
