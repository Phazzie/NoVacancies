import { ImageKeys } from '$lib/contracts';

export const imagePaths: Record<string, string> = {
	[ImageKeys.HOTEL_ROOM]: '/images/hotel_room.png',
	[ImageKeys.SYDNEY_LAPTOP]: '/images/sydney_laptop.png',
	[ImageKeys.SYDNEY_THINKING]: '/images/sydney_thinking.png',
	[ImageKeys.SYDNEY_FRUSTRATED]: '/images/sydney_frustrated.png',
	[ImageKeys.SYDNEY_TIRED]: '/images/sydney_tired.png',
	[ImageKeys.SYDNEY_PHONE]: '/images/sydney_phone_anxious.png',
	[ImageKeys.SYDNEY_COFFEE]: '/images/sydney_coffee_morning.png',
	[ImageKeys.SYDNEY_WINDOW]: '/images/sydney_window_dawn.png',
	[ImageKeys.OSWALDO_SLEEPING]: '/images/oswaldo_sleeping.png',
	[ImageKeys.OSWALDO_AWAKE]: '/images/oswaldo_awake.png',
	[ImageKeys.THE_DOOR]: '/images/the_door.png',
	[ImageKeys.EMPTY_ROOM]: '/images/empty_room.png',
	[ImageKeys.MOTEL_EXTERIOR]: '/images/motel_exterior.png'
};

const pregeneratedImagePool: string[] = [
	'/images/ChatGPT Image Feb 7, 2026, 03_33_36 AM.png',
	'/images/ChatGPT Image Feb 7, 2026, 03_33_55 AM.png',
	'/images/ChatGPT Image Feb 7, 2026, 03_34_02 AM.png',
	'/images/ChatGPT Image Feb 7, 2026, 03_34_07 AM.png',
	'/images/ChatGPT Image Feb 7, 2026, 03_34_13 AM.png',
	'/images/ChatGPT Image Feb 7, 2026, 03_34_20 AM.png',
	'/images/car_memory.png',
	'/images/convenience_store.png',
	'/images/empty_room.png',
	'/images/hotel_room.png',
	'/images/motel_exterior.png',
	'/images/oswaldo_awake.png',
	'/images/oswaldo_sleeping.png',
	'/images/sydney_coffee_morning.png',
	'/images/sydney_frustrated.png',
	'/images/sydney_laptop.png',
	'/images/sydney_oswaldo_tension.png',
	'/images/sydney_phone_anxious.png',
	'/images/sydney_thinking.png',
	'/images/sydney_tired.png',
	'/images/sydney_window_dawn.png',
	'/images/the_door.png',
	'/images/trina_crashed.png'
].map((path) => encodeURI(path));

function hashSeed(seed: string): number {
	let hash = 2166136261;
	for (let index = 0; index < seed.length; index += 1) {
		hash ^= seed.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return hash >>> 0;
}

function pickFromPool(seed: string): string | null {
	if (pregeneratedImagePool.length === 0) return null;
	const index = hashSeed(seed) % pregeneratedImagePool.length;
	return pregeneratedImagePool[index];
}

export function resolveImagePath(
	imageKey: string | null | undefined,
	sceneId?: string | null
): string {
	const seed = (sceneId || imageKey || ImageKeys.HOTEL_ROOM).trim();
	const pooled = pickFromPool(seed);
	if (pooled) return pooled;
	if (!imageKey) return imagePaths[ImageKeys.HOTEL_ROOM];
	return imagePaths[imageKey] || imagePaths[ImageKeys.HOTEL_ROOM];
}
