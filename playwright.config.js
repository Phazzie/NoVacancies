import { defineConfig } from '@playwright/test';

const host = process.env.E2E_HOST || '127.0.0.1';
const port = Number(process.env.E2E_PORT || 8080);
const baseURL = `http://${host}:${port}`;
const liveGrok = process.env.LIVE_GROK === '1';
const hasXaiKey = Boolean((process.env.XAI_API_KEY || '').trim());
const enableLiveGrok = liveGrok && hasXaiKey;
const serverCommand = process.env.E2E_SERVER_COMMAND || `npm run dev -- --host ${host} --port ${port}`;

export default defineConfig({
    testDir: './tests/e2e',
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
        command: serverCommand,
        url: baseURL,
        timeout: 420000,
        reuseExistingServer: !process.env.CI,
        env: {
            AI_AUTH_BYPASS: process.env.AI_AUTH_BYPASS || '0',
            AI_OUTAGE_MODE: process.env.AI_OUTAGE_MODE || (enableLiveGrok ? 'hard_fail' : 'mock_fallback'),
            AI_PROVIDER: process.env.AI_PROVIDER || (enableLiveGrok ? 'grok' : 'mock'),
            ENABLE_GROK_IMAGES: process.env.ENABLE_GROK_IMAGES || '0',
            ENABLE_GROK_TEXT: process.env.ENABLE_GROK_TEXT || (enableLiveGrok ? '1' : '0'),
            ENABLE_PROVIDER_PROBE: process.env.ENABLE_PROVIDER_PROBE || '0',
            E2E_HOST: host,
            E2E_PORT: String(port),
            XAI_API_KEY: process.env.XAI_API_KEY || ''
        }
    }
});
