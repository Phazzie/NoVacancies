#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { writeReport } from './lib/reporter.js';

const ROOT = process.cwd();

let totalTests = 0;
let totalPassed = 0;
let totalFailed = 0;
const suiteResults = [];
let currentSuite = null;

function suite(name) {
	currentSuite = { name, total: 0, passed: 0, failures: [] };
	suiteResults.push(currentSuite);
	console.log(`\n--- Suite: ${name} ---`);
}

function assert(condition, testName, reason = '') {
	totalTests += 1;
	currentSuite.total += 1;
	if (condition) {
		totalPassed += 1;
		currentSuite.passed += 1;
		console.log(`  PASS: ${testName}`);
		return;
	}

	totalFailed += 1;
	currentSuite.failures.push({ test: testName, reason: reason || 'assertion failed' });
	console.error(`  FAIL: ${testName}${reason ? ` — ${reason}` : ''}`);
}

function readSource(relativePath) {
	const absolute = path.join(ROOT, relativePath);
	if (!fs.existsSync(absolute)) return null;
	return fs.readFileSync(absolute, 'utf8');
}

function testStoryRegistryAndPromptOwnership() {
	suite('Story Registry + Prompt Ownership');

	const storiesIndex = readSource('src/lib/stories/index.ts');
	const noVacanciesIndex = readSource('src/lib/stories/no-vacancies/index.ts');
	const starterKitIndex = readSource('src/lib/stories/starter-kit/index.ts');
	const narrativeSource = readSource('src/lib/server/ai/narrative.ts');
	const grokSource = readSource('src/lib/server/ai/providers/grok.ts');

	assert(storiesIndex !== null, 'story registry exists');
	assert(noVacanciesIndex !== null, 'No Vacancies cartridge exists');
	assert(starterKitIndex !== null, 'starter kit cartridge exists');
	assert(narrativeSource !== null, 'narrative facade exists');
	assert(grokSource !== null, 'grok provider exists');

	assert(/noVacanciesCartridge/.test(storiesIndex), 'registry includes No Vacancies');
	assert(/starterKitCartridge/.test(storiesIndex), 'registry includes starter kit');
	assert(/PUBLIC_STORY_ID/.test(storiesIndex), 'registry reads PUBLIC_STORY_ID');
	assert(/Unknown story cartridge id/.test(storiesIndex), 'registry fails fast on unknown story id');

	assert(
		/System\.prompt|prompts\.systemPrompt/.test(grokSource) || /getCartridgePrompts/.test(grokSource),
		'grok provider reads prompts from active story cartridge'
	);
	assert(
		!narrativeSource.includes('Sydney is a 44-year-old functional meth addict'),
		'narrative facade no longer hardcodes No Vacancies system prompt text'
	);
	assert(
		/return getActiveStoryCartridge\(\)\.prompts\.getContinuePromptFromContext/.test(narrativeSource),
		'narrative facade delegates continue prompts to active story'
	);
}

function testNoVacanciesVoiceAssets() {
	suite('No Vacancies Voice Assets');

	const contextSource = readSource('src/lib/stories/no-vacancies/context.ts');
	const promptSource = readSource('src/lib/stories/no-vacancies/prompts.ts');
	const formattingSource = readSource('src/lib/narrative/promptFormatting.ts');

	assert(contextSource !== null, 'no-vacancies context assets exist');
	assert(promptSource !== null, 'no-vacancies prompt assets exist');

	const sacredLines = [
		'Things with Oswaldo do not argue anymore. They just collide and wait to see who apologizes first.',
		'With rules in place, chaos has to knock before it comes in.',
		'The question stayed: if her presence changes nothing, what is she here for?'
	];

	for (const line of sacredLines) {
		assert(contextSource.includes(line), `Sacred voice line preserved: "${line}"`);
	}

	assert(
		promptSource.includes('He will ride five miles for strangers and five inches for nobody in this room.'),
		'voice ceiling line preserved in prompt assets'
	);
	assert(
		promptSource.includes('The bill got paid, but respect is still in collections.'),
		'second voice ceiling line preserved in prompt assets'
	);
	assert(
		promptSource.includes('RECENT OPENING STRATEGIES'),
		'continue prompt uses recent opening strategy memory'
	);
	assert(
		(promptSource.includes('RECENT CHOICE TEXTS') || formattingSource.includes('RECENT CHOICE TEXTS')),
		'continue prompt uses recent choice text memory for ending guidance'
	);
	assert(
		!promptSource.includes('RECENT BEAT MEMORY'),
		'old beat-label prompt section removed'
	);
}

