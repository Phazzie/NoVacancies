import type { StoryConfig } from '../contracts/story';

export interface StoryRepository {
	listStories(): Promise<StoryConfig[]>;
	getStory(id: string): Promise<StoryConfig | null>;
	saveStory(story: StoryConfig): Promise<void>;
	deleteStory(id: string): Promise<void>;
}

export class InMemoryStoryRepository implements StoryRepository {
	private stories: Map<string, StoryConfig> = new Map();

	constructor(initialStories: StoryConfig[] = []) {
		initialStories.forEach((s) => this.stories.set(s.id, s));
	}

	async listStories(): Promise<StoryConfig[]> {
		return Array.from(this.stories.values());
	}

	async getStory(id: string): Promise<StoryConfig | null> {
		return this.stories.get(id) ?? null;
	}

	async saveStory(story: StoryConfig): Promise<void> {
		this.stories.set(story.id, story);
	}

	async deleteStory(id: string): Promise<void> {
		this.stories.delete(id);
	}
}

export class LocalStorageStoryRepository implements StoryRepository {
	private readonly key: string;

	constructor(key = 'nv_builder_stories') {
		this.key = key;
	}

	private loadAll(): Record<string, StoryConfig> {
		if (typeof window === 'undefined') return {};
		const raw = window.localStorage.getItem(this.key);
		if (!raw) return {};
		try {
			return JSON.parse(raw);
		} catch {
			return {};
		}
	}

	private saveAll(data: Record<string, StoryConfig>): void {
		if (typeof window === 'undefined') return;
		window.localStorage.setItem(this.key, JSON.stringify(data));
	}

	async listStories(): Promise<StoryConfig[]> {
		const data = this.loadAll();
		return Object.values(data);
	}

	async getStory(id: string): Promise<StoryConfig | null> {
		const data = this.loadAll();
		return data[id] ?? null;
	}

	async saveStory(story: StoryConfig): Promise<void> {
		const data = this.loadAll();
		data[story.id] = story;
		this.saveAll(data);
	}

	async deleteStory(id: string): Promise<void> {
		const data = this.loadAll();
		delete data[id];
		this.saveAll(data);
	}
}
