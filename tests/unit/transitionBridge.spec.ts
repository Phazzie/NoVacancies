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
		expect(bridge.moments[0]?.before).toContain('resentment waits underneath');
		expect(bridge.moments[0]?.after).toContain('collide and wait');
	});

	test('returns empty bridge when there are no thread changes', () => {
		const previous = createStoryThreads();
		const current = { ...previous };

		const bridge = detectThreadTransitions(previous, current);
		expect(bridge.keys).toEqual([]);
		expect(bridge.moments).toEqual([]);
	});
});
