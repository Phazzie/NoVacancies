import { expect, test } from '@playwright/test';
import { createGameState } from '../../src/lib/contracts/game';
import { buildNarrativeContext } from '../../src/lib/game/narrativeContext';

test.describe('Narrative context contract', () => {
	test('returns the expected shape with derived opening and choice memory', () => {
		const state = createGameState();
		state.sceneCount = 3;
		state.sceneLog.push(
			{
				sceneId: 'opening',
				sceneText: 'The motel door keeps score before the sun does. Sydney checks the clock again.',
				viaChoiceText: '',
				isEnding: false
			},
			{
				sceneId: 'scene_2',
				sceneText: 'Oswaldo asks for coffee money while her phones vibrate in sequence.',
				viaChoiceText: 'Ask where yesterday\'s money went',
				isEnding: false
			},
			{
				sceneId: 'scene_3',
				sceneText: 'Dex arrives smiling and repeats her private line back with different punctuation.',
				viaChoiceText: 'Call Dex out',
				isEnding: false
			}
		);
		state.history.push(
			{ sceneId: 'opening', choiceId: 'c1', choiceText: 'Ask where yesterday\'s money went', timestamp: 1 },
			{ sceneId: 'scene_2', choiceId: 'c2', choiceText: 'Call Dex out', timestamp: 2 }
		);

		const context = buildNarrativeContext(state, { lastChoiceText: 'Call Dex out' });

		expect(context).toMatchObject({
			sceneCount: 3,
			lastChoiceText: 'Call Dex out',
			threadState: state.storyThreads,
			transitionBridge: null
		});

		expect(context.recentOpenings).toEqual([
			'Dex arrives smiling and repeats her private line back with different punctuation',
			'Oswaldo asks for coffee money while her phones vibrate in sequence',
			'The motel door keeps score before the sun does'
		]);
		expect(context.recentChoiceTexts).toEqual([
			"Ask where yesterday's money went",
			'Call Dex out'
		]);
		expect(context.recentSceneProse).toEqual([
			{
				sceneId: 'scene_2',
				text: 'Oswaldo asks for coffee money while her phones vibrate in sequence.',
				viaChoiceText: 'Ask where yesterday\'s money went'
			},
			{
				sceneId: 'scene_3',
				text: 'Dex arrives smiling and repeats her private line back with different punctuation.',
				viaChoiceText: 'Call Dex out'
			}
		]);
		expect(context.olderSceneSummaries).toEqual([
			'[Choice: n/a] The motel door keeps score before the sun does'
		]);
		expect(context.meta.budgetChars).toBeGreaterThan(0);
		expect(context.meta.contextChars).toBeGreaterThan(0);
		expect(context.meta.truncated).toBe(false);
	});
});
