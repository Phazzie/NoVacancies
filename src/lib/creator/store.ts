import { writable } from 'svelte/store';
import {
    applyTemplate,
    createEmptyDraft,
    createEmptyPublishState,
    deriveCreatorBadgeStatus,
    loadCreatorState,
    publishDraft,
    saveCreatorState,
    unpublish,
    validateDraft,
    type CreatorBadgeStatus,
    type CreatorWorkspaceState,
    type ValidationResult
} from './storyBuilder';

interface CreatorStore extends ReturnType<typeof writable<CreatorWorkspaceState>> {
    initialize(): void;
    setTemplate(templateId: string): void;
    patchDraft(patch: Partial<CreatorWorkspaceState['draft']>): void;
    publish(): void;
    unpublish(): void;
    getValidation(state: CreatorWorkspaceState): ValidationResult;
    getBadgeStatus(state: CreatorWorkspaceState): CreatorBadgeStatus;
}

const initialState: CreatorWorkspaceState = {
    draft: createEmptyDraft(),
    publish: createEmptyPublishState()
};

function createCreatorStore(): CreatorStore {
    const base = writable<CreatorWorkspaceState>(initialState);

    const persist = (state: CreatorWorkspaceState): void => {
        if (typeof window === 'undefined') return;
        saveCreatorState(window.localStorage, state);
    };

    const updateAndPersist = (
        updater: (state: CreatorWorkspaceState) => CreatorWorkspaceState
    ): void => {
        base.update((state) => {
            const next = updater(state);
            persist(next);
            return next;
        });
    };

    return {
        ...base,
        initialize: (): void => {
            if (typeof window === 'undefined') return;
            const loaded = loadCreatorState(window.localStorage);
            base.set(loaded);
        },
        setTemplate: (templateId: string): void => {
            updateAndPersist((state) => ({
                ...state,
                draft: applyTemplate(state.draft, templateId)
            }));
        },
        patchDraft: (patch): void => {
            updateAndPersist((state) => ({
                ...state,
                draft: {
                    ...state.draft,
                    ...patch,
                    assets: Array.isArray(patch.assets)
                        ? patch.assets.filter((asset): asset is string => typeof asset === 'string')
                        : [...state.draft.assets],
                    updatedAt: new Date().toISOString()
                }
            }));
        },
        publish: (): void => {
            updateAndPersist((state) => {
                const validation = validateDraft(state.draft);
                if (!validation.isReady) return state;
                return publishDraft(state);
            });
        },
        unpublish: (): void => {
            updateAndPersist((state) => unpublish(state));
        },
        getValidation: (state) => validateDraft(state.draft),
        getBadgeStatus: (state) => deriveCreatorBadgeStatus(state)
    };
}

export const creatorStore = createCreatorStore();
