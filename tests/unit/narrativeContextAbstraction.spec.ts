import { expect, test } from '@playwright/test';
import { buildNarrativeContext } from '../../src/lib/game/narrativeContext';
import { createGameState } from '../../src/lib/contracts/game';

test.describe('Narrative context abstraction', () => {
	test('builds recent opening memory from scene prose instead of beat labels', () => {
		const state = createGameState();
		state.sceneLog.push(
			{
				sceneId: 'opening',
				sceneText: 'The motel door keeps score before the sun does. Sydney counts the gap again.',
				viaChoiceText: '',
				isEnding: false
			},
			{
				sceneId: 'scene_2',
				sceneText: 'Oswaldo asks what she did all morning while the room smells like cold fries.',
				viaChoiceText: 'Ask him for help',
				isEnding: false
			},
			{
				sceneId: 'scene_3',
				sceneText: 'Dex smiles like he already knows which version of this story he is going to sell.',
				viaChoiceText: 'Call Dex',
				isEnding: false
			}
		);

		const context = buildNarrativeContext(state, { lastChoiceText: 'Push harder' });
		expect(context.recentOpenings.length).toBeGreaterThan(0);
		expect(context.recentOpenings.join(' ')).toContain('motel door keeps score');
		expect(context.recentChoiceTexts).toEqual(expect.arrayContaining(['Ask him for help', 'Call Dex']));
	});

	test('stores dynamic before/after transition bridge moments', () => {
		const state = createGameState();
		state.storyThreads.oswaldoConflict = 0;
		state.pendingTransitionBridge = {
			keys: ['oswaldoConflict'],
			moments: [
				{
					key: 'oswaldoConflict',
					before:
						"Oswaldo hasn't been challenged yet. The resentment waits underneath like a dog that has not decided whether to bark.",
					after:
						"Things with Oswaldo do not argue anymore. They just collide and wait to see who apologizes first.",
					bridge: 'STATE SHIFT: oswaldoConflict moved from before to after.'
				}
			]
		};

		const context = buildNarrativeContext(state, { lastChoiceText: 'Press him now' });
		expect(context.transitionBridge?.moments[0]?.before).toContain('resentment waits underneath');
		expect(context.transitionBridge?.moments[0]?.after).toContain('collide and wait');
	});
});
