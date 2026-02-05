import { defineConfig } from '@playwright/test';

const host = process.env.E2E_HOST || '127.0.0.1';
const port = Number(process.env.E2E_PORT || 8080);
const baseURL = `http://${host}:${port}`;

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
        command: 'node tests/e2e/staticServer.js',
        url: baseURL,
        timeout: 15000,
        reuseExistingServer: !process.env.CI,
        env: {
            E2E_HOST: host,
            E2E_PORT: String(port)
        }
    }
});
