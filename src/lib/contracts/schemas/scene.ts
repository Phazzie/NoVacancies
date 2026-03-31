import { EndingTypes, Moods, validateEndingType, type Choice, type Scene, type StoryThreads } from '../game';

export class SceneContractError extends Error {
	readonly field: string;
	readonly code:
		| 'invalid_payload'
		| 'missing_field'
		| 'invalid_field_type'
		| 'invalid_value'
		| 'invalid_choice';

	constructor(
		message: string,
		options: {
			field: string;
			code:
				| 'invalid_payload'
				| 'missing_field'
				| 'invalid_field_type'
				| 'invalid_value'
				| 'invalid_choice';
		}
	) {
		super(message);
		this.name = 'SceneContractError';
		this.field = options.field;
		this.code = options.code;
	}
}

function assertObject(payload: unknown): Record<string, unknown> {
	if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
		throw new SceneContractError('Scene payload must be an object', {
			field: 'scene',
			code: 'invalid_payload'
		});
	}
	return payload as Record<string, unknown>;
}

function assertString(value: unknown, field: string): string {
	if (typeof value !== 'string') {
		throw new SceneContractError(`Scene field "${field}" must be a string`, {
			field,
			code: value == null ? 'missing_field' : 'invalid_field_type'
		});
	}
	const trimmed = value.trim();
	if (!trimmed) {
		throw new SceneContractError(`Scene field "${field}" cannot be empty`, {
			field,
			code: 'invalid_value'
		});
	}
	return trimmed;
}

function assertNullableNumber(value: unknown, field: string): number | null {
	if (value === null) return null;
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		throw new SceneContractError(`Scene field "${field}" must be a number or null`, {
			field,
			code: 'invalid_field_type'
		});
	}
	return value;
}

function parseChoice(value: unknown, index: number): Choice {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new SceneContractError(`Choice at index ${index} must be an object`, {
			field: `choices[${index}]`,
			code: 'invalid_choice'
		});
	}
	const choice = value as Record<string, unknown>;
	const id = assertString(choice.id, `choices[${index}].id`);
	const text = assertString(choice.text, `choices[${index}].text`);
	if (choice.outcome != null && typeof choice.outcome !== 'string') {
		throw new SceneContractError(`Choice field "choices[${index}].outcome" must be a string when provided`, {
			field: `choices[${index}].outcome`,
			code: 'invalid_field_type'
		});
	}
	if (choice.nextSceneId != null && typeof choice.nextSceneId !== 'string') {
		throw new SceneContractError(
			`Choice field "choices[${index}].nextSceneId" must be a string when provided`,
			{
				field: `choices[${index}].nextSceneId`,
				code: 'invalid_field_type'
			}
		);
	}
	return {
		id,
		text,
		outcome: typeof choice.outcome === 'string' ? choice.outcome : undefined,
		nextSceneId: typeof choice.nextSceneId === 'string' ? choice.nextSceneId : undefined
	};
}

function parseStoryThreadUpdates(value: unknown): Partial<StoryThreads> | null {
	if (value == null) return null;
	if (typeof value !== 'object' || Array.isArray(value)) {
		throw new SceneContractError('Scene field "storyThreadUpdates" must be an object when provided', {
			field: 'storyThreadUpdates',
			code: 'invalid_field_type'
		});
	}
	return value as Partial<StoryThreads>;
}

export function parseScene(payload: unknown): Scene {
	const object = assertObject(payload);
	const sceneId = assertString(object.sceneId, 'sceneId');
	const sceneText = assertString(object.sceneText, 'sceneText');
	const imageKey = assertString(object.imageKey, 'imageKey');

	if (!Array.isArray(object.choices)) {
		throw new SceneContractError('Scene field "choices" must be an array', {
			field: 'choices',
			code: 'invalid_field_type'
		});
	}
	const choices = object.choices.map((choice, index) => parseChoice(choice, index));

	if (typeof object.isEnding !== 'boolean') {
		throw new SceneContractError('Scene field "isEnding" must be a boolean', {
			field: 'isEnding',
			code: object.isEnding == null ? 'missing_field' : 'invalid_field_type'
		});
	}

	const endingType = object.isEnding
		? validateEndingType(object.endingType)
		: object.endingType == null
			? null
			: validateEndingType(object.endingType);
	if (object.isEnding && endingType === EndingTypes.LOOP && typeof object.endingType !== 'string') {
		throw new SceneContractError('Ending scenes must include a string endingType', {
			field: 'endingType',
			code: 'missing_field'
		});
	}

	if (object.mood != null && (typeof object.mood !== 'string' || !Object.values(Moods).includes(object.mood as never))) {
		throw new SceneContractError('Scene field "mood" must be a valid mood when provided', {
			field: 'mood',
			code: 'invalid_value'
		});
	}

	if (object.imagePrompt != null && typeof object.imagePrompt !== 'string') {
		throw new SceneContractError('Scene field "imagePrompt" must be a string when provided', {
			field: 'imagePrompt',
			code: 'invalid_field_type'
		});
	}

	return {
		sceneId,
		sceneText,
		choices,
		lessonId: assertNullableNumber(object.lessonId, 'lessonId'),
		imageKey,
		imagePrompt: typeof object.imagePrompt === 'string' ? object.imagePrompt : undefined,
		isEnding: object.isEnding,
		endingType,
		mood: object.mood as Scene['mood'] | undefined,
		storyThreadUpdates: parseStoryThreadUpdates(object.storyThreadUpdates)
	};
}

export function isScene(payload: unknown): payload is Scene {
	try {
		parseScene(payload);
		return true;
	} catch {
		return false;
	}
}