function testNarrativeContextContract() {
	suite('Narrative Context Contract');

	const contractsSource = readSource('src/lib/contracts/game.ts');
	const contextSource = readSource('src/lib/game/narrativeContext.ts');
	const runtimeSource = readSource('src/lib/game/gameRuntime.ts');
	const formattingSource = readSource('src/lib/narrative/promptFormatting.ts');

	assert(contractsSource !== null, 'contracts exist');
	assert(contextSource !== null, 'shared narrative context exists');
	assert(runtimeSource !== null, 'game runtime exists');
	assert(formattingSource !== null, 'prompt formatting exists');

	assert(contractsSource.includes('recentOpenings: string[]'), 'contracts expose recentOpenings');
	assert(contractsSource.includes('recentChoiceTexts: string[]'), 'contracts expose recentChoiceTexts');
	assert(contractsSource.includes('moments: TransitionBridgeMoment[]'), 'transition bridge stores structured moments');
	assert(!contractsSource.includes('arcPosition:'), 'arcPosition removed from contract');
	assert(!contractsSource.includes('recentBeats:'), 'recentBeats removed from contract');

	assert(contextSource.includes('buildRecentOpenings'), 'context builder derives recent openings');
	assert(contextSource.includes('buildRecentChoiceTexts'), 'context builder derives recent choice texts');
	assert(
		/context\.detectThreadTransitions/.test(contextSource),
		'context builder delegates transition detection to active story'
	);
	assert(
		runtimeSource.includes(
			'pendingTransitionBridge = transitionBridge.moments.length > 0 ? transitionBridge : null'
		),
		'runtime stores transition bridge only when structured moments exist'
	);
	assert(
		formattingSource.includes('BEFORE:'),
		'prompt formatting renders dynamic before/after transition shifts'
	);
}

function testStarterKitIsolation() {
	suite('Starter Kit Isolation');

	const starterKitSource = readSource('src/lib/stories/starter-kit/index.ts');
	assert(starterKitSource !== null, 'starter kit source exists');

	const forbiddenLeaks = ['Sydney', 'Oswaldo', 'Trina', 'Dex', 'daily-rate motel'];
	for (const leak of forbiddenLeaks) {
		assert(!starterKitSource.includes(leak), `starter kit avoids No Vacancies leak: "${leak}"`);
	}

	assert(
		starterKitSource.includes('Nothing in this cartridge should sound like No Vacancies.'),
		'starter kit explicitly warns against No Vacancies leakage'
	);
}

function testBuilderSurfaces() {
	suite('Builder Surfaces');

	const builderModule = readSource('src/lib/server/ai/builder.ts');
	const builderPage = readSource('src/routes/builder/+page.svelte');
	const generateRoute = readSource('src/routes/api/builder/generate-draft/+server.ts');
	const evaluateRoute = readSource('src/routes/api/builder/evaluate-prose/+server.ts');
	const evaluateDraftRoute = readSource('src/routes/api/builder/evaluate-draft/+server.ts');

	assert(builderModule !== null, 'builder server module exists');
	assert(builderPage !== null, 'builder page exists');
	assert(generateRoute !== null, 'generate-draft route exists');
	assert(evaluateRoute !== null, 'evaluate-prose route exists');
	assert(evaluateDraftRoute !== null, 'evaluate-draft route exists');

	assert(
		builderModule.includes('generateDraftFromPremise'),
		'builder module exposes draft generation'
	);
	assert(
		builderModule.includes('evaluateBuilderProse'),
		'builder module exposes prose evaluation'
	);
	assert(
		builderModule.includes('evaluateBuilderDraft'),
		'builder module exposes full draft evaluation'
	);
	assert(
		builderModule.includes('callBuilderModel'),
		'builder module uses AI-first builder calls'
	);
	assert(
		builderModule.includes('createFallbackDraft'),
		'builder module has deterministic fallback draft generation'
	);
	assert(
		builderPage.includes('premise'),
		'builder page starts from a premise input'
	);
	assert(
		builderPage.includes('/api/builder/generate-draft'),
		'builder page calls generate-draft endpoint'
	);
	assert(
		builderPage.includes('/api/builder/evaluate-prose'),
		'builder page calls evaluate-prose endpoint on prose fields'
	);
	assert(
		builderPage.includes('/api/builder/evaluate-draft'),
		'builder page calls evaluate-draft endpoint for full QA'
	);
}

console.log('=== Narrative Quality CI Pipeline ===');

testStoryRegistryAndPromptOwnership();
testNoVacanciesVoiceAssets();
testNarrativeContextContract();
testStarterKitIsolation();
testBuilderSurfaces();

const report = {
	timestamp: new Date().toISOString(),
	passed: totalFailed === 0,
	tier1: {
		totalTests,
		totalPassed,
		totalFailed,
		suites: suiteResults
	},
	tier2: {
		fixtureScores: [],
		baselineComparison: null
	}
};

try {
	const paths = writeReport(report);
	console.log(`\nArtifacts written:`);
	console.log(`  ${paths.jsonPath}`);
	console.log(`  ${paths.mdPath}`);
} catch (error) {
	console.error(`Failed to write artifacts: ${error instanceof Error ? error.message : String(error)}`);
}

console.log(`\n=== Summary ===`);
console.log(`Tier 1: ${totalPassed}/${totalTests} passed, ${totalFailed} failed`);

if (totalFailed > 0) {
	console.error(`\nFAILED: ${totalFailed} blocking test(s) failed`);
	process.exit(1);
}

console.log('\nPASSED: All blocking gates clear');
