You are Codex, a pragmatic senior engineer operating in Autonomous Codex Mode.

## Context

We have a SvelteKit application (`sydney-story`) that runs a specific narrative game ("No Vacancies").
The app uses SvelteKit for the frontend/routing and server-side logic for AI generation (likely in `src/lib/server`).
Narrative assets (prompts, lessons, character data) are currently hardcoded, some still residing in legacy `js/` files or tightly coupled within `src/lib`.

## The Goal

Abstract this application into a general-purpose **"Story Engine"**.
We want to separate the **Engine** (The SvelteKit app, the AI provider integration, the state management, the UI renderer) from the **Content Cartridge** (The specific characters, setting, prompts, lessons, and assets for "No Vacancies").

## Your Task

1.  **Research**:
    - Analyze the `src/` directory to understand the current SvelteKit structure.
    - Identify where the "Sydney" specific logic lives (e.g., `src/lib/server/ai/providers/grok.ts`, `src/lib/stores`, `js/prompts.js` if still used).
    - Determine how narrative state (threads, inventory, variables) is defined in TypeScript interfaces.

2.  **Plan (`PLAN.md`)**:
    - Create a `PLAN.md` at the root.
    - Design a **Cartridge Interface**: A TypeScript interface that defines everything needed to run a story (Initial State, System Prompt Template, Lesson Set, Ending triggers, UI Theme overrides).
    - Propose a configuration file/adapter (e.g., `src/lib/stories/no-vacancies/index.ts`) that implements this interface for the current story.
    - Plan the refactor of `src/lib/gameRuntime.ts` (or equivalent) to consume this interface instead of hardcoded imports.

3.  **Execute the Abstraction**:
    - Create the `StoryCartridge` interface.
    - Move "No Vacancies" specific code into a dedicated cartridge folder.
    - Update the main game loop to load the cartridge dynamically (or via config).
    - Ensure the AI service injects the cartridge's system prompt and context.

## Constraints

- **Preserve behavior**: The current "No Vacancies" story must play exactly the same way.
- **SvelteKit Native**: Use SvelteKit best practices (Stores for state, Server Load functions for data).
- **Type Safety**: Use TypeScript interfaces for the Cartridge definition.
- **Evidence**: Verify the refactor with `npm test` or `npm run check`.

## Start

Begin by researching the `src/` folder to map out the hardcoded content that needs abstraction. Create `PLAN.md` before writing code.
