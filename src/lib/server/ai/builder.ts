import { noVacanciesCartridge } from '$lib/stories/no-vacancies';
import { starterKitCartridge } from '$lib/stories/starter-kit';
import type { BuilderFieldFeedback, BuilderStoryDraft } from '$lib/stories/types';
import { loadAiConfig } from '$lib/server/ai/config';

const XAI_CHAT_URL = 'https://api.x.ai/v1/chat/completions';

interface ChatChoice {
	message?: { content?: string | null };
}

interface ChatResponse {
	choices?: ChatChoice[];
}

function extractJsonObject(text: string): string {
	const trimmed = text.trim();
	if (!trimmed) throw new Error('Empty builder response');

	const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
	if (fenced?.[1]) {
		return fenced[1].trim();
	}

	if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
		return trimmed;
	}

	const firstBrace = trimmed.indexOf('{');
	const lastBrace = trimmed.lastIndexOf('}');
	if (firstBrace >= 0 && lastBrace > firstBrace) {
		return trimmed.slice(firstBrace, lastBrace + 1);
	}

	throw new Error('No JSON object found in builder response');
}

function normalizeLineArray(value: unknown, fallback: string[]): string[] {
	if (!Array.isArray(value)) return fallback;
	return value.filter((line): line is string => typeof line === 'string' && line.trim().length > 0);
}

function titleCase(value: string): string {
	return value
		.split(/\s+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
		.join(' ');
}

function deriveTitleFromPremise(premise: string): string {
	const cleaned = premise.replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();
	if (!cleaned) return 'Untitled Story';
	const words = cleaned.split(' ').slice(0, 4).join(' ');
	return titleCase(words);
}

function deriveSettingFromPremise(premise: string): string {
	const lowered = premise.toLowerCase();
	if (lowered.includes('hotel')) return 'A hotel room with the bill coming due before anybody is ready.';
	if (lowered.includes('office')) return 'An office that looks orderly until the social debt comes due.';
	if (lowered.includes('house')) return 'A house where maintenance and obligation have become the same job.';
	return 'A pressure-cooker setting where the protagonist keeps absorbing the cost of everyone else being unfinished.';
}

function createFallbackDraft(premise: string): BuilderStoryDraft {
	const referenceDraft = starterKitCartridge.builder.createEmptyDraft();
	const normalizedPremise = premise.trim();
	const title = normalizedPremise ? deriveTitleFromPremise(normalizedPremise) : referenceDraft.title;
	const setting = normalizedPremise
		? deriveSettingFromPremise(normalizedPremise)
		: referenceDraft.setting;

	// The fallback keeps authoring moving even when Grok is unavailable; it is scaffolding, not quality parity.
	return {
		...referenceDraft,
		title,
		premise: normalizedPremise,
		setting,
		aestheticStatement:
			'Keep the prose motive-driven and behavioral. Let objects, rooms, and silence act like people with leverage.',
		voiceCeilingLines: [
			`${title} starts with the room already keeping score.`,
			'The cost shows up before anybody explains it.'
		],
		characters: [
			{
				name: 'Protagonist',
				role: 'lead',
				description:
					'The person keeping the structure standing, already exhausted by how invisible that work has become.'
			},
			{
				name: 'Pressure Source',
				role: 'foil',
				description:
					'Someone who benefits from the protagonist carrying the load and resents being reminded where the weight lives.'
			}
		],
		mechanics: [
			{
				key: 'pressure',
				label: 'Pressure',
				voiceMap: [
					{ value: '0', line: 'The pressure is here already. It just has not been named yet.' },
					{
						value: '2',
						line: 'The room has stopped pretending the pressure is temporary.'
					}
				]
			},
			{
				key: 'clarity',
				label: 'Clarity',
				voiceMap: [
					{
						value: '0',
						line: 'The protagonist is still translating repeated behavior into isolated bad luck.'
					},
					{
						value: '2',
						line: 'The pattern is too clean to call an accident anymore.'
					}
				]
			}
		],
		openingPrompt: `Generate an opening scene for this premise: ${normalizedPremise}`,
		systemPrompt: `You are writing a grounded interactive narrative about this premise: ${normalizedPremise}. Keep the prose concrete, behavioral, and free of therapy-summary language.`
	};
}

function normalizeDraft(candidate: unknown, premise: string): BuilderStoryDraft {
	const fallback = createFallbackDraft(premise);
	if (!candidate || typeof candidate !== 'object') {
		return fallback;
	}

	const typed = candidate as Partial<BuilderStoryDraft>;
	const mechanics = Array.isArray(typed.mechanics)
		? typed.mechanics
				.filter((mechanic): mechanic is NonNullable<typeof mechanic> => Boolean(mechanic))
				.map((mechanic) => ({
					key: typeof mechanic.key === 'string' ? mechanic.key : 'mechanic',
					label: typeof mechanic.label === 'string' ? mechanic.label : 'Mechanic',
					voiceMap: Array.isArray(mechanic.voiceMap)
						? mechanic.voiceMap
								.filter((entry): entry is { value: string; line: string } => {
									return Boolean(
										entry &&
											typeof entry.value === 'string' &&
											typeof entry.line === 'string'
									);
								})
						: []
				}))
		: fallback.mechanics;

	const characters = Array.isArray(typed.characters)
		? typed.characters
				.filter((character): character is NonNullable<typeof character> => Boolean(character))
				.map((character) => ({
					name: typeof character.name === 'string' ? character.name : 'Character',
					role: typeof character.role === 'string' ? character.role : 'role',
					description:
						typeof character.description === 'string'
							? character.description
							: 'Replace with story-authored behavior.'
				}))
		: fallback.characters;

	return {
		title: typeof typed.title === 'string' ? typed.title : fallback.title,
		premise: typeof typed.premise === 'string' ? typed.premise : premise || fallback.premise,
		setting: typeof typed.setting === 'string' ? typed.setting : fallback.setting,
		aestheticStatement:
			typeof typed.aestheticStatement === 'string'
				? typed.aestheticStatement
				: fallback.aestheticStatement,
		voiceCeilingLines: normalizeLineArray(typed.voiceCeilingLines, fallback.voiceCeilingLines),
		characters,
		mechanics: mechanics.length > 0 ? mechanics : fallback.mechanics,
		openingPrompt:
			typeof typed.openingPrompt === 'string' ? typed.openingPrompt : fallback.openingPrompt,
		systemPrompt:
			typeof typed.systemPrompt === 'string' ? typed.systemPrompt : fallback.systemPrompt
	};
}

async function callBuilderModel(systemPrompt: string, userPrompt: string): Promise<string> {
	const config = loadAiConfig();
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 30_000);

	let response: Response;
	try {
		response = await fetch(XAI_CHAT_URL, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				authorization: `Bearer ${config.xaiApiKey}`
			},
			body: JSON.stringify({
				model: config.grokTextModel,
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userPrompt }
				],
				max_tokens: Math.min(config.maxOutputTokens, 1400),
				temperature: 0.7
			}),
			signal: controller.signal
		});
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') {
			throw new Error('Builder model request timed out after 30 seconds');
		}
		throw error;
	} finally {
		clearTimeout(timeoutId);
	}

	if (!response.ok) {
		throw new Error(`Builder model request failed (${response.status})`);
	}

	const payload = (await response.json()) as ChatResponse;
	const text = payload.choices?.[0]?.message?.content;
	if (!text || typeof text !== 'string') {
		throw new Error('Builder model returned empty content');
	}

	return text;
}

