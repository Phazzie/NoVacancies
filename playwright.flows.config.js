import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

// Main-flow E2E: runs the built app with a stubbed xAI upstream (tests/e2e/fixtures/fakeXai.mjs)
// so play → ending and builder flows are exercised end to end without network or a real key.
const host = process.env.E2E_HOST || '127.0.0.1';
const port = Number(process.env.E2E_FLOWS_PORT || 8090);
const baseURL = `http://${host}:${port}`;
const fakeXai = fileURLToPath(new URL('./tests/e2e/fixtures/fakeXai.mjs', import.meta.url));

export default defineConfig({
	testDir: './tests/e2e/flows',
	timeout: 45000,
	fullyParallel: false,
	workers: 1,
	retries: 0,
	reporter: [['list']],
	use: {
		baseURL,
		headless: true,
		trace: 'retain-on-failure',
		serviceWorkers: 'block'
	},
	webServer: {
		command: `npx vite preview --host ${host} --port ${port} --strictPort`,
		url: baseURL,
		timeout: 120000,
		reuseExistingServer: !process.env.CI,
		env: {
			NODE_OPTIONS: `--import ${fakeXai}`,
			AI_PROVIDER: 'grok',
			AI_OUTAGE_MODE: 'hard_fail',
			ENABLE_GROK_TEXT: '1',
			ENABLE_GROK_IMAGES: '0',
			ENABLE_PROVIDER_PROBE: '0',
			XAI_API_KEY: 'fake_key_for_flow_tests',
			AUTH_SESSION_SECRET: 'playwright_flow_secret',
			DEMO_AUTH_ENABLED: '1',
			FAKE_XAI_ENDING_AFTER: '3'
		}
	}
});
