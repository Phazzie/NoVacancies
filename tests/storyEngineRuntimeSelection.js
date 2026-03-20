#!/usr/bin/env node
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import net from 'node:net';

const HOST = '127.0.0.1';

function wait(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Resolve the npm executable to use for spawning child processes.
 * When invoked via `npm test`, npm sets npm_execpath to the actual npm script
 * path (may be a .js file or a binary). Using it avoids PATH lookup failures.
 */
function resolveNpm() {
	const npmExecPath = process.env.npm_execpath;
	if (npmExecPath) {
		if (npmExecPath.endsWith('.js') || npmExecPath.endsWith('.cjs')) {
			// npm_execpath is a JS script — run it through the current node binary
			return { cmd: process.execPath, args: [npmExecPath, 'run', 'dev', '--'] };
		}
		// npm_execpath is a binary (e.g. /usr/bin/npm)
		return { cmd: npmExecPath, args: ['run', 'dev', '--'] };
	}
	// Fallback: rely on npm being available on PATH
	return { cmd: 'npm', args: ['run', 'dev', '--'] };
}

/**
 * Poll `url` until it responds with a 2xx status.
 * Races against early child-process exit so we fail fast instead of waiting
 * the full timeout when the server crashes during startup.
 */
async function waitForReadiness(url, child, timeoutMs = 120000) {
	// Rejected if the child exits before the server becomes ready
	const exitPromise = new Promise((_, reject) => {
		child.once('exit', (code, signal) => {
			reject(
				new Error(
					`Dev server exited before becoming ready (code=${code ?? '?'}, signal=${signal ?? 'none'})`
				)
			);
		});
		child.once('error', (err) => {
			reject(new Error(`Dev server spawn error: ${err.message}`));
		});
	});

	const pollPromise = (async () => {
		const started = Date.now();
		while (Date.now() - started < timeoutMs) {
			try {
				const response = await fetch(url);
				if (response.ok) {
					// Server is up — remove exit listeners to prevent spurious rejection
					child.removeAllListeners('exit');
					child.removeAllListeners('error');
					return;
				}
			} catch {
				// server still booting
			}
			await wait(400);
		}
		throw new Error(`Timed out waiting for ${url}`);
	})();

	await Promise.race([pollPromise, exitPromise]);
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

	const { cmd, args } = resolveNpm();
	const child = spawn(cmd, [...args, '--host', HOST, '--port', String(port)], {
		env,
		stdio: ['ignore', 'pipe', 'pipe'],
		detached: true
	});

	let stdout = '';
	let stderr = '';
	child.stdout.on('data', (chunk) => {
		stdout += chunk.toString();
	});
	child.stderr.on('data', (chunk) => {
		stderr += chunk.toString();
	});

	try {
		const url = `http://${HOST}:${port}/api/demo/readiness`;
		await waitForReadiness(url, child);
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
	} catch (err) {
		// Print captured output before re-throwing so failures are diagnosable
		if (stdout) console.error(`[${label}] stdout:\n${stdout.slice(-2000)}`);
		if (stderr) console.error(`[${label}] stderr:\n${stderr.slice(-2000)}`);
		throw err;
	} finally {
		if (child.pid) {
			try {
				process.kill(-child.pid, 'SIGTERM');
			} catch {}
			await wait(1000);
			try {
				process.kill(-child.pid, 'SIGKILL');
			} catch {}
		}
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