export async function generateDraftFromPremise(
	premise: string
): Promise<{ draft: BuilderStoryDraft; source: 'ai' | 'fallback' }> {
	const trimmedPremise = premise.trim();
	if (!trimmedPremise) {
		return {
			draft: createFallbackDraft(''),
			source: 'fallback'
		};
	}

	const systemPrompt = `You are drafting a StoryDefinition-like JSON object for a new interactive narrative. Use No Vacancies as the reference for behavioral specificity, motive-driven prose, and pressure-loaded mechanics, but do not copy its setting or names.

Return valid JSON only with this shape:
{
  "title": string,
  "premise": string,
  "setting": string,
  "aestheticStatement": string,
  "voiceCeilingLines": string[],
  "characters": [{ "name": string, "role": string, "description": string }],
  "mechanics": [{ "key": string, "label": string, "voiceMap": [{ "value": string, "line": string }] }],
  "openingPrompt": string,
  "systemPrompt": string
}

Rules:
- write behavioral prose, not trait-summary prose
- include 2-4 characters
- include 3-5 mechanics
- each mechanic must have at least 2 voiceMap entries
- keep voice ceiling lines sharp, concrete, and under 20 words
- avoid copying No Vacancies-specific names, motel details, drugs, or incidents unless the premise explicitly asks for them`;

	const userPrompt = `Premise:
${trimmedPremise}

Reference voice statement:
${noVacanciesCartridge.voice.aestheticStatement}

Reference voice ceiling lines:
${noVacanciesCartridge.voice.voiceCeilingLines.map((line) => `- ${line}`).join('\n')}

Reference behavior seeds:
${(noVacanciesCartridge.voice.behaviorSeeds || [])
	.map((seed) => `- Incident: ${seed.incident}\n  Pattern: ${seed.pattern}`)
	.join('\n')}

Generate the first draft now.`;

	try {
		const raw = await callBuilderModel(systemPrompt, userPrompt);
		const parsed = JSON.parse(extractJsonObject(raw));
		return {
			draft: normalizeDraft(parsed, trimmedPremise),
			source: 'ai'
		};
	} catch {
		// Builder creation is AI-first, but it should never dead-end on missing keys or transient provider failures.
		return {
			draft: createFallbackDraft(trimmedPremise),
			source: 'fallback'
		};
	}
}

