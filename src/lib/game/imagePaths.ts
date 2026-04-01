import { ImageKeys } from '$lib/contracts';
import { selectStoryUiAssets } from '$lib/stories/selectors';

const fallbackImagePaths: Record<string, string> = {
	[ImageKeys.HOTEL_ROOM]: '/images/hotel_room.png'
};

function getStoryImageConfig() {
	const uiAssets = selectStoryUiAssets();
	return {
		imagePaths: uiAssets.imagePaths,
		pregeneratedImagePool: uiAssets.pregeneratedImagePool
	};
}

function hashSeed(seed: string): number {
	let hash = 2166136261;
	for (let index = 0; index < seed.length; index += 1) {
		hash ^= seed.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return hash >>> 0;
}

function pickFromPool(seed: string): string | null {
	const { pregeneratedImagePool } = getStoryImageConfig();
	if (pregeneratedImagePool.length === 0) return null;
	const index = hashSeed(seed) % pregeneratedImagePool.length;
	return pregeneratedImagePool[index];
}

export function resolveImagePath(
	imageKey: string | null | undefined,
	sceneId?: string | null
): string {
	const { imagePaths } = getStoryImageConfig();
	const normalizedKey = typeof imageKey === 'string' ? imageKey.trim() : '';
	// Scene-authored image keys are the strongest signal; the pregenerated pool is only a fallback.
	if (normalizedKey && imagePaths[normalizedKey]) {
		return imagePaths[normalizedKey];
	}

	const seed = (sceneId || normalizedKey || ImageKeys.HOTEL_ROOM).trim();
	const pooled = pickFromPool(seed);
	if (pooled) return pooled;

	if (normalizedKey) {
		return imagePaths[ImageKeys.HOTEL_ROOM] ?? fallbackImagePaths[ImageKeys.HOTEL_ROOM];
	}

	return imagePaths[ImageKeys.HOTEL_ROOM] ?? fallbackImagePaths[ImageKeys.HOTEL_ROOM];
}
