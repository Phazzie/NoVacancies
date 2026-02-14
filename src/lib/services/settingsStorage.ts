import {
	DEFAULT_SETTINGS,
	type EndingType,
	type GameSettings
} from '../contracts';

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
	endings: 'sydney-story-endings'
});

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
	loadUnlockedEndings(): EndingType[];
	saveUnlockedEndings(endings: EndingType[]): EndingType[];
}

export function createSettingsStorage(bindings: StorageBindings = {}): SettingsStorage {
	const local = bindings.local ?? null;

	const loadUnlockedEndings = (): EndingType[] =>
		parseStringArray(safeRead(local, STORAGE_KEYS.endings)) as EndingType[];

	const loadSettings = (): GameSettings => {
		const base: GameSettings = {
			...DEFAULT_SETTINGS,
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
				showLessons:
					typeof parsed.showLessons === 'boolean' ? parsed.showLessons : base.showLessons,
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
			unlockedEndings: (patch.unlockedEndings ?? loadUnlockedEndings()) as EndingType[]
		};

		safeWrite(
			local,
			STORAGE_KEYS.settings,
			JSON.stringify({
				showLessons: next.showLessons
			})
		);

		if (patch.unlockedEndings) {
			saveUnlockedEndings(next.unlockedEndings);
		}

		return next;
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
		loadUnlockedEndings,
		saveUnlockedEndings
	};
}
