import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    timeout: 45000,
    fullyParallel: false,
    workers: 1,
    retries: 1,
    reporter: [['list']],
    use: {
        baseURL: 'http://127.0.0.1:8080',
        headless: true,
        trace: 'on-first-retry',
        serviceWorkers: 'block'
    },
    webServer: {
        command: 'npm run dev',
        url: 'http://127.0.0.1:8080',
        reuseExistingServer: true,
        timeout: 120000
    }
});
