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

export function resolveImagePath(imageKey: string | null | undefined): string {
	if (!imageKey) return imagePaths[ImageKeys.HOTEL_ROOM];
	return imagePaths[imageKey] || imagePaths[ImageKeys.HOTEL_ROOM];
}
