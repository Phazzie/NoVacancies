import { expect, test } from '@playwright/test';
import { ImageKeys } from '../../src/lib/contracts';
import { noVacanciesCartridge } from '../../src/lib/stories/no-vacancies';
import { resolveImagePath } from '../../src/lib/game/imagePaths';

test.describe('Image path resolution', () => {
	test('prefers explicit image keys over the pregenerated pool', () => {
		const explicit = resolveImagePath(ImageKeys.THE_DOOR, 'scene-explicit-door');
		expect(explicit).toBe('/images/the_door.png');
	});

	test('uses the pregenerated pool when the key is missing', () => {
		const pooled = resolveImagePath(null, 'scene-pooled');
		expect(noVacanciesCartridge.ui.pregeneratedImagePool).toContain(pooled);
	});

	test('uses the pregenerated pool for unmapped keys when the story has one', () => {
		const pooled = resolveImagePath('not-a-real-key', 'scene-unmapped');
		expect(noVacanciesCartridge.ui.pregeneratedImagePool).toContain(pooled);
	});
});
