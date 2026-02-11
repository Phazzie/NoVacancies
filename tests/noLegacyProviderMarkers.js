#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PATHS_TO_SCAN = ['src', 'js', 'tests/e2e', 'package.json'];
const FILE_EXTENSIONS = new Set(['.ts', '.js', '.svelte', '.json']);
const BANNED_PATTERNS = [
	{ name: 'gemini keyword', regex: /\bgemini\b/i },
	{ name: 'Google Generative Language endpoint', regex: /generativelanguage\.googleapis\.com/i },
	{ name: 'AIza-style key marker', regex: /AIza[A-Za-z0-9_-]{10,}/ },
	{ name: 'Legacy Prompt Generator', regex: /generateGeminiPrompt/ },
	{ name: 'Legacy API Key Var', regex: /google_api_key/i }
];
const PARITY_CHECKS = [
	{
		file: 'src/lib/server/ai/providers/grok.ts',
		require: [
			/SYSTEM_PROMPT/,
			/getOpeningPrompt/,
			/getContinuePromptFromContext/,
			/getRecoveryPrompt/
		],
		forbid: [/interactive fiction engine\. output json only\./i]
	},
	{
		file: 'src/lib/game/gameRuntime.ts',
		require: [/buildNarrativeContext\(/, /detectThreadTransitions\(/]
	},
	{
		file: 'src/lib/server/ai/sanity.ts',
		require: [/scene_word_count_soft_limit/, /ending_scene_word_count_soft_limit/]
	},
	{
		file: 'src/lib/server/ai/narrative.ts',
		require: [/He will ride five miles for strangers and five inches for nobody in this room\./]
	}
];

function walk(targetPath, acc) {
	const stat = fs.statSync(targetPath);
	if (stat.isDirectory()) {
		for (const entry of fs.readdirSync(targetPath)) {
			walk(path.join(targetPath, entry), acc);
		}
		return;
	}

	const ext = path.extname(targetPath);
	if (!FILE_EXTENSIONS.has(ext) && path.basename(targetPath) !== 'package.json') {
		return;
	}
	acc.push(targetPath);
}

function collectFiles() {
	const files = [];
	for (const relative of PATHS_TO_SCAN) {
		const absolute = path.join(ROOT, relative);
		if (!fs.existsSync(absolute)) {
			continue;
		}
		walk(absolute, files);
	}
	return files;
}

function findViolations(files) {
	const violations = [];
	for (const file of files) {
		const content = fs.readFileSync(file, 'utf8');
		for (const pattern of BANNED_PATTERNS) {
			if (pattern.regex.test(content)) {
				violations.push({
					file: path.relative(ROOT, file),
					pattern: pattern.name
				});
			}
		}
	}
	return violations;
}

const files = collectFiles();
const violations = findViolations(files);
const parityViolations = [];

if (violations.length > 0) {
	console.error('Found banned Gemini markers in active runtime paths:');
	for (const violation of violations) {
		console.error(`- ${violation.file} (${violation.pattern})`);
	}
	process.exit(1);
}

for (const check of PARITY_CHECKS) {
	const absolutePath = path.join(ROOT, check.file);
	if (!fs.existsSync(absolutePath)) {
		parityViolations.push(`${check.file} (missing file)`);
		continue;
	}
	const content = fs.readFileSync(absolutePath, 'utf8');
	for (const pattern of check.require || []) {
		if (!pattern.test(content)) {
			parityViolations.push(`${check.file} (missing: ${String(pattern)})`);
		}
	}
	for (const pattern of check.forbid || []) {
		if (pattern.test(content)) {
			parityViolations.push(`${check.file} (forbidden: ${String(pattern)})`);
		}
	}
}

if (parityViolations.length > 0) {
	console.error('Found narrative parity marker regressions:');
	for (const violation of parityViolations) {
		console.error(`- ${violation}`);
	}
	process.exit(1);
}

console.log('Active runtime paths are Gemini-clean.');
