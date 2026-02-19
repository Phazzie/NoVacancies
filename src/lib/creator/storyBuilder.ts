export interface CreatorDraft {
    templateId: string;
    title: string;
    synopsis: string;
    theme: string;
    systemPrompt: string;
    userPrompt: string;
    assets: string[];
    updatedAt: string;
}

export interface PublishedVersion {
    version: number;
    publishedAt: string;
    snapshot: CreatorDraft;
}

export interface CreatorPublishState {
    activeVersion: number | null;
    versions: PublishedVersion[];
}

export interface CreatorWorkspaceState {
    draft: CreatorDraft;
    publish: CreatorPublishState;
}

export interface ValidationResult {
    isReady: boolean;
    errors: string[];
}

export type CreatorBadgeStatus = 'Draft' | 'Ready' | 'Published';

const DRAFT_KEY = 'nv-creator-draft-v1';
const PUBLISH_KEY = 'nv-creator-publish-v1';

const STORY_TEMPLATES = {
    blank: {
        title: 'Untitled Story',
        synopsis: '',
        theme: '',
        systemPrompt: '',
        userPrompt: '',
        assets: []
    },
    comeback: {
        title: 'Night Shift Comeback',
        synopsis:
            "Sydney faces one long motel shift and has to decide whether to keep absorbing everyone else's chaos or finally redirect the work.",
        theme: 'Invisible labor, emotional debt, and the cost of staying available.',
        systemPrompt:
            'Keep scenes sensory and grounded. Every choice must force a tradeoff between short-term peace and long-term self-respect.',
        userPrompt:
            'Generate an opening scene in second person with 2-3 tense choices. Track boundaries and emotional carryover.',
        assets: ['hotel_room', 'sydney_phone_anxious']
    },
    reckoning: {
        title: 'Motel Reckoning',
        synopsis:
            'After a week of escalating favors, Sydney reaches the point where one small request could break the entire dynamic.',
        theme: 'Boundaries, manipulation, and choosing visible costs over hidden ones.',
        systemPrompt:
            'Write concise present-tense scenes with motive/consequence clarity. Keep prose cinematic and emotionally specific.',
        userPrompt:
            'Build scenes where each choice changes trust, pressure, or leverage. Endings should feel earned, not abrupt.',
        assets: ['motel_exterior', 'sydney_window_dawn']
    }
} as const;

type TemplateId = keyof typeof STORY_TEMPLATES;

function nowIso(): string {
    return new Date().toISOString();
}

export function createEmptyDraft(): CreatorDraft {
    return {
        templateId: 'blank',
        title: STORY_TEMPLATES.blank.title,
        synopsis: STORY_TEMPLATES.blank.synopsis,
        theme: STORY_TEMPLATES.blank.theme,
        systemPrompt: STORY_TEMPLATES.blank.systemPrompt,
        userPrompt: STORY_TEMPLATES.blank.userPrompt,
        assets: [...STORY_TEMPLATES.blank.assets],
        updatedAt: nowIso()
    };
}

export function createEmptyPublishState(): CreatorPublishState {
    return {
        activeVersion: null,
        versions: []
    };
}

function safeParse<T>(raw: string | null, fallback: T): T {
    if (!raw) return fallback;
    try {
        const parsed = JSON.parse(raw) as T;
        return parsed ?? fallback;
    } catch {
        return fallback;
    }
}

function normalizeDraft(input: Partial<CreatorDraft> | null | undefined): CreatorDraft {
    const base = createEmptyDraft();
    if (!input || typeof input !== 'object') return base;

    return {
        templateId: typeof input.templateId === 'string' ? input.templateId : base.templateId,
        title: typeof input.title === 'string' ? input.title : base.title,
        synopsis: typeof input.synopsis === 'string' ? input.synopsis : base.synopsis,
        theme: typeof input.theme === 'string' ? input.theme : base.theme,
        systemPrompt:
            typeof input.systemPrompt === 'string' ? input.systemPrompt : base.systemPrompt,
        userPrompt: typeof input.userPrompt === 'string' ? input.userPrompt : base.userPrompt,
        assets: Array.isArray(input.assets)
            ? input.assets.filter((asset): asset is string => typeof asset === 'string')
            : base.assets,
        updatedAt: typeof input.updatedAt === 'string' ? input.updatedAt : base.updatedAt
    };
}

function normalizePublishState(
    input: Partial<CreatorPublishState> | null | undefined
): CreatorPublishState {
    const base = createEmptyPublishState();
    if (!input || typeof input !== 'object') return base;

    const versions = Array.isArray(input.versions)
        ? input.versions
              .filter(
                  (version): version is PublishedVersion =>
                      typeof version === 'object' &&
                      version !== null &&
                      typeof version.version === 'number' &&
                      typeof version.publishedAt === 'string' &&
                      typeof version.snapshot === 'object' &&
                      version.snapshot !== null
              )
              .map((version) => ({
                  ...version,
                  snapshot: normalizeDraft(version.snapshot)
              }))
        : base.versions;

    const activeVersion =
        typeof input.activeVersion === 'number' &&
        versions.some((version) => version.version === input.activeVersion)
            ? input.activeVersion
            : null;

    return {
        activeVersion,
        versions
    };
}

