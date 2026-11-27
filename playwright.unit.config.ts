import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './tests/unit',
	// Maps SvelteKit virtual modules ($app/*, $env/*) to plain shims so server modules load in Node.
	tsconfig: './tsconfig.unit.json',
	timeout: 15000,
	fullyParallel: true,
	workers: 2,
	retries: 0,
	reporter: [['list']]
});
