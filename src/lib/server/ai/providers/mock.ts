import type { AiProvider, GenerateImageInput, GenerateSceneInput, GeneratedImage } from '$lib/server/ai/provider.interface';
import { mockStoryService } from '$lib/services/mockStoryService';

export class MockAiProvider implements AiProvider {
	readonly name = 'mock' as const;

	async getOpeningScene(input: GenerateSceneInput) {
		return mockStoryService.getOpeningScene({
			useMocks: input.gameState.useMocks,
			featureFlags: input.gameState.featureFlags
		});
	}

	async getNextScene(input: GenerateSceneInput) {
		const currentSceneId = input.currentSceneId ?? input.gameState.currentSceneId;
		const choiceId = input.choiceId ?? 'just_sit';
		return mockStoryService.getNextScene(currentSceneId, choiceId, input.gameState);
	}

	async generateImage(input: GenerateImageInput): Promise<GeneratedImage> {
		return {
			url: `/images/hotel_room.png?fallback_prompt=${encodeURIComponent(input.prompt.slice(0, 24))}`
		};
	}

	async probe() {
		return {
			provider: this.name,
			model: 'mock',
			modelAvailable: true,
			authValid: true,
			latencyMs: 0
		};
	}

	isAvailable(): boolean {
		return true;
	}
}

export const mockAiProvider = new MockAiProvider();

