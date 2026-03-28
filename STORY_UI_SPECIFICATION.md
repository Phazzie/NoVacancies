# No Vacancies: Story UI Specification

**Date:** 2026-03-26
**Version:** 1.0.0
**Scope:** Story Builder (`/builder`) and Story Player (`/play`) UI requirements

---

## Story Player UI (`/play` route)

### Must Do

1. **Display Scene Content**
   - Render scene narrative text (`sceneText`)
   - Display atmospheric image (`imageKey` resolved from story's `imagePaths` or pre-generated pool)
   - Show image with scrim overlay

2. **Display Choices**
   - Show exactly 3 choices per scene
   - Each choice displays: choice text (`choice.text`)
   - Assign keyboard hotkey numbers 1/2/3 for rapid selection
   - Activate choice on `1`/`2`/`3` key press
   - Activate choice on button click
   - Prevent duplicate choice selection while processing

3. **Display Lesson Insight**
   - When `lessonId` is non-null: render lesson title, quote, and insight from lessons catalog
   - When `lessonId` is null AND `showLessons` setting is enabled: display explicit "no lesson tagged" message
   - When `showLessons` setting is false: do not render lesson card
   - Lesson display appears after scene text finishes rendering

4. **Display Arc Progress**
   - Show visual arc progress meter
   - Label current arc stage: "Opening Pressure", "Rising Pressure", "Consequence", "Endgame"
   - Calculate arc stage from scene count (0-3: Opening, 4-7: Rising, 8-11: Consequence, 12+: Endgame)
   - Show pressure indicator pill with mood context

5. **Display Mood Indicator**
   - When `mood` field present on scene: display mood chip (neutral, tense, hopeful, dark, triumphant)
   - Show as optional visual indicator

6. **Display Meta Information**
   - Show current scene number (from history length)
   - Show total game duration (from `startTime` to now)
   - Display mode indicator (always "AI Mode" - no mock mode toggle)

7. **Handle Ending State**
   - When `isEnding: true` received: display ending scene text
   - Show `endingType` (custom 1-3 word poetic ending or canonical type: loop, shift, exit, rare)
   - Render "Play Again" button linking back to `/`
   - On ending reach: transition to `/ending` route

8. **Handle Processing State**
   - Disable choice buttons while API request is in-flight
   - Show loading indicator during scene generation
   - Display choice text that explains next pressure point to create anticipation

9. **Handle Error/Blocked State**
   - When Grok API is unavailable/misconfigured: display explicit blocked state
   - Show user-friendly error mapping (missing API key, auth failure, rate limit, timeout, provider down)
   - For missing/misconfigured API key, explain that configuration is server-side (`XAI_API_KEY`) and requires operator/redeploy action
   - Keep `/settings` focused on runtime toggles/readiness and `/debug` for diagnostics
   - Provide direct navigation to `/debug` (to see detailed error log)
   - Do NOT show ambiguous loading spinner
   - If fallback is introduced, it must preserve playability and never force an invalid/abrupt ending path

10. **Apply Motel-Noir Design System**
    - Use dark atmospheric aesthetic (not bright or utility-forward)
    - Maintain typography hierarchy and motel-inspired styling
    - Use consistent color/contrast with rest of app (`/`, `/ending`, `/settings`, `/debug`)
    - Ensure browser metadata (theme color, description) matches redesign direction

11. **Maintain Keyboard & Accessibility**
    - Preserve visible focus indicators on all interactive elements
    - Keep keyboard shortcuts (`1`/`2`/`3`) functional and documented
    - Support tab navigation through choices
    - Ensure screen reader labels for scene/choices/arc

12. **Update Story State**
    - Process choice selection and request next scene from `/api/story/next`
    - Pass `NarrativeContext` (thread state, recent prose, lesson history, etc.)
    - Merge returned `storyThreadUpdates` into `gameState.storyThreads`
    - Detect thread state transitions and apply transition bridge prose
    - Update `gameState.sceneLog` with new scene record
    - Track `lessonsEncountered` array
    - Persist game state to localStorage after each turn

### Must NOT Do

1. Use external font dependencies
2. Introduce Content Security Policy vulnerabilities
3. Expose user-facing toggles between AI runtime and fallback/static modes
4. Show "Loading..." spinner when Grok is misconfigured
5. Toggle between "AI Mode" and "Mock Mode" or "Static Story"
6. Allow user API key entry in browser
7. Leave template artifacts or stale "default app" styling
8. Display generic narrative context (prose must be story-specific)
9. Auto-advance to `/ending` mid-typewriter (require explicit "View Recap" click)
10. Restore unused route behaviors from legacy static shell

### Required Features

- **Keyboard Hotkeys:** 1/2/3 for rapid choice selection
- **Restart Run:** Action to reset current game and start over (returns to opening scene)
- **Scene Chips:** Display scene ID and sequence number for operator triage
- **Arc Chips:** Display arc stage and pressure indicator
- **Mood Chips:** Optional mood visualization tied to scene mood field
- **Debug Shortcut:** Quick access button to `/debug` for error troubleshooting during live play
- **Arc Progress Meter:** Visual indicator showing narrative position within current arc stage
- **Prose-First Layout:** Scene image and text in visual hierarchy that prioritizes narrative readability on mobile (no oversized image dominance)
- **Lesson Toggle:** Settings option to hide/show lesson insights (`showLessons` boolean)
- **Error Log Access:** Direct path to `/debug` when Grok is blocked

---

## Story Builder UI (`/builder` route)

### Must Do

1. **Accept Premise Input**
   - Provide text input field for user to enter plain-language story premise
   - Store premise in builder draft
   - Show input label/placeholder explaining purpose

2. **Generate Draft**
   - On premise submission: call `/api/builder/generate-draft` with premise text
   - Wait for AI-generated `BuilderStoryDraft` object
   - If Grok unavailable: fall back to neutral `starter-kit` empty scaffold (not Sydney/motel copy)
   - Populate all editable fields from returned draft:
     - `title`
     - `setting`
     - `aestheticStatement`
     - `voiceCeilingLines[]` (2 strings)
     - `characters[]` (array of `{name, role, description}`)
     - `mechanics[]` (array of `{key, label, voiceMap: [{value, line}]}`)
     - `openingPrompt`
     - `systemPrompt`

3. **Display Editable Fields**
   - Render each field in an editable form (textarea for prose, text input for names, etc.)
   - Group fields by section: Identity (title/setting/aesthetic), Voice (ceiling lines), Characters, Mechanics, Prompts
   - Allow inline editing on blur
   - Show field labels clearly

4. **Support Character Management**
   - "Add Character" button to append new empty character `{name: '', role: '', description: ''}`
   - "Remove Character" button per character entry
   - Each character has 3 editable fields: name, role, description
   - Validate character name is non-empty before allowing save

5. **Support Mechanic Management**
   - "Add Mechanic" button to append new empty mechanic `{key: '', label: '', voiceMap: []}`
   - "Remove Mechanic" button per mechanic entry
   - Each mechanic has: key (identifier), label (display name), voiceMap (array of `{value, line}` pairs)
   - "Add Voice Mapping" button per mechanic to append `{value: '', line: ''}`
   - "Remove Voice Mapping" button per mapping pair
   - Validate mechanic key is non-empty and URL-safe

6. **Provide Real-Time Prose Feedback**
   - Call `/api/builder/evaluate-prose` on blur for fields: aestheticStatement, voiceCeilingLines[], character descriptions, mechanic lines
   - Display feedback card below edited field showing:
     - Score (1-10 numeric value)
     - Flags array (list of issues detected)
     - Suggestion (AI-generated improvement or fallback rubric guidance)
   - If Grok unavailable: use deterministic behavioral/concreteness rubric
   - Do NOT block save on low scores (feedback is advisory)

7. **Persist Draft Locally**
   - Save builder draft to browser localStorage on every field change
   - Allow user to close browser/tab and return without losing work
   - Load draft from localStorage on route entry (if exists)
   - Provide "Clear Draft" action to reset to empty scaffold

8. **Handle Fallback Scaffold**
   - When Grok unavailable during draft generation: use neutral `starter-kit` story empty scaffold
   - Do NOT seed Sydney character name, motel setting, or No Vacancies-specific content
   - Allow author to start fresh from neutral template

9. **Display Status Messages**
   - Show "Draft generated with Grok" on successful generation
   - Show "Draft scaffold loaded (Grok unavailable)" on fallback
   - Show "Saving..." feedback during field updates
   - Show generation progress/spinner during API call

10. **Apply Motel-Noir Design System**
    - Match visual direction of `/`, `/play`, `/ending`, `/settings`, `/debug`
    - Use consistent typography, color, and layout principles
    - Ensure accessibility (keyboard navigation, focus indicators, labels)

### Must NOT Do

1. Use Sydney/motel-specific example content in fallback scaffold (use neutral starter-kit)
2. Require external tools, databases, or manual steps to save drafts
3. Implement mock fallback or synthetic story generation
4. Allow hard-fail on low prose scores (score is advisory only)
5. Leave stale/incomplete character or mechanic entries without validation
6. Auto-submit draft to production without explicit user action
7. Leak internal story definition details to the UI
8. Expose raw AI evaluation heuristics or scoring logic

### Required Features

- **Premise-to-Draft Flow:** Plain-language premise → AI draft generation → editable fields
- **AI Prose Evaluation:** On-blur evaluation with score, flags, and suggestion
- **Fallback Rubric:** Deterministic behavioral/concreteness scoring when Grok unavailable
- **Local Storage Persistence:** Browser-based draft autosave without server roundtrip
- **Character Add/Remove:** Full CRUD on character roster
- **Mechanic Add/Remove:** Full CRUD on mechanic definitions
- **Voice Mapping Editor:** Add/remove value-line pairs per mechanic
- **Multi-Field Sections:** Grouped field organization (Identity → Voice → Characters → Mechanics → Prompts)
- **Feedback Cards:** Inline AI-powered or rubric-based guidance per prose field
- **Status Messages:** Clear user feedback during generation, saving, and fallback scenarios
- **Neutral Empty Scaffold:** Story-agnostic starter-kit template for fallback/new authoring

---

## Shared Requirements (Both Routes)

### Visual & Brand System

- **Design Direction:** Motel-noir (dark, atmospheric, minimal, industrial aesthetic)
- **Typography:** System fonts with motel-inspired kicker/label styling
- **Layout:** Single-column on mobile; side-by-side sticky image + prose on desktop (where applicable)
- **Navigation:** Numbered route navigation (01-06) with status indicators across all routes
- **Colors/Contrast:** Dark palette with careful contrast ratios for WCAG accessibility
- **Browser Metadata:** Theme color, description, icon/favicon aligned with redesign in `src/app.html` and `static/manifest.json`
- **PWA Assets:** Manifest and service worker configured for consistent app-shell behavior

### Error Handling

- **Outage Policy:** Preserve playability when feasible via bounded fallback behavior; if startup is fully blocked, fail explicitly with actionable operator messaging
- **User-Friendly Error Mapping:**
  - Missing/invalid API key → "AI is not configured yet. Add `XAI_API_KEY` to the server environment, then redeploy."
  - Auth failure → "Authentication failed; verify your key"
  - Rate limit → "Rate limited; try again later"
  - Timeout → "Request timed out; check your connection"
  - Provider down → "AI service unavailable; try again later"
- **Error Logging:** All API failures logged to localStorage with timestamp/scope/details for debugging
- **Debug Access:** Direct route to `/debug` for operators to view error log during troubleshooting

### Accessibility & Interaction

- **Keyboard Navigation:** Full tab/shift-tab navigation, no keyboard traps
- **Visible Focus:** All interactive elements must show clear focus indicators (not hidden by styling)
- **ARIA Labels:** Scene text, choices, buttons, progress meter all have descriptive labels for screen readers
- **Color Contrast:** 4.5:1 minimum for text on backgrounds
- **Skip Links:** Navigation shortcuts available on `/+layout.svelte`

### Constraints & Anti-Patterns

- **No User-Exposed Mode Toggle:** Do not expose AI-vs-fallback/static mode switching in the public UI
- **No External Fonts:** System fonts only; no CDN/web font dependencies
- **No CSP Violations:** Content Security Policy must pass; no unsafe inline scripts
- **No Template Artifacts:** No leftover "default app" styling, no unused SvelteKit placeholders
- **No Unused Fields:** Builder does NOT persist arbitrary story metadata beyond the defined `BuilderStoryDraft` shape
- **Fallback Guardrails:** Any fallback path must be schema-valid, bounded, and preserve run continuity
- **No Client Key Entry:** Users do NOT enter API key in browser; credentials stay server-side only

---

## Data Contracts

### Story Player State

```typescript
GameState {
  currentSceneId: string;
  history: ChoiceHistoryEntry[];
  lessonsEncountered: number[];
  storyThreads: StoryThreads; // 9-dimensional thread state
  sceneLog: SceneLogEntry[];
  pendingTransitionBridge: TransitionBridge | null;
  apiKey: string | null;
  sceneCount: number;
  startTime: number;
}

Scene {
  sceneId: string;
  sceneText: string;
  choices: Choice[]; // exactly 3
  lessonId: number | null;
  imageKey: string;
  imagePrompt?: string;
  isEnding: boolean;
  endingType: EndingType | null; // loop | shift | exit | rare | custom
  mood?: Mood; // neutral | tense | hopeful | dark | triumphant
  storyThreadUpdates?: Partial<StoryThreads> | null;
}

Choice {
  id: string;
  text: string;
  outcome?: string;
  nextSceneId?: string;
}

StoryThreads {
  oswaldoConflict: number;
  trinaTension: number;
  moneyResolved: boolean;
  carMentioned: boolean;
  sydneyRealization: number;
  boundariesSet: string[];
  oswaldoAwareness: number;
  exhaustionLevel: number;
  dexTriangulation: number;
}
```

### Story Builder State

```typescript
BuilderStoryDraft {
  title: string;
  premise: string;
  setting: string;
  aestheticStatement: string;
  voiceCeilingLines: string[]; // exactly 2
  characters: BuilderStoryCharacterDraft[];
  mechanics: BuilderStoryMechanicDraft[];
  openingPrompt: string;
  systemPrompt: string;
}

BuilderStoryCharacterDraft {
  name: string;
  role: string;
  description: string;
}

BuilderStoryMechanicDraft {
  key: string;
  label: string;
  voiceMap: Array<{ value: string; line: string }>;
}

BuilderFieldFeedback {
  score: number; // 1-10
  flags: string[]; // array of detected issues
  suggestion: string; // improvement guidance
}
```

---

## API Endpoints

### Story Player Endpoints

- **POST `/api/story/opening`** → Returns initial `Scene` with story threads initialized
- **POST `/api/story/next`** → Accepts `{choiceId, narrativeContext}` → Returns next `Scene`
- **POST `/api/image`** → Accepts `{prompt}` → Returns `{image}` payload from image resolver

### Story Builder Endpoints

- **POST `/api/builder/generate-draft`** → Accepts `{premise}` → Returns `{draft: BuilderStoryDraft, source: 'ai' | 'fallback'}`
- **POST `/api/builder/evaluate-prose`** → Accepts `{prose}` → Returns `{feedback: BuilderFieldFeedback, source: 'ai' | 'fallback'}`

### Utility Endpoints

- **GET `/api/demo/readiness`** → Returns readiness check scores (Grok config, key presence, story ID, version)
- **GET `/api/ai/probe`** → Health check for AI provider availability

---

## Non-Negotiables (From Acceptance Criteria)

1. Preserve existing route behavior and operator surfaces.
2. Preserve keyboard access and visible focus indicators.
3. Do not restore external-font dependencies or CSP regressions.
4. Ensure `/`, `/play`, `/ending`, `/settings`, and `/debug` feel like one authored product.
5. Blocked `/play` state must be explicit and actionable (no ambiguous spinners).
6. All validation commands must pass (`npm run check`, `npm run lint`, `npm test`, `npm run test:narrative`, `npm run test:e2e`).
7. Outage handling must align with repo invariant: preserve playability via bounded fallback where possible; otherwise fail explicitly with actionable operator messaging.
8. Builder fallback must use neutral story scaffold, not Sydney/motel copy.

---

## Summary

This specification defines the exact requirements for the No Vacancies Story Player and Story Builder UIs based on current implementation, design documentation, and acceptance criteria from v1.0.0. All requirements are factual statements of what the UIs must accomplish, what they must not do, and what features they must support. No design suggestions, opinions, or improvements are included.
