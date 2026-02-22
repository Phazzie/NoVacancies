export type MechanicType = 'meter' | 'flag' | 'counter' | 'set';

export interface Mechanic {
	id: string;
	type: MechanicType;
	name: string;
	description?: string;
	min?: number;
	max?: number;
	startValue?: number | boolean | string[];
	value?: number | boolean | string[]; // Current value
	visible?: boolean;
}

export interface Character {
	id: string;
	name: string;
	role: string;
	description: string;
	referenceImagePrompt?: string; // Prompt to generate consistent images
	avatarImage?: string; // Pre-generated image URL
}

export interface EndingCondition {
	mechanicId: string;
	operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
	value: number | boolean;
}

export interface EndingRule {
	id: string;
	type: string; // e.g. 'bad_end', 'good_end', 'neutral'
	conditions: EndingCondition[];
	narrativeGuidance: string; // Guidance for the AI when this ending is triggered
}

export interface StoryTheme {
	primaryColor?: string;
	secondaryColor?: string;
	backgroundColor?: string;
	fontFamily?: string;
}

export interface StoryConfig {
	id: string;
	title: string;
	author: string;
	premise: string;
	genre: string;

	// Visuals
	theme?: StoryTheme;
	coverImage?: string;

	// Narrative Components
	characters: Character[];
	openingPrompt: string;

	// Game Mechanics
	mechanics: Mechanic[];

	// Endings
	endingRules: EndingRule[];

	// Legacy Support (Optional)
	legacyMode?: boolean; // If true, uses hardcoded logic for specific features
}
