import { ImageKeys } from '$lib/contracts';
import { getActiveStoryCartridge } from '$lib/stories';

const fallbackImagePaths: Record<string, string> = {
	[ImageKeys.HOTEL_ROOM]: '/images/hotel_room.png'
};

function getStoryImageConfig() {
	const cartridge = getActiveStoryCartridge();
	return {
		imagePaths: cartridge.ui.imagePaths,
		pregeneratedImagePool: cartridge.ui.pregeneratedImagePool
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
	const seed = (sceneId || imageKey || ImageKeys.HOTEL_ROOM).trim();
	const pooled = pickFromPool(seed);
	if (pooled) return pooled;
	if (!imageKey) return imagePaths[ImageKeys.HOTEL_ROOM] ?? fallbackImagePaths[ImageKeys.HOTEL_ROOM];
	return imagePaths[imageKey] ?? imagePaths[ImageKeys.HOTEL_ROOM] ?? fallbackImagePaths[ImageKeys.HOTEL_ROOM];
}
