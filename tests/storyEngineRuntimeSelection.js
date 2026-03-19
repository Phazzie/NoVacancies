#!/usr/bin/env node
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import net from 'node:net';

const HOST = '127.0.0.1';

function wait(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForReadiness(url, timeoutMs = 120000) {
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

async function runScenario({ label, port, storyId, expectStoryId, expectBlocked }) {
	const env = {
		...process.env,
		PUBLIC_STORY_ID: storyId ?? '',
		AI_PROVIDER: 'grok',
		AI_OUTAGE_MODE: 'hard_fail',
		ENABLE_GROK_TEXT: '1',
		ENABLE_GROK_IMAGES: '0',
		AI_AUTH_BYPASS: '0',
		XAI_API_KEY: 'test_key_for_selection_smoke',
		FORCE_COLOR: '0'
	};

	const child = spawn('npm', ['run', 'dev', '--', '--host', HOST, '--port', String(port)], {
		env,
		stdio: ['ignore', 'pipe', 'pipe'],
		detached: true
	});

	let stderr = '';
	child.stderr.on('data', (chunk) => {
		stderr += chunk.toString();
	});

	try {
		const url = `http://${HOST}:${port}/api/demo/readiness`;
		await waitForReadiness(url);
		const payload = await fetch(url).then((res) => res.json());

		if (expectBlocked) {
			assert.equal(payload.status, 'blocked', `${label}: expected blocked status`);
			assert.equal(payload.checks?.[0]?.id, 'config_valid', `${label}: expected config_valid failure`);
			assert.match(
				payload.checks?.[0]?.details ?? '',
				/Unknown story cartridge id/i,
				`${label}: expected unknown cartridge detail`
			);
			return;
		}

		assert.equal(payload.activeStory?.id, expectStoryId, `${label}: wrong active story id`);
	} finally {
		try {
			process.kill(-child.pid, 'SIGTERM');
		} catch {}
		await wait(250);
		try {
			process.kill(-child.pid, 'SIGKILL');
		} catch {}
	}

	if (stderr.includes('ERR')) {
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
		expectBlocked: false
	});
	await runScenario({
		label: 'starter-kit story',
		port: basePort + 1,
		storyId: 'starter-kit',
		expectStoryId: 'starter-kit',
		expectBlocked: false
	});
	await runScenario({
		label: 'invalid story id',
		port: basePort + 2,
		storyId: 'unknown-story',
		expectStoryId: '',
		expectBlocked: true
	});

	console.log('Story engine runtime selection scenarios passed.');
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
});
