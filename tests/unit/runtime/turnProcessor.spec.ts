import { expect, test } from '@playwright/test';
import { cloneGameState, type GameState, type Scene } from '../../../src/lib/contracts/game';
import { createTurnProcessor, type RuntimeRefs } from '../../../src/lib/game/runtime/turnProcessor';
import type { EndingPayload } from '../../../src/lib/game/runtime/endingPolicy';

function makeScene(overrides: Partial<Scene> = {}): Scene {
	return {
		sceneId: 'opening',
		sceneText: 'Opening.',
		choices: [{ id: '1', text: 'Go' }],
		lessonId: null,
		imageKey: 'hotel_room',
		isEnding: false,
		endingType: null,
		...overrides
	};
}

function createProcessorHarness(overrides: {
	opening?: Scene;
	next?: Scene;
	nextThrows?: boolean;
} = {}) {
	const refs: RuntimeRefs = {
		gameState: null,
		currentScene: null,
		lastEnding: null,
		processing: false
	};

	const opening = overrides.opening ?? makeScene();
	const next = overrides.next ?? makeScene({ sceneId: 'scene_2', sceneText: 'Next scene.' });
	const storyService = {
		getOpeningScene: async () => opening,
		getNextScene: async () => {
			if (overrides.nextThrows) {
				throw new Error('boom');
			}
			return next;
		}
	};

	const buildTurnResult = (scene: Scene) => ({
		scene,
		gameState: cloneGameState(refs.gameState as GameState),
		isEnding: scene.isEnding,
		ending: refs.lastEnding
	});

	const buildEndingPayload = (scene: Scene): EndingPayload => ({
		endingType: scene.endingType ?? 'loop',
		sceneId: scene.sceneId,
		stats: {
			sceneCount: refs.gameState?.sceneCount ?? 0,
			lessonsCount: refs.gameState?.lessonsEncountered.length ?? 0,
			durationMs: 10
		},
		unlockedEndings: ['loop']
	});

	const processor = createTurnProcessor({
		storyService,
		cartridge: {
			initialSceneId: 'opening',
			createInitialStoryThreads: () => ({
				oswaldoConflict: 0,
				trinaTension: 0,
				moneyResolved: false,
				carMentioned: false,
				sydneyRealization: 0,
				boundariesSet: [],
				oswaldoAwareness: 0,
				exhaustionLevel: 1,
				dexTriangulation: 0
			})
		},
		now: () => 100,
		refs,
		buildTurnResult,
		buildEndingPayload
	});

	return { processor, refs };
}

test.describe('runtime/turnProcessor', () => {
	test('startGame initializes refs and returns first turn result', async () => {
		const { processor, refs } = createProcessorHarness();
		const result = await processor.startGame();

		expect(refs.gameState?.currentSceneId).toBe('opening');
		expect(refs.currentScene?.sceneId).toBe('opening');
		expect(result.gameState.currentSceneId).toBe('opening');
		expect(result.scene.sceneText).toBe('Opening.');
	});

	test('handleChoice appends history and resets processing on success', async () => {
		const { processor, refs } = createProcessorHarness();
		await processor.startGame();
		const result = await processor.handleChoice('1', 'Ask directly');

		expect(refs.processing).toBe(false);
		expect(refs.gameState?.history).toHaveLength(1);
		expect(refs.gameState?.history[0]?.choiceText).toBe('Ask directly');
		expect(result.scene.sceneId).toBe('scene_2');
	});

	test('handleChoice rolls back pushed history entry when next scene fetch fails', async () => {
		const { processor, refs } = createProcessorHarness({ nextThrows: true });
		await processor.startGame();

		await expect(processor.handleChoice('1', 'Risky move')).rejects.toThrow('boom');
		expect(refs.gameState?.history).toHaveLength(0);
		expect(refs.processing).toBe(false);
	});
});
