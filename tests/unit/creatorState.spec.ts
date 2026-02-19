import { expect, test } from '@playwright/test';
import {
    createEmptyDraft,
    createEmptyPublishState,
    deriveCreatorBadgeStatus,
    publishDraft,
    unpublish,
    validateDraft,
    type CreatorWorkspaceState
} from '../../src/lib/creator/storyBuilder';

function readyState(): CreatorWorkspaceState {
    return {
        draft: {
            ...createEmptyDraft(),
            title: 'Boundary Shift',
            synopsis:
                "Sydney has one night to decide if she keeps patching everyone else's emergencies or lets the fallout land where it belongs.",
            theme: 'Invisible labor and boundary debt',
            systemPrompt:
                'Write grounded second-person scenes with motive and consequence clarity. Keep every choice tense and costly.',
            userPrompt:
                'Generate 2-3 choices with visible tradeoffs. Carry boundary pressure and relational consequences across turns.',
            assets: ['hotel_room']
        },
        publish: createEmptyPublishState()
    };
}

test('validation blocks publishing when draft fields are incomplete', () => {
    const state: CreatorWorkspaceState = {
        draft: createEmptyDraft(),
        publish: createEmptyPublishState()
    };
    const result = validateDraft(state.draft);

    expect(result.isReady).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(deriveCreatorBadgeStatus(state)).toBe('Draft');
});

test('publishing creates a version snapshot without mutating draft', () => {
    const state = readyState();
    const published = publishDraft(state);

    expect(published.publish.activeVersion).toBe(1);
    expect(published.publish.versions).toHaveLength(1);
    expect(published.publish.versions[0]?.snapshot.title).toBe(state.draft.title);
    expect(published.draft.title).toBe(state.draft.title);
    expect(deriveCreatorBadgeStatus(published)).toBe('Published');
});

test('unpublish keeps history but clears active version', () => {
    const published = publishDraft(readyState());
    const unpublished = unpublish(published);

    expect(unpublished.publish.activeVersion).toBeNull();
    expect(unpublished.publish.versions).toHaveLength(1);
    expect(deriveCreatorBadgeStatus(unpublished)).toBe('Ready');
});
