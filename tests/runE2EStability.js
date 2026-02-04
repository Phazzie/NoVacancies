/**
 * Run Playwright reliability suite three consecutive times.
 * Fails fast on first non-zero run.
 */

import { spawn } from 'node:child_process';

function runOnce(iteration) {
    return new Promise((resolve, reject) => {
        console.log(`\n[E2E Stability] Run ${iteration}/3 starting...`);
        const command =
            'npx playwright test tests/e2e/demo-reliability.spec.js --reporter=line --retries=0';
        const child = spawn(command, {
            stdio: 'inherit',
            shell: true
        });

        child.on('error', (error) => reject(error));
        child.on('exit', (code) => {
            if (code === 0) {
                console.log(`[E2E Stability] Run ${iteration}/3 passed.`);
                resolve();
            } else {
                reject(new Error(`E2E stability run ${iteration} failed with exit code ${code}`));
            }
        });
    });
}

async function main() {
    for (let i = 1; i <= 3; i++) {
        await runOnce(i);
    }
    console.log('\n[E2E Stability] All 3 runs passed.');
}

main().catch((error) => {
    console.error('\n[E2E Stability] Failure:', error.message);
    process.exit(1);
});
