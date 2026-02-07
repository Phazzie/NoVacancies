# Playwright Setup (One Step at a Time)

Run these in order from repo root:

`/mnt/c/Users/latro/Downloads/t/sydney-story`

## Step 1: Load `nvm` in current shell

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
```

Expected: no error output.

## Step 2: Switch to Node 22

```bash
nvm use 22
```

Expected: message showing `Now using node v22...`.

## Step 3: Verify Node and npm are available

```bash
node -v
npm -v
command -v npm
```

Expected:
- `node -v` prints a version
- `npm -v` prints a version
- `command -v npm` prints a path

## Step 4: Install Playwright system dependencies

```bash
npm exec playwright install-deps chromium
```

Expected: dependency install completes without final error.

## Step 5: Install Chromium browser binary locally

```bash
PLAYWRIGHT_BROWSERS_PATH=.playwright-browsers npm exec playwright install chromium
```

Expected: install finishes with success output.

## Step 6: Run e2e tests

```bash
PLAYWRIGHT_BROWSERS_PATH=.playwright-browsers npm run test:e2e
```

Expected: tests start and run instead of failing at browser launch.

## If a Step Fails

Copy the last 30-50 lines of terminal output and stop there. Debug only that step before continuing.
