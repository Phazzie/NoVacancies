import { expect, test } from '@playwright/test';
import { createGameState } from '../../src/lib/contracts/game';
import { buildNarrativeContext } from '../../src/lib/game/narrativeContext';
import { getActiveStoryCartridge } from '../../src/lib/stories';

async function importNarrativeFacadeFresh() {
	return import(`../../src/lib/server/ai/narrative.ts?stamp=${Date.now()}-${Math.random()}`);
}

test.describe('Prompt ownership delegation', () => {
	test.afterEach(() => {
		delete process.env.PUBLIC_STORY_ID;
	});

	test('uses active cartridge prompts for opening/continue/recovery', async () => {
		process.env.PUBLIC_STORY_ID = 'starter-kit';
		const narrative = await importNarrativeFacadeFresh();
		const active = getActiveStoryCartridge();

		const state = createGameState();
		state.sceneLog.push({
			sceneId: 'opening',
			sceneText: 'Morning pressure gathers around a single unpaid bill.',
			viaChoiceText: '',
			isEnding: false
		});
		state.history.push({
			sceneId: 'opening',
			choiceId: 'wait',
			choiceText: 'Wait and observe',
			timestamp: 1
		});
		state.sceneCount = 1;
		const context = buildNarrativeContext(state, { lastChoiceText: 'Wait and observe' });

		expect(narrative.SYSTEM_PROMPT).toBe(active.prompts.systemPrompt);
		expect(narrative.getOpeningPrompt()).toBe(active.prompts.getOpeningPrompt());
		expect(narrative.getContinuePromptFromContext(context)).toBe(
			active.prompts.getContinuePromptFromContext(context)
		);
		expect(narrative.getRecoveryPrompt('bad json')).toBe(active.prompts.getRecoveryPrompt('bad json'));
	});
});
