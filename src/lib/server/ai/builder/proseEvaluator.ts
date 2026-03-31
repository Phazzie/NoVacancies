import { noVacanciesCartridge } from '$lib/stories/no-vacancies';
import type { BuilderFieldFeedback } from '$lib/stories/types';
import { callBuilderModel } from './modelClient';
import { extractJsonObject, normalizeProseFeedback } from './normalizers';

export function fallbackEvaluateProse(prose: string): BuilderFieldFeedback {
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
		return { feedback: normalizeProseFeedback(parsed), source: 'ai' };
	} catch {
		return {
			feedback: fallbackEvaluateProse(trimmed),
			source: 'fallback'
		};
	}
}
