#!/usr/bin/env node
/**
 * Live Grok Scene Generation Test (Tier 1, Blocking)
 *
 * Generates 3 real scenes via Grok API with varied narrative contexts,
 * validates them through sanity gates, and logs for Tier 2 evaluation.
 *
 * Usage: node tests/narrative/generateLiveScenes.test.js
 *
 * Blocks CI if any scene fails validation or API calls fail.
 * Gracefully skips if XAI_API_KEY not available (for local development).
 */
import fs from 'node:fs';
import path from 'node:path';
import { evaluateStorySanity } from './lib/sanityMirror.js';

const ROOT = process.cwd();

// Gracefully exit if API key not available (local development)
const apiKey = process.env.XAI_API_KEY;
if (!apiKey) {
	console.log('⊙ Skipping live scene generation (XAI_API_KEY not set)');
	process.exit(0);
}

const artifactsDir = path.join(ROOT, 'artifacts');

// Ensure artifacts directory exists
if (!fs.existsSync(artifactsDir)) {
	fs.mkdirSync(artifactsDir, { recursive: true });
}

// ---------------------------------------------------------------------------
// Call Grok API directly
// ---------------------------------------------------------------------------

async function callGrokApi(prompt) {
	const response = await fetch('https://api.x.ai/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: process.env.GROK_TEXT_MODEL || 'grok-4-1-fast-reasoning',
			messages: [
				{
					role: 'system',
					content: `You are an interactive fiction engine. Output valid JSON only.`
				},
				{
					role: 'user',
					content: prompt
				}
			],
			temperature: 0.7,
			max_tokens: parseInt(process.env.AI_MAX_OUTPUT_TOKENS || '1800')
		})
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Grok API error: ${response.status} - ${error}`);
	}

	const data = await response.json();
	const content = data.choices?.[0]?.message?.content;
	if (!content) {
		throw new Error('Empty response from Grok API');
	}

	// Extract JSON from response
	const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```|({[\s\S]*})/);
	if (!jsonMatch) {
		throw new Error('Could not extract JSON from Grok response');
	}

	return JSON.parse(jsonMatch[1] || jsonMatch[2]);
}

// ---------------------------------------------------------------------------
// Generate varied narrative contexts
// ---------------------------------------------------------------------------

function createVariedContexts() {
	return [
		{
			id: 'low-conflict',
			description: 'Low conflict: isolated, fresh start',
			threads: {
				oswaldoConflict: 0,
				trinaTension: 0,
				moneyResolved: false,
				carMentioned: false,
				sydneyRealization: 0,
				boundariesSet: [],
				oswaldoAwareness: 0,
				exhaustionLevel: 1,
				dexTriangulation: 0
			}
		},
		{
			id: 'medium-conflict',
			description: 'Medium conflict: emerging tensions, some progress',
			threads: {
				oswaldoConflict: 2,
				trinaTension: 1,
				moneyResolved: false,
				carMentioned: true,
				sydneyRealization: 1,
				boundariesSet: ['trina-rules'],
				oswaldoAwareness: 1,
				exhaustionLevel: 2,
				dexTriangulation: 1
			}
		},
		{
			id: 'high-tension',
			description: 'High tension: resolved money, high awareness, climax approaching',
			threads: {
				oswaldoConflict: 3,
				trinaTension: 2,
				moneyResolved: true,
				carMentioned: true,
				sydneyRealization: 2,
				boundariesSet: ['trina-rules', 'oswaldo-help'],
				oswaldoAwareness: 2,
				exhaustionLevel: 3,
				dexTriangulation: 2
			}
		}
	];
}

// ---------------------------------------------------------------------------
// Build narrative context description
// ---------------------------------------------------------------------------

function buildContextPrompt(context) {
	const lines = [];
	lines.push(`Story Threads:`);
	Object.entries(context.threads).forEach(([key, value]) => {
		if (Array.isArray(value)) {
			lines.push(`  ${key}: [${value.join(', ')}]`);
		} else {
			lines.push(`  ${key}: ${value}`);
		}
	});
	return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main test flow
// ---------------------------------------------------------------------------

async function main() {
	console.log('🎬 Generating live Grok scenes (Tier 1 blocking)...\n');

	const contexts = createVariedContexts();
	const timestamp = Date.now();
	const generatedScenes = [];
	let failureCount = 0;

	for (const ctx of contexts) {
		console.log(`→ Context: ${ctx.id} (${ctx.description})`);

		try {
			// Build prompt for this context
			const prompt = `Generate a new interactive fiction scene given this narrative context:\n\n${buildContextPrompt(ctx)}\n\nReturn a JSON object with: sceneId, sceneText (150-300 words), choices (array of {id, text}), lessonId (1-17 or null), mood, isEnding (boolean), endingType (if ending).`;

			// Call Grok API
			const scene = await callGrokApi(prompt);

			// Validate sanity
			const sanityResult = evaluateStorySanity(scene);
			const passedValidation = sanityResult.blockingIssues.length === 0;

			if (!passedValidation) {
				console.error(
					`  ✗ FAILED sanity validation: ${sanityResult.blockingIssues.join(', ')}`
				);
				failureCount++;
			} else {
				console.log(`  ✓ Passed sanity validation (${scene.sceneText?.length || 0} chars)`);
			}

			// Store result
			generatedScenes.push({
				contextId: ctx.id,
				contextDescription: ctx.description,
				timestamp,
				scene,
				sanityResult,
				passedValidation
			});
		} catch (error) {
			console.error(`  ✗ FAILED to generate scene: ${error.message}`);
			failureCount++;
		}
	}

	// Write artifacts
	const artifactPath = path.join(
		artifactsDir,
		`live-generated-scenes-${timestamp}.json`
	);
	fs.writeFileSync(
		artifactPath,
		JSON.stringify(generatedScenes, null, 2),
		'utf8'
	);
	console.log(`\n📝 Logged to: ${artifactPath}`);

	// Report results
	const passedCount = generatedScenes.filter((s) => s.passedValidation).length;
	console.log(`\n📊 Results: ${passedCount}/${generatedScenes.length} scenes passed\n`);

	if (failureCount > 0) {
		console.error(`❌ Test FAILED: ${failureCount} scene(s) failed validation`);
		process.exit(1);
	}

	console.log('✅ All live scenes passed validation');
	process.exit(0);
}

main().catch((error) => {
	console.error('❌ Fatal error:', error);
	process.exit(1);
});
