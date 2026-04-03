#!/usr/bin/env node
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import net from 'node:net';
import { createHmac } from 'node:crypto';

const HOST = '127.0.0.1';
const TEST_SESSION_SECRET = 'test_runtime_selection_secret';

function toBase64Url(value) {
	return Buffer.from(value)
		.toString('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/g, '');
}

function createSignedSessionCookie(user, secret, nowSeconds = Math.floor(Date.now() / 1000)) {
	// This is the app's custom `nv_session` envelope format: base64url(payload).signature.
	// It intentionally is not a JWT because builder auth uses a lightweight HMAC-signed envelope.
	// This mirrors `parseSessionCookie` + `signPayload` in src/lib/server/auth.ts.
	const payload = {
		userId: user.userId,
		role: user.role,
		iat: nowSeconds,
		exp: nowSeconds + 60 * 60
	};
	const encodedPayload = toBase64Url(JSON.stringify(payload));
	const signature = createHmac('sha256', secret).update(encodedPayload).digest('base64url');
	return `${encodedPayload}.${signature}`;
}

function wait(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
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

/**
 * Resolve the npm executable to use for spawning child processes.
 * When invoked via `npm test`, npm sets npm_execpath to the actual npm script
 * path (which may be a JS file or a binary), so using it avoids PATH issues.
 */
function resolveNpm() {
	const npmExecPath = typeof process.env.npm_execpath === 'string' ? process.env.npm_execpath : '';
	if (npmExecPath) {
		if (npmExecPath.endsWith('.js') || npmExecPath.endsWith('.cjs')) {
			return {
				cmd: process.execPath,
				argsPrefix: [npmExecPath]
			};
		}
		return {
			cmd: npmExecPath,
			argsPrefix: []
		};
	}

	return {
		cmd: process.platform === 'win32' ? 'npm.cmd' : 'npm',
		argsPrefix: []
	};
}

/**
 * Poll `url` until it responds with a 2xx status.
 * Races against early child-process exit so the test fails fast instead of
 * hanging when the dev server crashes during startup.
 */
async function waitForReadiness(url, child, timeoutMs = 120000) {
	const exitPromise = new Promise((_, reject) => {
		const handleExit = (code, signal) => {
			reject(
				new Error(
					`Dev server exited before becoming ready (code=${code ?? '?'}, signal=${signal ?? 'none'})`
				)
			);
		};
		const handleError = (error) => {
			reject(new Error(`Dev server spawn error: ${error.message}`));
		};

		child.once('exit', handleExit);
		child.once('error', handleError);
	});

	const pollPromise = (async () => {
		const started = Date.now();
		while (Date.now() - started < timeoutMs) {
			try {
				const response = await fetch(url);
				if (response.ok) {
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

async function findDistinctFreePorts(startPort, count) {
	const ports = [];
	let cursor = startPort;
	while (ports.length < count) {
		const port = await findFreePort(cursor);
		ports.push(port);
		cursor = port + 1;
	}
	return ports;
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
		AUTH_SESSION_SECRET: TEST_SESSION_SECRET,
		XAI_API_KEY: 'test_key_for_selection_smoke',
		FORCE_COLOR: '0',
		...extraEnv
	};
	console.log(`[smoke] starting ${label} on port ${port}`);

	const { cmd, argsPrefix } = resolveNpm();
	const args = [
		...argsPrefix,
		'run',
		'dev',
		'--',
		'--host',
		HOST,
		'--port',
		String(port),
		'--strictPort'
	];

	const child = spawn(cmd, args, {
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
		await waitForReadiness(url, child).catch((error) => {
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

		const authSessionSecret = env.AUTH_SESSION_SECRET?.trim() ?? TEST_SESSION_SECRET;
		const sessionCookieValue = createSignedSessionCookie(
			{ userId: 'runtime-selection-smoke', role: 'author' },
			authSessionSecret
		);
		const builderFallback = await fetch(`http://${HOST}:${port}/api/builder/generate-draft`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				cookie: `nv_session=${sessionCookieValue}`
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
	} catch (error) {
		throw new Error(
			`${label}: ${error instanceof Error ? error.message : String(error)}${formatCapturedOutput(stdout, stderr)}`
		);
	} finally {
		if (!child.pid) return;
		try {
			process.kill(-child.pid, 'SIGTERM');
		} catch {}
		await wait(1000);
		try {
			process.kill(-child.pid, 'SIGKILL');
		} catch {}
	}
}

async function main() {
	const [defaultPort, starterPort, disabledTextPort, invalidStoryPort] = await findDistinctFreePorts(
		4173,
		4
	);
	await runScenario({
		label: 'default story',
		port: defaultPort,
		storyId: undefined,
		expectStoryId: 'no-vacancies',
		expectBlocked: false,
		expectHomeTitle: 'No Vacancies'
	});
	await runScenario({
		label: 'starter-kit story',
		port: starterPort,
		storyId: 'starter-kit',
		expectStoryId: 'starter-kit',
		expectBlocked: false,
		expectHomeTitle: 'Starter Kit Story'
	});
	await runScenario({
		label: 'disabled text generation blocks readiness',
		port: disabledTextPort,
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
		port: invalidStoryPort,
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
