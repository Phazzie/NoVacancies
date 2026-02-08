#!/usr/bin/env node
/**
 * Narrative Quality CI Pipeline
 *
 * Tier 1: Blocking deterministic gates (hard invariants)
 * Tier 2: Non-blocking rubric-based scoring (conventional + unconventional)
 *
 * Usage: node tests/narrative/narrativeQuality.test.js
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { evaluateStorySanity } from './lib/sanityMirror.js';
import { ALL_KEYS } from './lib/scorecard.js';
import { writeReport } from './lib/reporter.js';

const ROOT = process.cwd();

// ---------------------------------------------------------------------------
// Test harness (matches project's Node.js custom runner pattern)
// ---------------------------------------------------------------------------

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
	totalTests++;
	currentSuite.total++;
	if (condition) {
		totalPassed++;
		currentSuite.passed++;
		console.log(`  PASS: ${testName}`);
	} else {
		totalFailed++;
		currentSuite.failures.push({ test: testName, reason: reason || 'assertion failed' });
		console.error(`  FAIL: ${testName}${reason ? ' — ' + reason : ''}`);
	}
}

function readSource(relativePath) {
	const absolute = path.join(ROOT, relativePath);
	if (!fs.existsSync(absolute)) return null;
	return fs.readFileSync(absolute, 'utf8');
}

function loadJson(relativePath) {
	const content = readSource(relativePath);
	if (!content) return null;
	return JSON.parse(content);
}

// ---------------------------------------------------------------------------
// Tier 1, Suite 1: Canonical Prompt Wiring
// ---------------------------------------------------------------------------

function testCanonicalPromptWiring() {
	suite('Canonical Prompt Wiring');

	const grokSource = readSource('src/lib/server/ai/providers/grok.ts');
	assert(grokSource !== null, 'grok.ts exists');

	// Grok imports canonical prompt functions
	assert(/import\s*\{[^}]*SYSTEM_PROMPT[^}]*\}\s*from/.test(grokSource),
		'grok.ts imports SYSTEM_PROMPT');
	assert(/import\s*\{[^}]*getOpeningPrompt[^}]*\}\s*from/.test(grokSource),
		'grok.ts imports getOpeningPrompt');
	assert(/import\s*\{[^}]*getContinuePromptFromContext[^}]*\}\s*from/.test(grokSource),
		'grok.ts imports getContinuePromptFromContext');
	assert(/import\s*\{[^}]*getRecoveryPrompt[^}]*\}\s*from/.test(grokSource),
		'grok.ts imports getRecoveryPrompt');

	// System prompt is used in chat call (not the one-line stub)
	assert(/role.*system.*content.*SYSTEM_PROMPT/s.test(grokSource),
		'grok.ts uses SYSTEM_PROMPT in system message');
	assert(!/interactive fiction engine\.\s*output json only/i.test(grokSource),
		'grok.ts does NOT contain stub system prompt',
		'Found one-line stub "interactive fiction engine. output json only"');

	// Canonical prompts are called in scene generation
	assert(/getOpeningPrompt\(\)/.test(grokSource), 'grok.ts calls getOpeningPrompt()');
	assert(/getContinuePromptFromContext\(/.test(grokSource), 'grok.ts calls getContinuePromptFromContext()');
	assert(/getRecoveryPrompt\(/.test(grokSource), 'grok.ts calls getRecoveryPrompt()');
}

// ---------------------------------------------------------------------------
// Tier 1, Suite 2: Voice Integrity
// ---------------------------------------------------------------------------

function testVoiceIntegrity() {
	suite('Voice Integrity');

	const narrativeSource = readSource('src/lib/server/ai/narrative.ts');
	assert(narrativeSource !== null, 'narrative.ts exists');

	// Voice ceiling anchor line
	assert(narrativeSource.includes('He will ride five miles for strangers and five inches for nobody in this room.'),
		'Voice ceiling anchor line present');
	assert(narrativeSource.includes('The bill got paid, but respect is still in collections.'),
		'Second voice ceiling line present');

	// Anti-didactic guidance
	assert(narrativeSource.includes('Write the scene first. Then label lessonId after the writing is done.'),
		'Post-hoc lesson labeling instruction present');
	assert(narrativeSource.includes('Prefer lessonId: null over forcing a lesson'),
		'Null lesson preference instruction present');

	// Priority order present
	assert(narrativeSource.includes('PRIORITY ORDER'),
		'Priority order section present');
	assert(/1\.\s*Continuity/i.test(narrativeSource),
		'Priority 1 is continuity');
	assert(/4\.\s*Stylistic/i.test(narrativeSource),
		'Priority 4 is style (last)');

	// Show-don't-tell examples
	assert(narrativeSource.includes("You've been awake since 5. He asked what's for breakfast."),
		'Show-don\'t-tell good example present');
	assert(narrativeSource.includes('Sydney felt tired and resentful'),
		'Show-don\'t-tell bad example present (for contrast)');

	// Writing craft section
	assert(narrativeSource.includes('Second person, present tense'),
		'Second person present tense instruction present');
	assert(narrativeSource.includes('SENSORY GROUNDING'),
		'Sensory grounding section present');
}

// ---------------------------------------------------------------------------
// Tier 1, Suite 3: Lesson Corpus Integrity
// ---------------------------------------------------------------------------

function testLessonCorpusIntegrity() {
	suite('Lesson Corpus Integrity');

	const lessonsSource = readSource('src/lib/server/ai/lessons.ts');
	assert(lessonsSource !== null, 'lessons.ts exists');

	// All 17 lessons present
	for (let id = 1; id <= 17; id++) {
		assert(new RegExp(`id:\\s*${id}\\b`).test(lessonsSource),
			`Lesson ${id} present in corpus`);
	}

	// Required fields per lesson
	const requiredFields = ['title', 'quote', 'insight', 'emotionalStakes', 'storyTriggers', 'unconventionalAngle'];
	for (const field of requiredFields) {
		const count = (lessonsSource.match(new RegExp(`${field}:`, 'g')) || []).length;
		assert(count >= 17, `All 17 lessons have '${field}' field (found ${count})`,
			`Only ${count}/17 lessons have '${field}'`);
	}

	// Lesson functions exported
	assert(/export\s+function\s+getLessonById/.test(lessonsSource),
		'getLessonById exported');
	assert(/export\s+function\s+detectLessonInScene/.test(lessonsSource),
		'detectLessonInScene exported');
}

// ---------------------------------------------------------------------------
// Tier 1, Suite 4: Context Builder Contract
// ---------------------------------------------------------------------------

function testContextBuilderContract() {
	suite('Context Builder Contract');

	const narrativeSource = readSource('src/lib/server/ai/narrative.ts');
	const runtimeSource = readSource('src/lib/game/gameRuntime.ts');

	// buildNarrativeContext exists and is exported
	assert(/export\s+function\s+buildNarrativeContext/.test(narrativeSource),
		'buildNarrativeContext exported from narrative.ts');

	// Runtime calls it
	assert(/buildNarrativeContext\(/.test(runtimeSource),
		'gameRuntime.ts calls buildNarrativeContext');

	// Context builder references required blocks
	assert(narrativeSource.includes('threadNarrativeLines'), 'Context includes thread narrative lines');
	assert(narrativeSource.includes('boundaryNarrativeLines'), 'Context includes boundary narrative lines');
	assert(narrativeSource.includes('lessonHistoryLines'), 'Context includes lesson history lines');
	assert(narrativeSource.includes('recentSceneProse'), 'Context includes recent scene prose');
	assert(narrativeSource.includes('olderSceneSummaries'), 'Context includes older scene summaries');
	assert(narrativeSource.includes('transitionBridge'), 'Context includes transition bridge');

	// Budget enforcement
	assert(/NARRATIVE_CONTEXT_CHAR_BUDGET/.test(narrativeSource),
		'Character budget constant defined');
	assert(/applyContextBudget/.test(narrativeSource),
		'Context budget enforcement function present');
}

// ---------------------------------------------------------------------------
// Tier 1, Suite 5: Continuity Dimensions
// ---------------------------------------------------------------------------

function testContinuityDimensions() {
	suite('Continuity Dimensions');

	const narrativeSource = readSource('src/lib/server/ai/narrative.ts');
	const contractsSource = readSource('src/lib/contracts/game.ts');

	// All 8 thread dimensions in StoryThreads type
	const threadDimensions = [
		'oswaldoConflict', 'trinaTension', 'moneyResolved', 'carMentioned',
		'sydneyRealization', 'boundariesSet', 'oswaldoAwareness', 'exhaustionLevel'
	];
	for (const dim of threadDimensions) {
		assert(contractsSource.includes(dim),
			`Thread dimension '${dim}' in contracts`);
	}

	// Translation maps cover all dimensions
	const translationMaps = [
		'OSWALDO_CONFLICT_TRANSLATIONS',
		'TRINA_TENSION_TRANSLATIONS',
		'MONEY_TRANSLATIONS',
		'CAR_TRANSLATIONS',
		'SYDNEY_REALIZATION_TRANSLATIONS',
		'OSWALDO_AWARENESS_TRANSLATIONS',
		'EXHAUSTION_TRANSLATIONS'
	];
	for (const map of translationMaps) {
		assert(narrativeSource.includes(map),
			`Translation map '${map}' present in narrative.ts`);
	}

	// Boundary translations
	assert(narrativeSource.includes('BOUNDARY_TRANSLATIONS'),
		'BOUNDARY_TRANSLATIONS map present');

	// Lesson history translations
	assert(narrativeSource.includes('LESSON_HISTORY_TRANSLATIONS'),
		'LESSON_HISTORY_TRANSLATIONS map present');

	// Translation map completeness: spot-check key ranges
	// Oswaldo conflict: -2 to +2 (5 keys)
	for (let i = -2; i <= 2; i++) {
		assert(narrativeSource.includes(`'${i}':`),
			`OSWALDO_CONFLICT has key '${i}'`);
	}

	// Exhaustion: 0 to 5 (6 keys)
	for (let i = 0; i <= 5; i++) {
		const pattern = new RegExp(`['"]${i}['"]\\s*:`);
		// This is a loose check — exhaustion translations have keys 0-5
		assert(pattern.test(narrativeSource),
			`Exhaustion translation has key '${i}'`);
	}

	// Lesson history: 1-17
	for (let i = 1; i <= 17; i++) {
		assert(new RegExp(`\\b${i}:\\s*['"$]`).test(narrativeSource),
			`LESSON_HISTORY_TRANSLATIONS has key ${i}`);
	}
}

// ---------------------------------------------------------------------------
// Tier 1, Suite 6: Transition Bridge Logic
// ---------------------------------------------------------------------------

function testTransitionBridgeLogic() {
	suite('Transition Bridge Logic');

	const narrativeSource = readSource('src/lib/server/ai/narrative.ts');
	const runtimeSource = readSource('src/lib/game/gameRuntime.ts');

	// Transition bridge map exists
	assert(narrativeSource.includes('TRANSITION_BRIDGE_MAP'),
		'TRANSITION_BRIDGE_MAP present in narrative.ts');

	// detectThreadTransitions exported
	assert(/export\s+function\s+detectThreadTransitions/.test(narrativeSource),
		'detectThreadTransitions exported from narrative.ts');

	// Runtime uses it
	assert(/detectThreadTransitions\(/.test(runtimeSource),
		'gameRuntime.ts calls detectThreadTransitions');

	// Runtime sets pendingTransitionBridge
	assert(/pendingTransitionBridge\s*=/.test(runtimeSource),
		'gameRuntime.ts sets pendingTransitionBridge');

	// Bridge map covers key thread fields
	const bridgedFields = ['oswaldoConflict', 'trinaTension', 'exhaustionLevel',
		'sydneyRealization', 'oswaldoAwareness', 'moneyResolved'];
	for (const field of bridgedFields) {
		assert(narrativeSource.includes(`${field}:`),
			`TRANSITION_BRIDGE_MAP covers '${field}'`);
	}

	// Feature flag gating
	assert(/featureFlags\.transitionBridges/.test(runtimeSource),
		'Transition bridges gated by feature flag');
}

// ---------------------------------------------------------------------------
// Tier 1, Suite 7: Sanity Gate Contract
// ---------------------------------------------------------------------------

function testSanityGateContract() {
	suite('Sanity Gate Contract');

	// Drift guard: hash the canonical sanity.ts function body
	const sanitySource = readSource('src/lib/server/ai/sanity.ts');
	assert(sanitySource !== null, 'sanity.ts exists');

	// Verify the mirror matches the source (structural check, not byte-exact)
	assert(sanitySource.includes('blockingIssues'), 'sanity.ts has blockingIssues classification');
	assert(sanitySource.includes('retryableIssues'), 'sanity.ts has retryableIssues classification');
	assert(sanitySource.includes('therapy_speak_summary'), 'sanity.ts checks therapy speak');
	assert(sanitySource.includes('scene_word_count_hard_limit'), 'sanity.ts has word count hard limit');
	assert(sanitySource.includes('scene_word_count_soft_limit'), 'sanity.ts has word count soft limit');
	assert(sanitySource.includes('ending_scene_word_count_hard_limit'), 'sanity.ts has ending word count hard limit');
	assert(sanitySource.includes('ending_scene_word_count_soft_limit'), 'sanity.ts has ending word count soft limit');

	// Test golden scenes pass
	const goldenScenes = loadJson('tests/narrative/fixtures/goldenScenes.json');
	assert(goldenScenes !== null && goldenScenes.length > 0, 'Golden fixtures loaded');

	for (const fixture of goldenScenes) {
		const result = evaluateStorySanity(fixture.scene);
		assert(
			result.blockingIssues.length === fixture.expectedSanity.blockingIssues.length,
			`Golden '${fixture.id}' has ${fixture.expectedSanity.blockingIssues.length} blocking issues`,
			`Expected ${fixture.expectedSanity.blockingIssues.length} blocking, got ${result.blockingIssues.length}: [${result.blockingIssues}]`
		);
		assert(
			result.retryableIssues.length === fixture.expectedSanity.retryableIssues.length,
			`Golden '${fixture.id}' has ${fixture.expectedSanity.retryableIssues.length} retryable issues`,
			`Expected ${fixture.expectedSanity.retryableIssues.length} retryable, got ${result.retryableIssues.length}: [${result.retryableIssues}]`
		);
	}

	// Test adversarial scenes fail correctly
	const adversarialScenes = loadJson('tests/narrative/fixtures/adversarialScenes.json');
	assert(adversarialScenes !== null && adversarialScenes.length > 0, 'Adversarial fixtures loaded');

	for (const fixture of adversarialScenes) {
		const result = evaluateStorySanity(fixture.scene);

		if (fixture.expectedBlocking && fixture.expectedBlocking.length > 0) {
			for (const expectedIssue of fixture.expectedBlocking) {
				assert(
					result.blockingIssues.includes(expectedIssue),
					`Adversarial '${fixture.id}' blocked by '${expectedIssue}'`,
					`Expected blocking issue '${expectedIssue}' not found. Got: [${result.blockingIssues}]`
				);
			}
		}

		if (fixture.expectedRetryable && fixture.expectedRetryable.length > 0) {
			for (const expectedIssue of fixture.expectedRetryable) {
				assert(
					result.retryableIssues.includes(expectedIssue),
					`Adversarial '${fixture.id}' retryable for '${expectedIssue}'`,
					`Expected retryable issue '${expectedIssue}' not found. Got: [${result.retryableIssues}]`
				);
			}
		}
	}
}

// ---------------------------------------------------------------------------
// Tier 1, Suite 8: Security Hygiene
// ---------------------------------------------------------------------------

function testSecurityHygiene() {
	suite('Security Hygiene');

	const narrativeSource = readSource('src/lib/server/ai/narrative.ts');
	const grokSource = readSource('src/lib/server/ai/providers/grok.ts');

	// No hardcoded API keys
	assert(!/AIza[A-Za-z0-9_-]{10,}/.test(narrativeSource),
		'No Google API key patterns in narrative.ts');
	assert(!/AIza[A-Za-z0-9_-]{10,}/.test(grokSource),
		'No Google API key patterns in grok.ts');
	assert(!/xai-[A-Za-z0-9]{20,}/.test(grokSource),
		'No xAI API key patterns in grok.ts');

	// No secrets in fixture files
	const goldenSource = readSource('tests/narrative/fixtures/goldenScenes.json');
	const adversarialSource = readSource('tests/narrative/fixtures/adversarialScenes.json');
	assert(!/AIza[A-Za-z0-9_-]{10,}/.test(goldenSource), 'No API keys in golden fixtures');
	assert(!/AIza[A-Za-z0-9_-]{10,}/.test(adversarialSource), 'No API keys in adversarial fixtures');

	// No localhost/internal URLs leaked in prompts
	assert(!/localhost:\d+/.test(narrativeSource),
		'No localhost URLs in narrative.ts');
}

// ---------------------------------------------------------------------------
// Tier 1, Suite 9: Regression Guard
// ---------------------------------------------------------------------------

function testRegressionGuard() {
	suite('Regression Guard');

	const grokSource = readSource('src/lib/server/ai/providers/grok.ts');
	const runtimeSource = readSource('src/lib/game/gameRuntime.ts');
	const narrativeSource = readSource('src/lib/server/ai/narrative.ts');

	// SYSTEM_PROMPT must be substantial (not a stub)
	const promptMatch = narrativeSource.match(/export\s+const\s+SYSTEM_PROMPT\s*=\s*`([\s\S]*?)`;/);
	assert(promptMatch !== null, 'SYSTEM_PROMPT is an exported template literal');
	if (promptMatch) {
		const promptLength = promptMatch[1].length;
		assert(promptLength > 5000,
			`SYSTEM_PROMPT is substantial (${promptLength} chars)`,
			`SYSTEM_PROMPT is only ${promptLength} chars — likely a stub`);
	}

	// NarrativeContext feature flag defaults to true
	const contractsSource = readSource('src/lib/contracts/game.ts');
	assert(/narrativeContextV2:\s*true/.test(contractsSource),
		'narrativeContextV2 defaults to true');
	assert(/transitionBridges:\s*true/.test(contractsSource),
		'transitionBridges defaults to true');

	// Runtime imports from narrative.ts (not hardcoded prompts)
	assert(/from\s+['"]\$lib\/server\/ai\/narrative['"]/.test(grokSource),
		'grok.ts imports from canonical narrative module');
	assert(/from\s+['"]\$lib\/server\/ai\/narrative['"]/.test(runtimeSource),
		'gameRuntime.ts imports from canonical narrative module');
}

// ---------------------------------------------------------------------------
// Tier 2: Narrative Quality Scoring (non-blocking, Claude-evaluated)
//
// Scores are produced by Claude via claude-code-action in CI.
// This runner reads pre-computed scores from artifacts/tier2-scores.json.
// If the file doesn't exist (local dev, no Claude step), Tier 2 is skipped.
// ---------------------------------------------------------------------------

function runTier2Scoring() {
	console.log('\n=== Tier 2: Narrative Quality Scoring (Non-blocking) ===');

	const scoresPath = path.join(ROOT, 'artifacts', 'tier2-scores.json');
	if (!fs.existsSync(scoresPath)) {
		console.log('  SKIP: No tier2-scores.json found');
		console.log('  (Tier 2 requires Claude evaluation via claude-code-action in CI)');
		return { fixtureScores: [], baselineComparison: null };
	}

	let tier2Data;
	try {
		tier2Data = JSON.parse(fs.readFileSync(scoresPath, 'utf8'));
	} catch (err) {
		console.log(`  SKIP: Failed to parse tier2-scores.json — ${err.message}`);
		return { fixtureScores: [], baselineComparison: null };
	}

	// Validate structure
	if (!tier2Data.fixtures || !Array.isArray(tier2Data.fixtures)) {
		console.log('  SKIP: tier2-scores.json missing fixtures array');
		return { fixtureScores: [], baselineComparison: null };
	}

	console.log(`  Evaluator: ${tier2Data.evaluator || 'unknown'}`);
	console.log(`  Evaluated at: ${tier2Data.timestamp || 'unknown'}`);

	const fixtureScores = [];
	for (const fixture of tier2Data.fixtures) {
		if (!fixture.scores) continue;

		fixtureScores.push({
			id: fixture.id,
			description: fixture.description,
			scores: fixture.scores
		});

		console.log(`\n  Fixture: ${fixture.id}`);
		console.log(`    Conventional:    ${fixture.scores.summary?.conventionalAvg}/5`);
		console.log(`    Unconventional:  ${fixture.scores.summary?.unconventionalAvg}/5`);
		console.log(`    Overall:         ${fixture.scores.summary?.overallAvg}/5`);

		if (fixture.scores.conventional) {
			for (const [k, v] of Object.entries(fixture.scores.conventional)) {
				console.log(`      [conv] ${k}: ${v}/5`);
			}
		}
		if (fixture.scores.unconventional) {
			for (const [k, v] of Object.entries(fixture.scores.unconventional)) {
				console.log(`      [unco] ${k}: ${v}/5`);
			}
		}
	}

	// Use pre-computed baseline comparison or calculate from scores
	let baselineComparison = tier2Data.baselineComparison || null;
	if (!baselineComparison && fixtureScores.length > 0) {
		const overallScores = fixtureScores
			.map((f) => f.scores.summary?.overallAvg)
			.filter((v) => typeof v === 'number');
		const currentAvg =
			Math.round((overallScores.reduce((a, b) => a + b, 0) / overallScores.length) * 100) / 100;
		const BASELINE_AVG = 3.5;
		baselineComparison = {
			baselineAvg: BASELINE_AVG,
			currentAvg,
			delta: Math.round((currentAvg - BASELINE_AVG) * 100) / 100,
			regression: currentAvg < BASELINE_AVG
		};
	}

	if (baselineComparison) {
		if (baselineComparison.regression) {
			console.log(
				`\n  WARNING: Quality regression (${baselineComparison.currentAvg}/5 < baseline ${baselineComparison.baselineAvg}/5)`
			);
		} else {
			console.log(
				`\n  Baseline check: ${baselineComparison.currentAvg}/5 >= ${baselineComparison.baselineAvg}/5 (OK)`
			);
		}
	}

	return { fixtureScores, baselineComparison };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log('=== Narrative Quality CI Pipeline ===');
console.log(`=== Tier 1: Blocking Gates ===`);

testCanonicalPromptWiring();
testVoiceIntegrity();
testLessonCorpusIntegrity();
testContextBuilderContract();
testContinuityDimensions();
testTransitionBridgeLogic();
testSanityGateContract();
testSecurityHygiene();
testRegressionGuard();

const tier2Results = runTier2Scoring();

// Build report
const report = {
	timestamp: new Date().toISOString(),
	passed: totalFailed === 0,
	tier1: {
		totalTests,
		totalPassed,
		totalFailed,
		suites: suiteResults
	},
	tier2: tier2Results
};

// Write artifacts
try {
	const paths = writeReport(report);
	console.log(`\nArtifacts written:`);
	console.log(`  ${paths.jsonPath}`);
	console.log(`  ${paths.mdPath}`);
} catch (err) {
	console.error(`Failed to write artifacts: ${err.message}`);
}

// Summary
console.log(`\n=== Summary ===`);
console.log(`Tier 1: ${totalPassed}/${totalTests} passed, ${totalFailed} failed`);
console.log(`Tier 2: ${tier2Results.fixtureScores.length} fixtures scored`);
if (tier2Results.baselineComparison) {
	console.log(`Tier 2 baseline: ${tier2Results.baselineComparison.currentAvg}/5 (baseline: ${tier2Results.baselineComparison.baselineAvg}/5)`);
}

if (totalFailed > 0) {
	console.error(`\nFAILED: ${totalFailed} blocking test(s) failed`);
	process.exit(1);
} else {
	console.log('\nPASSED: All blocking gates clear');
}
