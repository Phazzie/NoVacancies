import {
	DEFAULT_FEATURE_FLAGS,
	DEFAULT_SETTINGS,
	normalizeFeatureFlags,
	type EndingType,
	type GameSettings,
	type RuntimeFeatureFlags
} from '$lib/contracts';

export interface StorageLike {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
	removeItem(key: string): void;
}

export interface StorageBindings {
	local?: StorageLike | null;
	session?: StorageLike | null;
}

export const STORAGE_KEYS = Object.freeze({
	settings: 'sydney-story-settings',
	endings: 'sydney-story-endings',
	featureFlags: 'sydney-story-feature-flags'
});

function parseBooleanFlag(value: unknown): boolean | undefined {
	if (typeof value === 'boolean') return value;
	if (typeof value !== 'string') return undefined;
	const normalized = value.trim().toLowerCase();
	if (['1', 'true', 'on', 'yes', 'enabled', 'enable'].includes(normalized)) return true;
	if (['0', 'false', 'off', 'no', 'disabled', 'disable'].includes(normalized)) return false;
	return undefined;
}

function safeRead(storage: StorageLike | null | undefined, key: string): string | null {
	if (!storage) return null;
	try {
		return storage.getItem(key);
	} catch {
		return null;
	}
}

function safeWrite(storage: StorageLike | null | undefined, key: string, value: string): boolean {
	if (!storage) return false;
	try {
		storage.setItem(key, value);
		return true;
	} catch {
		return false;
	}
}

function safeRemove(storage: StorageLike | null | undefined, key: string): void {
	if (!storage) return;
	try {
		storage.removeItem(key);
	} catch {
		// no-op
	}
}

function parseStringArray(raw: string | null): string[] {
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((value) => typeof value === 'string' && value.trim().length > 0);
	} catch {
		return [];
	}
}

export interface SettingsStorage {
	loadSettings(): GameSettings;
	saveSettings(patch: Partial<GameSettings>): GameSettings;
	loadFeatureFlags(): RuntimeFeatureFlags;
	saveFeatureFlags(flags: Partial<RuntimeFeatureFlags>): RuntimeFeatureFlags;
	clearFeatureFlags(): RuntimeFeatureFlags;
	loadUnlockedEndings(): EndingType[];
	saveUnlockedEndings(endings: EndingType[]): EndingType[];
}

export function createSettingsStorage(bindings: StorageBindings = {}): SettingsStorage {
	const local = bindings.local ?? null;

	const loadFeatureFlags = (): RuntimeFeatureFlags => {
		const saved = safeRead(local, STORAGE_KEYS.featureFlags);
		if (!saved) return { ...DEFAULT_FEATURE_FLAGS };
		try {
			const parsed = JSON.parse(saved) as Partial<RuntimeFeatureFlags> | null;
			if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_FEATURE_FLAGS };
			return normalizeFeatureFlags({
				narrativeContextV2: parseBooleanFlag(parsed.narrativeContextV2),
				transitionBridges: parseBooleanFlag(parsed.transitionBridges)
			});
		} catch {
			return { ...DEFAULT_FEATURE_FLAGS };
		}
	};

	const loadUnlockedEndings = (): EndingType[] =>
		parseStringArray(safeRead(local, STORAGE_KEYS.endings)) as EndingType[];

	const loadSettings = (): GameSettings => {
		const base: GameSettings = {
			...DEFAULT_SETTINGS,
			featureFlags: loadFeatureFlags(),
			apiKey: '',
			unlockedEndings: loadUnlockedEndings()
		};

		const saved = safeRead(local, STORAGE_KEYS.settings);
		if (!saved) return base;

		try {
			const parsed = JSON.parse(saved) as Partial<GameSettings> | null;
			if (!parsed || typeof parsed !== 'object') return base;
			return {
				...base,
				useMocks: typeof parsed.useMocks === 'boolean' ? parsed.useMocks : base.useMocks,
				showLessons:
					typeof parsed.showLessons === 'boolean' ? parsed.showLessons : base.showLessons,
				featureFlags: base.featureFlags,
				unlockedEndings: base.unlockedEndings,
				apiKey: base.apiKey
			};
		} catch {
			return base;
		}
	};

	const saveSettings = (patch: Partial<GameSettings>): GameSettings => {
		const next = {
			...loadSettings(),
			...patch,
			featureFlags: normalizeFeatureFlags(patch.featureFlags ?? loadFeatureFlags()),
			unlockedEndings: (patch.unlockedEndings ?? loadUnlockedEndings()) as EndingType[]
		};

		safeWrite(
			local,
			STORAGE_KEYS.settings,
			JSON.stringify({
				useMocks: next.useMocks,
				showLessons: next.showLessons
			})
		);

		if (patch.unlockedEndings) {
			saveUnlockedEndings(next.unlockedEndings);
		}
		if (patch.featureFlags) {
			saveFeatureFlags(next.featureFlags);
		}

		return next;
	};

	const saveFeatureFlags = (flags: Partial<RuntimeFeatureFlags>): RuntimeFeatureFlags => {
		const normalized = normalizeFeatureFlags(flags);
		safeWrite(local, STORAGE_KEYS.featureFlags, JSON.stringify(normalized));
		return normalized;
	};

	const clearFeatureFlags = (): RuntimeFeatureFlags => {
		safeRemove(local, STORAGE_KEYS.featureFlags);
		return { ...DEFAULT_FEATURE_FLAGS };
	};

	const saveUnlockedEndings = (endings: EndingType[]): EndingType[] => {
		const normalized = endings.filter(
			(ending): ending is EndingType => typeof ending === 'string' && ending.trim().length > 0
		);
		safeWrite(local, STORAGE_KEYS.endings, JSON.stringify(normalized));
		return normalized;
	};

	return {
		loadSettings,
		saveSettings,
		loadFeatureFlags,
		saveFeatureFlags,
		clearFeatureFlags,
		loadUnlockedEndings,
		saveUnlockedEndings
	};
}
