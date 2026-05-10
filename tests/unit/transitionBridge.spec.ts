import { expect, test } from '@playwright/test';
import { createStoryThreads } from '../../src/lib/contracts/game';
import { detectThreadTransitions } from '../../src/lib/game/narrativeContext';

test.describe('Transition Bridge Selection', () => {
	test('selects mapped bridge lines for changed thread keys', () => {
		const previous = createStoryThreads();
		const current = {
			...previous,
			oswaldoConflict: 2,
			dexTriangulation: 2
		};

		const bridge = detectThreadTransitions(previous, current);

		expect(bridge.keys).toEqual(expect.arrayContaining(['oswaldoConflict', 'dexTriangulation']));
		expect(bridge.moments.length).toBeGreaterThan(0);
		expect(bridge.moments.map((moment) => moment.key)).toEqual(
			expect.arrayContaining(['oswaldoConflict', 'dexTriangulation'])
		);
		// Verify transition moments have populated before/after narrative bridges
		expect(bridge.moments[0]?.before).toBeTruthy();
		expect(bridge.moments[0]?.before).toMatch(/\S+/); // has non-whitespace content
		expect(bridge.moments[0]?.after).toBeTruthy();
		expect(bridge.moments[0]?.after).toMatch(/\S+/); // has non-whitespace content
	});

	test('returns empty bridge when there are no thread changes', () => {
		const previous = createStoryThreads();
		const current = { ...previous };

		const bridge = detectThreadTransitions(previous, current);
		expect(bridge.keys).toEqual([]);
		expect(bridge.moments).toEqual([]);
	});
});