function draftFingerprint(draft: CreatorDraft): string {
    return JSON.stringify({
        title: draft.title.trim(),
        synopsis: draft.synopsis.trim(),
        theme: draft.theme.trim(),
        systemPrompt: draft.systemPrompt.trim(),
        userPrompt: draft.userPrompt.trim(),
        assets: draft.assets.map((asset) => asset.trim()).filter(Boolean)
    });
}

export function validateDraft(draft: CreatorDraft): ValidationResult {
    const errors: string[] = [];
    if (draft.title.trim().length < 5) errors.push('Title must be at least 5 characters.');
    if (draft.synopsis.trim().length < 30) errors.push('Synopsis must be at least 30 characters.');
    if (draft.theme.trim().length < 10) errors.push('Theme must be at least 10 characters.');
    if (draft.systemPrompt.trim().length < 30) {
        errors.push('System prompt must be at least 30 characters.');
    }
    if (draft.userPrompt.trim().length < 30) {
        errors.push('User prompt must be at least 30 characters.');
    }
    if (draft.assets.length === 0) errors.push('Add at least one visual asset key.');

    return {
        isReady: errors.length === 0,
        errors
    };
}

export function deriveCreatorBadgeStatus(state: CreatorWorkspaceState): CreatorBadgeStatus {
    const validation = validateDraft(state.draft);
    if (!validation.isReady) return 'Draft';

    const activeVersion = state.publish.versions.find(
        (version) => version.version === state.publish.activeVersion
    );
    if (!activeVersion) return 'Ready';

    return draftFingerprint(state.draft) === draftFingerprint(activeVersion.snapshot)
        ? 'Published'
        : 'Ready';
}

export function listTemplateOptions(): Array<{ id: string; label: string; summary: string }> {
    return [
        {
            id: 'blank',
            label: 'Blank',
            summary: 'Start from scratch with empty metadata and prompt fields.'
        },
        {
            id: 'comeback',
            label: 'Night Shift Comeback',
            summary: 'Grounded pressure-cooker template focused on invisible labor tradeoffs.'
        },
        {
            id: 'reckoning',
            label: 'Motel Reckoning',
            summary: 'Escalation-first template for boundary collapse and recovery arcs.'
        }
    ];
}

export function applyTemplate(draft: CreatorDraft, templateId: string): CreatorDraft {
    const template =
        STORY_TEMPLATES[(templateId as TemplateId) ?? 'blank'] ?? STORY_TEMPLATES.blank;
    return {
        templateId,
        title: template.title,
        synopsis: template.synopsis,
        theme: template.theme,
        systemPrompt: template.systemPrompt,
        userPrompt: template.userPrompt,
        assets: [...template.assets],
        updatedAt: nowIso()
    };
}

export function publishDraft(state: CreatorWorkspaceState): CreatorWorkspaceState {
    const nextVersionNumber = state.publish.versions.length
        ? Math.max(...state.publish.versions.map((version) => version.version)) + 1
        : 1;

    const version: PublishedVersion = {
        version: nextVersionNumber,
        publishedAt: nowIso(),
        snapshot: {
            ...state.draft,
            assets: [...state.draft.assets],
            updatedAt: nowIso()
        }
    };

    return {
        draft: {
            ...state.draft,
            assets: [...state.draft.assets]
        },
        publish: {
            activeVersion: version.version,
            versions: [version, ...state.publish.versions]
        }
    };
}

export function unpublish(state: CreatorWorkspaceState): CreatorWorkspaceState {
    return {
        draft: {
            ...state.draft,
            assets: [...state.draft.assets]
        },
        publish: {
            ...state.publish,
            activeVersion: null
        }
    };
}

export function loadCreatorState(storage: Storage | null | undefined): CreatorWorkspaceState {
    let draftRaw: string | null = null;
    let publishRaw: string | null = null;

    try {
        draftRaw = storage?.getItem(DRAFT_KEY) ?? null;
        publishRaw = storage?.getItem(PUBLISH_KEY) ?? null;
    } catch {
        return {
            draft: createEmptyDraft(),
            publish: createEmptyPublishState()
        };
    }

    const draft = normalizeDraft(safeParse<CreatorDraft | null>(draftRaw, null));
    const publish = normalizePublishState(safeParse<CreatorPublishState | null>(publishRaw, null));
    return { draft, publish };
}

export function saveCreatorState(
    storage: Storage | null | undefined,
    state: CreatorWorkspaceState
): void {
    if (!storage) return;
    try {
        storage.setItem(DRAFT_KEY, JSON.stringify(state.draft));
        storage.setItem(PUBLISH_KEY, JSON.stringify(state.publish));
    } catch {
        // Silent fail keeps creator flow usable even with blocked storage.
    }
}
