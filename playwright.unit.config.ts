import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './tests/unit',
	timeout: 15000,
	fullyParallel: true,
	workers: 2,
	retries: 0,
	reporter: [['list']]
});
