import { browser } from '$app/environment';

const DEBUG_ERROR_STORAGE_KEY = 'sydney-story-debug-errors';
const MAX_DEBUG_ERRORS = 200;

export interface DebugErrorEntry {
	id: string;
	timestamp: string;
	scope: string;
	message: string;
	details?: Record<string, unknown>;
}

function safeReadRaw(): string | null {
	if (!browser) return null;
	try {
		return window.localStorage.getItem(DEBUG_ERROR_STORAGE_KEY);
	} catch {
		return null;
	}
}

function safeWriteRaw(value: string): void {
	if (!browser) return;
	try {
		window.localStorage.setItem(DEBUG_ERROR_STORAGE_KEY, value);
	} catch {
		// ignore storage write failures
	}
}

function parseEntries(raw: string | null): DebugErrorEntry[] {
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((entry) => {
			return (
				entry &&
				typeof entry === 'object' &&
				typeof entry.id === 'string' &&
				typeof entry.timestamp === 'string' &&
				typeof entry.scope === 'string' &&
				typeof entry.message === 'string'
			);
		}) as DebugErrorEntry[];
	} catch {
		return [];
	}
}

function nextId(): string {
	return `dbg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function readDebugErrors(): DebugErrorEntry[] {
	return parseEntries(safeReadRaw());
}

export function clearDebugErrors(): void {
	if (!browser) return;
	try {
		window.localStorage.removeItem(DEBUG_ERROR_STORAGE_KEY);
	} catch {
		// ignore storage removal failures
	}
}

export function appendDebugError(input: {
	scope: string;
	message: string;
	details?: Record<string, unknown>;
}): DebugErrorEntry {
	const entry: DebugErrorEntry = {
		id: nextId(),
		timestamp: new Date().toISOString(),
		scope: input.scope,
		message: input.message,
		details: input.details
	};

	const existing = readDebugErrors();
	const next = [entry, ...existing].slice(0, MAX_DEBUG_ERRORS);
	safeWriteRaw(JSON.stringify(next));
	return entry;
}
