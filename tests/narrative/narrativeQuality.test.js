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
		'Things with Oswaldo are actively hostile. He\'s in full deflection mode.',
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

	assert(builderModule !== null, 'builder server module exists');
	assert(builderPage !== null, 'builder page exists');
	assert(generateRoute !== null, 'generate-draft route exists');
	assert(evaluateRoute !== null, 'evaluate-prose route exists');

	assert(
		builderModule.includes('generateDraftFromPremise'),
		'builder module exposes draft generation'
	);
	assert(
		builderModule.includes('evaluateBuilderProse'),
		'builder module exposes prose evaluation'
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
}

function testNarrativePreambleAndVoiceRestoration() {
	suite('Narrative Preamble + Character Profiles + Voice Craft Restoration');

	const promptSource = readSource('src/lib/stories/no-vacancies/prompts.ts');

	assert(promptSource !== null, 'prompts.ts source exists');

	// PREAMBLE: 6 section headers
	assert(promptSource.includes('WHAT THIS STORY IS'), 'preamble section: WHAT THIS STORY IS');
	assert(promptSource.includes('WHAT THIS SYSTEM\'S PURPOSE IS'), 'preamble section: WHAT THIS SYSTEM\'S PURPOSE IS');
	assert(promptSource.includes('WHAT THE AI\'S JOB IS'), 'preamble section: WHAT THE AI\'S JOB IS');
	assert(promptSource.includes('WHAT THIS IS NOT'), 'preamble section: WHAT THIS IS NOT');
	assert(
		promptSource.includes('WRITING STYLE: MOTIVE-DRIVEN ANTHROPOMORPHISM'),
		'preamble section: WRITING STYLE: MOTIVE-DRIVEN ANTHROPOMORPHISM'
	);
	assert(promptSource.includes('QUALITY CHECK'), 'preamble section: QUALITY CHECK');

	// CHARACTER PROFILES: Key sections
	assert(promptSource.includes('MAIN CHARACTER: SYDNEY'), 'character profile: SYDNEY');
	assert(promptSource.includes('OSWALDO (Boyfriend)'), 'character profile: OSWALDO');
	assert(promptSource.includes('DEX (Friend / Subtle Saboteur)'), 'character profile: DEX');
	assert(promptSource.includes('TRINA (Crasher)'), 'character profile: TRINA');

	// OSWALDO BEHAVIOR RULES
	assert(
		promptSource.includes('SELECTIVELY LAZY'),
		'oswaldo behavior rule: SELECTIVELY LAZY'
	);
	assert(
		promptSource.includes('Hero to Strangers, Burden to Her'),
		'oswaldo behavior rule: Hero to Strangers, Burden to Her'
	);
	assert(promptSource.includes('admits fault'), 'oswaldo behavior rule: admits fault');

	// SPECIFIC MEMORIES
	assert(promptSource.includes('The "Incident"'), 'specific memory: The "Incident"');
	assert(promptSource.includes('Krystal'), 'specific memory: Krystal detail');

	// VOICE CRAFT GUIDELINES (check for ### headers to avoid false positives from other sections)
	assert(promptSource.includes('### VOICE'), 'voice craft section: ### VOICE');
	assert(promptSource.includes('### SENTENCE RHYTHM'), 'voice craft section: ### SENTENCE RHYTHM');
	assert(promptSource.includes('### DIALOGUE'), 'voice craft section: ### DIALOGUE');
	assert(promptSource.includes('### SHOW DON\'T TELL'), 'voice craft section: ### SHOW DON\'T TELL');
	assert(promptSource.includes('### SENSORY GROUNDING'), 'voice craft section: ### SENSORY GROUNDING');
	assert(
		promptSource.includes('### MOTIVE-DRIVEN ANTHROPOMORPHISM'),
		'voice craft section: ### MOTIVE-DRIVEN ANTHROPOMORPHISM'
	);
	assert(promptSource.includes('### FORBIDDEN PHRASING'), 'voice craft section: ### FORBIDDEN PHRASING');

	// FORBIDDEN PHRASES: Explicit exclusions
	assert(promptSource.includes('the lesson is'), 'forbidden phrase: the lesson is');
	assert(promptSource.includes('validate your feelings'), 'forbidden phrase: validate your feelings');
	assert(promptSource.includes('safe space'), 'forbidden phrase: safe space');

	// DARK HUMOR EXAMPLES
	assert(promptSource.includes("What'd you do today?"), 'dark humor: What\'d you do today?');
	assert(promptSource.includes('the ENERGY around here'), 'dark humor: the ENERGY around here');
}

