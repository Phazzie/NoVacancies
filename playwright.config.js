import { defineConfig } from '@playwright/test';

const host = process.env.E2E_HOST || '127.0.0.1';
const port = Number(process.env.E2E_PORT || 8080);
const baseURL = `http://${host}:${port}`;
const defaultServerCommand =
    process.env.E2E_USE_STATIC_SERVER === '1'
        ? 'node tests/e2e/staticServer.js'
        : `npm run dev -- --host ${host} --port ${port}`;
const serverCommand = process.env.E2E_SERVER_COMMAND || defaultServerCommand;

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
            E2E_HOST: host,
            E2E_PORT: String(port)
        }
    }
});
