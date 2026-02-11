import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './tests/unit',
	timeout: 10000,
	fullyParallel: true,
	workers: 4,
	retries: 0,
	reporter: [['list']],
	use: {
		headless: true
	}
});
