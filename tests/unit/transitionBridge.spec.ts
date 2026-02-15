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
		expect(bridge.lines.length).toBeGreaterThan(0);
		expect(bridge.lines.join(' ')).toContain('open war');
	});

	test('returns empty bridge when there are no thread changes', () => {
		const previous = createStoryThreads();
		const current = { ...previous };

		const bridge = detectThreadTransitions(previous, current);
		expect(bridge.keys).toEqual([]);
		expect(bridge.lines).toEqual([]);
	});
});

