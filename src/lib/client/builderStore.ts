import { writable, get } from 'svelte/store';
import type { StoryConfig, Character, Mechanic, EndingRule } from '../contracts/story';
import { localStoryRepository } from './storyStore';

const EMPTY_STORY: StoryConfig = {
    id: '',
    title: 'Untitled Story',
    author: 'Anonymous',
    premise: '',
    genre: '',
    theme: {
        primaryColor: '#ffffff',
        secondaryColor: '#000000',
        backgroundColor: '#1a1a1a',
        fontFamily: 'sans-serif'
    },
    characters: [],
    openingPrompt: '',
    mechanics: [],
    endingRules: []
};

/**
 * Creates a Svelte store for constructing and editing a StoryConfig.
 *
 * The store is initialized with a default StoryConfig template and exposes helpers
 * to initialize from an id or create a new story, update individual fields,
 * persist the story, and manage characters and mechanics by index.
 *
 * @returns An object containing `subscribe` and `set` from the Svelte store and helper methods:
 * `init(id)`, `updateField(field, value)`, `save()`, `addCharacter(char)`, `updateCharacter(index, char)`,
 * `removeCharacter(index)`, `addMechanic(mech)`, `updateMechanic(index, mech)`, and `removeMechanic(index)`.
 */
function createBuilderStore() {
    const { subscribe, set, update } = writable<StoryConfig>(JSON.parse(JSON.stringify(EMPTY_STORY)));

    return {
        subscribe,
        set,
        init: (id: string | null) => {
            if (!id) {
                const newStory = JSON.parse(JSON.stringify(EMPTY_STORY));
                newStory.id = crypto.randomUUID();
                set(newStory);
            } else {
                localStoryRepository.getStory(id).then(story => {
                    if (story) {
                        // Ensure theme exists
                        if (!story.theme) {
                            story.theme = { ...EMPTY_STORY.theme };
                        }
                        set(story);
                    }
                });
            }
        },
        updateField: <K extends keyof StoryConfig>(field: K, value: StoryConfig[K]) => {
            update(s => ({ ...s, [field]: value }));
        },
        save: async () => {
            const story = get(builderStore);
            if (story.id) {
                await localStoryRepository.saveStory(story);
            }
        },
        addCharacter: (char: Character) => {
            update(s => ({ ...s, characters: [...s.characters, char] }));
        },
        updateCharacter: (index: number, char: Character) => {
            update(s => {
                const chars = [...s.characters];
                chars[index] = char;
                return { ...s, characters: chars };
            });
        },
        removeCharacter: (index: number) => {
            update(s => ({ ...s, characters: s.characters.filter((_, i) => i !== index) }));
        },
        addMechanic: (mech: Mechanic) => {
            update(s => ({ ...s, mechanics: [...s.mechanics, mech] }));
        },
        updateMechanic: (index: number, mech: Mechanic) => {
            update(s => {
                const mechs = [...s.mechanics];
                mechs[index] = mech;
                return { ...s, mechanics: mechs };
            });
        },
        removeMechanic: (index: number) => {
            update(s => ({ ...s, mechanics: s.mechanics.filter((_, i) => i !== index) }));
        }
    };
}

export const builderStore = createBuilderStore();