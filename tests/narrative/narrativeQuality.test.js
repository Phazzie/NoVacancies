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

function readFile(relativePath) {
	const absolute = path.join(ROOT, relativePath);
	if (!fs.existsSync(absolute)) return null;
	return fs.readFileSync(absolute, 'utf8');
}

function readJson(relativePath) {
	const text = readFile(relativePath);
	if (!text) return null;
	return JSON.parse(text);
}

function testTierOneSmoke() {
	suite('Tier-1 Narrative Smoke');

	const goldenScenes = readJson('tests/narrative/fixtures/goldenScenes.json');
	const adversarialScenes = readJson('tests/narrative/fixtures/adversarialScenes.json');
	const reporter = readFile('tests/narrative/lib/reporter.js');
	const scorecard = readFile('tests/narrative/lib/scorecard.js');
	const sanityMirror = readFile('tests/narrative/lib/sanityMirror.js');

	assert(Array.isArray(goldenScenes), 'golden fixtures are loadable JSON arrays');
	assert(Array.isArray(adversarialScenes), 'adversarial fixtures are loadable JSON arrays');
	assert((goldenScenes?.length ?? 0) > 0, 'golden fixture set is non-empty');
	assert((adversarialScenes?.length ?? 0) > 0, 'adversarial fixture set is non-empty');
	assert(typeof reporter === 'string' && reporter.length > 0, 'reporter helper exists');
	assert(typeof scorecard === 'string' && scorecard.length > 0, 'scorecard helper exists');
	assert(typeof sanityMirror === 'string' && sanityMirror.length > 0, 'sanity mirror helper exists');
}

console.log('=== Narrative Quality CI Pipeline ===');

testTierOneSmoke();

console.log('\n=== Summary ===');
console.log(`Total: ${totalTests} | Passed: ${totalPassed} | Failed: ${totalFailed}`);

writeReport({
	passed: totalFailed === 0,
	tier1: {
		totalTests,
		totalPassed,
		suites: suiteResults
	},
	tier2: {
		fixtureScores: [],
		baselineComparison: null
	},
	note: 'Tier-1 smoke keeps narrative fixtures/reporting deterministic; behavior assertions live in unit suites.'
});

if (totalFailed > 0) {
	process.exit(1);
}
