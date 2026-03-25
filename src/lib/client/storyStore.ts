import { writable } from 'svelte/store';
import { LocalStorageStoryRepository } from '../services/storyRepository';
import type { StoryConfig } from '../contracts/story';
import { SPACE_STATION_STORY } from '../data/stories/spaceStation';
import { NO_VACANCIES_STORY } from '../data/defaultStory';

export const localStoryRepository = new LocalStorageStoryRepository();

function createStoryStore() {
    const { subscribe, set } = writable<StoryConfig[]>([]);

    return {
        subscribe,
        load: async () => {
            if (typeof window === 'undefined') return;
            const stories = await localStoryRepository.listStories();
            // Seed with default stories if empty or missing
            if (stories.length === 0) {
                await localStoryRepository.saveStory(SPACE_STATION_STORY);
                await localStoryRepository.saveStory(NO_VACANCIES_STORY);
                const seeded = await localStoryRepository.listStories();
                set(seeded);
            } else {
                set(stories);
            }
        },
        save: async (story: StoryConfig) => {
            await localStoryRepository.saveStory(story);
            const stories = await localStoryRepository.listStories();
            set(stories);
        },
        delete: async (id: string) => {
            await localStoryRepository.deleteStory(id);
            const stories = await localStoryRepository.listStories();
            set(stories);
        }
    };
}

export const storyLibrary = createStoryStore();
