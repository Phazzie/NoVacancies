#!/usr/bin/env node
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import net from 'node:net';

const HOST = '127.0.0.1';

function wait(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForReadiness(url, timeoutMs = 180000) {
	const started = Date.now();
	while (Date.now() - started < timeoutMs) {
		try {
			const response = await fetch(url);
			if (response.ok) {
				return;
			}
		} catch {
			// server still booting
		}
		await wait(400);
	}
	throw new Error(`Timed out waiting for ${url}`);
}

function formatCapturedOutput(stdout, stderr) {
	const sections = [];
	const trimmedStdout = stdout.trim();
	const trimmedStderr = stderr.trim();
	if (trimmedStdout) {
		sections.push(`Captured stdout:\n${trimmedStdout.slice(-2400)}`);
	}
	if (trimmedStderr) {
		sections.push(`Captured stderr:\n${trimmedStderr.slice(-2400)}`);
	}
	return sections.length ? `\n${sections.join('\n\n')}` : '';
}

async function findFreePort(startPort) {
	let port = startPort;
	while (port < startPort + 100) {
		const available = await new Promise((resolve) => {
			const server = net.createServer();
			server.once('error', () => resolve(false));
			server.once('listening', () => {
				server.close(() => resolve(true));
			});
			server.listen(port, HOST);
		});
		if (available) return port;
		port += 1;
	}
	throw new Error(`Unable to find a free port starting from ${startPort}`);
}

async function runScenario({
	label,
	port,
	storyId,
	expectStoryId,
	expectBlocked,
	expectHomeTitle,
	extraEnv = {},
	expectFailingCheckId,
	expectFailingDetail
}) {
	const env = {
		...process.env,
		PUBLIC_STORY_ID: storyId ?? '',
		AI_PROVIDER: 'grok',
		AI_OUTAGE_MODE: 'hard_fail',
		ENABLE_GROK_TEXT: '1',
		ENABLE_GROK_IMAGES: '0',
		AI_AUTH_BYPASS: '0',
		XAI_API_KEY: 'test_key_for_selection_smoke',
		FORCE_COLOR: '0',
		...extraEnv
	};
	console.log(`[smoke] starting ${label} on port ${port}`);

	const npmExec = typeof process.env.npm_execpath === 'string' ? process.env.npm_execpath : '';
	const command = npmExec
		? process.execPath
		: process.platform === 'win32'
			? 'npm.cmd'
			: 'npm';
	const args = npmExec
		? [npmExec, 'run', 'dev', '--', '--host', HOST, '--port', String(port)]
		: ['run', 'dev', '--', '--host', HOST, '--port', String(port)];

	const child = spawn(command, args, {
		env,
		stdio: ['ignore', 'pipe', 'pipe'],
		detached: true
	});

	let stdout = '';
	let stderr = '';
	let spawnError = null;
	let exitDetails = null;
	child.stdout.on('data', (chunk) => {
		stdout += chunk.toString();
	});
	child.stderr.on('data', (chunk) => {
		stderr += chunk.toString();
	});
	child.once('error', (error) => {
		spawnError = error;
	});
	child.once('exit', (code, signal) => {
		exitDetails = { code, signal };
	});

	try {
		const url = `http://${HOST}:${port}/api/demo/readiness`;
		await waitForReadiness(url).catch((error) => {
			if (spawnError) {
				throw new Error(`${label}: failed to start dev server (${spawnError.message})`);
			}
			if (exitDetails) {
				throw new Error(
					`${label}: dev server exited before readiness (code=${exitDetails.code}, signal=${exitDetails.signal})${formatCapturedOutput(stdout, stderr)}`
				);
			}
			throw new Error(
				`${label}: ${error instanceof Error ? error.message : String(error)}${formatCapturedOutput(stdout, stderr)}`
			);
		});
		const payload = await fetch(url).then((res) => res.json());

		if (expectBlocked) {
			assert.equal(payload.status, 'blocked', `${label}: expected blocked status`);
			if (expectFailingCheckId) {
				const failingCheck = payload.checks?.find((check) => check.id === expectFailingCheckId);
				assert.equal(Boolean(failingCheck), true, `${label}: expected failing check ${expectFailingCheckId}`);
				assert.equal(Boolean(failingCheck?.ok), false, `${label}: expected failing check to be false`);
				if (expectFailingDetail) {
					assert.match(
						failingCheck?.details ?? '',
						expectFailingDetail,
						`${label}: expected failure detail`
					);
				}
			}
			return;
		}

		assert.equal(payload.activeStory?.id, expectStoryId, `${label}: wrong active story id`);

		const homeHtml = await fetch(`http://${HOST}:${port}/`).then((res) => res.text());
		assert.match(homeHtml, new RegExp(expectHomeTitle, 'i'), `${label}: expected home branding`);
		if (expectStoryId === 'starter-kit') {
			assert.doesNotMatch(homeHtml, /No Vacancies/i, `${label}: should not leak No Vacancies shell copy`);
		}

		const builderFallback = await fetch(`http://${HOST}:${port}/api/builder/generate-draft`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify({ premise: '' })
		}).then((res) => res.json());
		assert.equal(builderFallback.source, 'fallback', `${label}: expected fallback builder source`);
		assert.equal(builderFallback.draft?.title, 'Starter Story', `${label}: expected neutral builder title`);
		assert.doesNotMatch(
			JSON.stringify(builderFallback.draft ?? {}),
			/No Vacancies|Sydney|daily-rate motel/i,
			`${label}: builder fallback should stay story-neutral`
		);
		console.log(`[smoke] passed ${label}`);
	} finally {
		if (!child.pid) return;
		try {
			process.kill(-child.pid, 'SIGTERM');
		} catch {}
		await wait(250);
		try {
			process.kill(-child.pid, 'SIGKILL');
		} catch {}
	}

	if (stdout.includes('ERR') || stderr.includes('ERR')) {
		// No-op: keep stderr available for troubleshooting if future failures occur.
	}
}

async function main() {
	const basePort = await findFreePort(4173);
	await runScenario({
		label: 'default story',
		port: basePort,
		storyId: undefined,
		expectStoryId: 'no-vacancies',
		expectBlocked: false,
		expectHomeTitle: 'No Vacancies'
	});
	await runScenario({
		label: 'starter-kit story',
		port: basePort + 1,
		storyId: 'starter-kit',
		expectStoryId: 'starter-kit',
		expectBlocked: false,
		expectHomeTitle: 'Starter Kit Story'
	});
	await runScenario({
		label: 'disabled text generation blocks readiness',
		port: basePort + 2,
		storyId: undefined,
		expectStoryId: '',
		expectBlocked: true,
		extraEnv: {
			ENABLE_GROK_TEXT: '0'
		},
		expectFailingCheckId: 'text_generation',
		expectFailingDetail: /Generation disabled/i
	});
	await runScenario({
		label: 'invalid story id',
		port: basePort + 3,
		storyId: 'unknown-story',
		expectStoryId: '',
		expectBlocked: true,
		expectFailingCheckId: 'config_valid',
		expectFailingDetail: /Unknown story cartridge id/i
	});

	console.log('Story engine runtime selection scenarios passed.');
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
});
