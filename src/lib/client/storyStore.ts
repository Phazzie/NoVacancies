import { writable } from 'svelte/store';
import { LocalStorageStoryRepository } from '../services/storyRepository';
import type { StoryConfig } from '../contracts/story';
import { SPACE_STATION_STORY } from '../data/stories/spaceStation';
import { NO_VACANCIES_STORY } from '../data/defaultStory';

export const localStoryRepository = new LocalStorageStoryRepository();

/**
 * Creates a Svelte store that manages a library of StoryConfig objects persisted in local storage.
 *
 * The store exposes a subscribe function plus methods to load stories from persistence (seeding two defaults when none exist), save a story, and delete a story; each method updates the store to reflect the repository state.
 *
 * @returns An object with:
 *  - subscribe: the store subscription function for the current array of stories
 *  - load: loads stories from persistent storage and seeds defaults if the repository is empty
 *  - save: saves a StoryConfig to persistent storage and refreshes the store
 *  - delete: removes a story by id from persistent storage and refreshes the store
 */
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