function fallbackEvaluateProse(prose: string): BuilderFieldFeedback {
	const trimmed = prose.trim();
	const flags: string[] = [];
	let score = 10;

	const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
	if (wordCount > 50) {
		flags.push('Too long; tighten to one behavioral beat.');
		score -= 3;
	}

	if (/(realized|felt|learned|understood|safe space|process this|the lesson is|what this teaches)/i.test(trimmed)) {
		flags.push('Explains the feeling instead of staging behavior.');
		score -= 3;
	}

	if (!/\b\d+\b|phone|door|table|floor|rent|cup|window|shirt|wrapper|bike|money|room|hallway|car/i.test(trimmed)) {
		flags.push('Needs one concrete object, number, or physical action.');
		score -= 2;
	}

	if (!/(walk|eat|drag|lean|drop|count|watch|text|ride|ask|lock|leave|stand|spill|open|close)/i.test(trimmed)) {
		flags.push('Trait-heavy; add an action or visible behavior.');
		score -= 2;
	}

	if (score >= 8 && flags.length === 0) {
		flags.push('Behavior-led and concrete.');
	}

	return {
		score: Math.max(1, Math.min(10, score)),
		flags,
		suggestion:
			flags.length === 0
				? 'Keep it. The line behaves instead of explaining itself.'
				: 'Rewrite around one visible action, one concrete detail, and one unstated social consequence.'
	};
}

export async function evaluateBuilderProse(
	prose: string
): Promise<{ feedback: BuilderFieldFeedback; source: 'ai' | 'fallback' }> {
	const trimmed = prose.trim();
	if (!trimmed) {
		return {
			feedback: {
				score: 1,
				flags: ['Empty field. Write one concrete behavioral line.'],
				suggestion: 'Start with what the room, body, or object is doing instead of what the character feels.'
			},
			source: 'fallback'
		};
	}

	const systemPrompt = `You are an editorial evaluator for authored story prose. Score the submitted line against this rubric:
1. Does it describe behavior instead of naming a trait or emotion?
2. Does it contain a concrete detail (number, object, name, or specific action)?
3. Is it under 50 words?
4. Does it avoid self-explaining language?

Return valid JSON only:
{
  "score": number,
  "flags": string[],
  "suggestion": string
}

Ground your standards in this aesthetic statement:
${noVacanciesCartridge.voice.aestheticStatement}

Voice ceiling lines:
${noVacanciesCartridge.voice.voiceCeilingLines.map((line) => `- ${line}`).join('\n')}

If the line sounds like Hallmark-card summary prose, say so directly.`;

	const userPrompt = `Evaluate this prose line:\n${trimmed}`;

	try {
		const raw = await callBuilderModel(systemPrompt, userPrompt);
		const parsed = JSON.parse(extractJsonObject(raw)) as Partial<BuilderFieldFeedback>;
		const feedback: BuilderFieldFeedback = {
			score:
				typeof parsed.score === 'number' && Number.isFinite(parsed.score)
					? Math.max(1, Math.min(10, Math.round(parsed.score)))
					: 1,
			flags: Array.isArray(parsed.flags)
				? parsed.flags.filter((flag): flag is string => typeof flag === 'string')
				: ['AI evaluator returned an invalid flags payload.'],
			suggestion:
				typeof parsed.suggestion === 'string'
					? parsed.suggestion
					: 'Rewrite around behavior, concrete detail, and implied consequence.'
		};

		return { feedback, source: 'ai' };
	} catch {
		return {
			// The fallback rubric is deliberately blunt, but it preserves editorial direction when the live evaluator is down.
			feedback: fallbackEvaluateProse(trimmed),
			source: 'fallback'
		};
	}
}