function testVoiceCeilingExamplesRestored() {
	suite('Voice Ceiling Examples Restoration');

	const promptSource = readSource('src/lib/stories/no-vacancies/prompts.ts');

	assert(promptSource !== null, 'prompts.ts exists');

	// Spot check 4 of 10 voice ceiling lines
	assert(
		promptSource.includes('motel clock blinks 6:47'),
		'voice ceiling: motel clock blinks 6:47 like it is judging her math'
	);
	assert(
		promptSource.includes('hourly for snack cakes'),
		'voice ceiling: Trina wakes up hourly for snack cakes'
	);
	assert(
		promptSource.includes('confetti made of wrappers'),
		'voice ceiling: Trina leaves confetti made of wrappers'
	);
	assert(
		promptSource.includes('gratitude was never in stock'),
		'voice ceiling: like gratitude was never in stock'
	);
}

function testVoiceCeilingLinesShared() {
	suite('Voice Ceiling Lines Shared Constant');

	const promptSource = readSource('src/lib/stories/no-vacancies/prompts.ts');
	const indexSource = readSource('src/lib/stories/no-vacancies/index.ts');

	assert(promptSource !== null, 'prompts.ts exists');
	assert(indexSource !== null, 'index.ts exists');

	// Verify shared constant is exported from prompts.ts
	assert(
		promptSource.includes('export const VOICE_CEILING_LINES'),
		'VOICE_CEILING_LINES exported from prompts.ts'
	);

	// Verify all 10 lines are in the constant
	const lines = [
		'He will ride five miles for strangers and five inches for nobody in this room.',
		'The bill got paid, but respect is still in collections.',
		'The motel clock blinks 6:47 like it is judging her math.',
		'Trina wakes up hourly for snack cakes and leaves confetti made of wrappers.',
		'Forty dollars from a catfish turns into smokes and solo DoorDash in under an hour.',
		'Sydney fronts the referral money; Trina hits six hundred and forgets who opened the door.',
		'Two days later, Trina returns broke and loud, like gratitude was never in stock.',
		'Every favor in this room is a loan with hidden interest.',
		'When she sets one boundary, everyone acts like she started a war.',
		'She keeps the room alive and still gets treated like an interruption.'
	];

	for (const line of lines) {
		assert(promptSource.includes(line), `voice ceiling line in constant: "${line.substring(0, 40)}..."`);
	}

	// Verify index.ts imports and uses the shared constant
	assert(
		indexSource.includes('VOICE_CEILING_LINES'),
		'index.ts imports VOICE_CEILING_LINES from prompts'
	);
	assert(
		indexSource.includes('voiceCeilingLines: VOICE_CEILING_LINES'),
		'index.ts uses shared VOICE_CEILING_LINES constant (not duplicate array)'
	);
}

function testTranslationMapsUpgradedToVoiceCeiling() {
	suite('Translation Maps Upgraded to Voice-Ceiling Language');

	const contextSource = readSource('src/lib/stories/no-vacancies/context.ts');

	assert(contextSource !== null, 'context.ts exists');

	// TRINA_TENSION_TRANSLATIONS spot checks
	assert(
		contextSource.includes('every hour on the hour'),
		'TRINA_TENSION[1]: every hour on the hour snack cakes'
	);
	assert(
		contextSource.includes('Facebook Dating'),
		'TRINA_TENSION[2]: catfishes a guy on Facebook Dating'
	);
	assert(
		contextSource.includes('six hundred at the casino'),
		'TRINA_TENSION[3]: Trina hits six hundred at the casino'
	);

	// MONEY_TRANSLATIONS spot check
	assert(
		contextSource.includes('gets paid to panic her'),
		'MONEY_TRANSLATIONS[false]: clock keeps moving like it gets paid to panic her'
	);

	// SYDNEY_REALIZATION_TRANSLATIONS spot checks
	assert(
		contextSource.includes("She thinks Oswaldo can't help"),
		'SYDNEY_REALIZATION[0]: She thinks Oswaldo can\'t help'
	);
	assert(
		contextSource.includes("That's not neglect. That's a choice"),
		'SYDNEY_REALIZATION[3]: That\'s not neglect. That\'s a choice'
	);

	// EXHAUSTION_TRANSLATIONS spot check
	assert(
		contextSource.includes('Survival mode takes over the whole room'),
		'EXHAUSTION[5]: Survival mode takes over the whole room'
	);

	// OSWALDO_AWARENESS_TRANSLATIONS spot check
	assert(
		contextSource.includes("He gets flashes that she's carrying this place"),
		'OSWALDO_AWARENESS[1]: He gets flashes that she\'s carrying this place'
	);

	// OSWALDO_CONFLICT_TRANSLATIONS spot check
	assert(
		contextSource.includes('The resentment is still underground'),
		'OSWALDO_CONFLICT[0]: The resentment is still underground'
	);
}

console.log('=== Narrative Quality CI Pipeline ===');

testStoryRegistryAndPromptOwnership();
testNoVacanciesVoiceAssets();
testNarrativeContextContract();
testStarterKitIsolation();
testBuilderSurfaces();
testNarrativePreambleAndVoiceRestoration();
testVoiceCeilingExamplesRestored();
testVoiceCeilingLinesShared();
testTranslationMapsUpgradedToVoiceCeiling();

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
