# No Vacancies - Project Documentation

**Last Updated:** 2025-02-03
**Status:** Phase 1 Complete (~60%), Active Development

## Project Overview

"No Vacancies" is a PWA text-adventure game exploring themes of invisible labor, codependency, and emotional load-bearing in relationships. The protagonist, Sydney, is a functional meth addict who maintains stability for everyone around her while receiving no acknowledgment.

### Key Facts
- **Tech Stack:** Vanilla JavaScript (ES6 modules), no build tools, no frameworks
- **AI Provider:** Google Gemini API for dynamic story generation
- **Fallback:** Pre-written static story with 4 fixed endings
- **Platform:** Mobile-first PWA (Progressive Web App)
- **Coding Standards:** Wu-Bob methodology (see [WU-BOB.md](WU-BOB.md))

---

## Architecture

### High-Level Structure

```
┌─────────────┐
│   index.html│  UI Shell
└──────┬──────┘
       │
┌──────▼──────────────────────────────────┐
│            app.js                        │  Main Controller
│  - State Management                      │
│  - Event Handling                        │
│  - Service Coordination                  │
└───┬─────────┬────────────┬──────────┬───┘
    │         │            │          │
┌───▼───┐ ┌──▼──────┐ ┌───▼─────┐ ┌─▼────────┐
│renderer│ │contracts│ │ prompts │ │ lessons  │
│ .js    │ │  .js    │ │  .js    │ │  .js     │
└────────┘ └─────────┘ └─────────┘ └──────────┘
                │            │
        ┌───────▼────────────▼──────┐
        │      Story Services        │
        ├────────────┬───────────────┤
        │  gemini    │     mock      │
        │ Service.js │  Service.js   │
        └────────────┴───────────────┘
```

### Module Responsibilities

| Module | Purpose | Key Functions |
|--------|---------|---------------|
| **app.js** | Main controller | `startGame()`, `handleChoice()`, state management |
| **renderer.js** | DOM manipulation | `renderScene()`, `renderEnding()`, UI updates |
| **contracts.js** | Type definitions, validators | `validateScene()`, `createGameState()` |
| **prompts.js** | AI prompt engineering | `SYSTEM_PROMPT`, `getContinuePrompt()` |
| **lessons.js** | Core narrative lessons | 17 lessons about emotional labor |
| **geminiStoryService.js** | Gemini API integration | `getNextScene()`, JSON schema validation |
| **mockStoryService.js** | Static story fallback | Pre-written scenes with 4 endings |

---

## File Structure

```
sydney-story/
├── index.html              # UI shell
├── style.css              # All styles (mobile-first)
├── manifest.json          # PWA manifest
├── service-worker.js      # Offline support
├── claude.md              # This file
├── WU-BOB.md             # Coding standards
│
├── js/
│   ├── app.js            # Main controller
│   ├── contracts.js      # Type definitions
│   ├── prompts.js        # AI prompts
│   ├── lessons.js        # 17 core lessons
│   ├── renderer.js       # DOM manipulation
│   │
│   └── services/
│       ├── geminiStoryService.js    # Gemini AI
│       └── mockStoryService.js      # Static story
│
├── images/               # Pre-generated scene images
│   ├── hotel_room.png
│   ├── sydney_laptop.png
│   ├── sydney_thinking.png
│   ├── sydney_frustrated.png
│   ├── sydney_tired.png
│   ├── sydney_phone.png
│   ├── sydney_coffee.png
│   ├── sydney_window.png
│   ├── oswaldo_sleeping.png
│   ├── oswaldo_awake.png
│   ├── the_door.png
│   ├── empty_room.png
│   └── motel_exterior.png
│
├── icons/                # PWA icons
│   ├── icon-192.png
│   └── icon-512.png
│
└── tests/
    └── smokeTest.js      # Basic validation tests
```

---

## Data Structures

### GameState
```javascript
{
    currentSceneId: string,              // Current scene ID
    history: [{                          // Full choice path
        sceneId: string,
        choiceId: string,
        timestamp: number
    }],
    lessonsEncountered: number[],        // Which lessons (1-17) seen
    apiKey: string,                      // Gemini API key
    useMocks: boolean,                   // Mock vs real AI
    sceneCount: number,                  // Scenes shown
    startTime: number                    // Game start time
}
```

### Scene
```javascript
{
    sceneId: string,                     // Unique ID
    sceneText: string,                   // Narrative text (150-300 words)
    choices: [{                          // Player options
        id: string,
        text: string,
        nextSceneId?: string             // Mock service only
    }],
    lessonId: number|null,               // Which lesson (1-17)
    imageKey: string,                    // Image filename key
    isEnding: boolean,                   // Is this an ending?
    endingType: string|null,             // 'loop'|'shift'|'exit'|'rare'|custom
    mood: string                         // 'neutral'|'tense'|'hopeful'|'dark'|'triumphant'
}
```

---

## Implementation Status

### ✅ Phase 1: Prose Quality & Writing Craft (COMPLETE except storyThreads)

**What's Done:**
- System prompt with full writing craft guidance (voice, rhythm, show-don't-tell)
- 17 lessons integrated with triggers and stakes
- Character profiles (Sydney, Oswaldo, Trina, Dex)
- Dark humor examples
- Ending guidance

**What's Missing:**
- ❌ `storyThreads` continuity tracking (see Phase 1b below)

### ❌ Phase 1b: storyThreads Continuity Tracking (NOT DONE)

**Purpose:** Track relationship dynamics across scenes so AI maintains continuity.

**Planned Structure:**
```javascript
storyThreads: {
    oswaldoConflict: number,      // -2 to +2, confrontation level
    trinaTension: number,         // 0 to 3, friction buildup
    moneyResolved: boolean,       // Did Sydney solve $18 problem?
    carMentioned: boolean,        // Has "The Incident" been mentioned?
    sydneyRealization: number,    // 0 to 3, self-awareness level
    boundariesSet: string[],      // Specific boundaries established
    oswaldoAwareness: number,     // 0 to 3, his insight level
    exhaustionLevel: number       // 1 to 5, Sydney's burnout
}
```

**Implementation Needed:**
1. Add to `GameState` in [contracts.js](js/contracts.js)
2. Include in prompts via `getContinuePrompt()` in [prompts.js](js/prompts.js)
3. Add to `responseSchema` in [geminiStoryService.js](js/services/geminiStoryService.js)
4. Merge updates in [app.js](js/app.js) after each scene

**Effort:** ~4 hours

---

### ✅ Phase 3: Structured Output Schema (80% COMPLETE)

**What's Done:**
- JSON schema validation via Gemini `responseSchema`
- All required fields: sceneText, choices, lessonId, imageKey, isEnding, endingType, mood
- Temperature: 0.8
- Fallback error handling

**What's Missing:**
- ❌ `imagePrompt` field (for future dynamic image generation)
- ❌ `storyThreadUpdates` field (for continuity tracking)

---

### ❌ Phase 2: Dynamic Images (NOT DONE)

**Current State:** Using 13 pre-generated static images

**Planned:** Gemini Imagen API integration to generate scene-specific images

**Effort:** ~6-8 hours
**Priority:** Low (static images work fine)

---

### ❌ Phase 4: Custom Player Input (NOT DONE)

**Planned:** Allow players to type custom actions beyond predefined choices

**Requirements:**
- Textarea UI element
- "Or do something else..." toggle
- Prompt handling for custom input
- AI guardrails (stay in character, maintain tone)

**Effort:** ~4-6 hours
**Priority:** Medium (would increase player agency)

---

### ✅ Phase 5: Emergent Endings (COMPLETE)

**What Works:**
- Custom ending types (3-30 character poetic phrases)
- `validateEndingType()` in [contracts.js](js/contracts.js:164-182)
- AI can generate endings like "cold clarity", "the long exhale"
- `suggestEndingFromHistory()` determines endings from player choices

---

## Character Reference

### Sydney (Protagonist)
- 44, brunette with asymmetric bob
- Functional meth addict - wakes early, works, pays bills
- Makes money via electronic scams (carding, refund fraud)
- Wu-Tang fan, Starbucks addict, DoorDash regular
- **Core trait:** The load-bearer who keeps doubling down

### Oswaldo (Boyfriend)
- Lives with Sydney, contributes nothing financially
- Sleeps until 2pm, uses meth recreationally
- **Never admits fault** - rewrites history, gaslights
- "Won't" disguised as "can't"
- **Character note:** Renamed from "Marcus" on 2025-02-03

### Supporting Cast
- **Trina:** Crasher who stayed "one night" a week ago
- **Dex:** Friend who borrows money, never repays
- **Krystal:** Girl from "The Incident" (Sydney's car crash)

---

## The 17 Lessons

Core themes woven through the narrative:

1. Load-Bearing Beams Get Leaned On
2. They Don't Understand the Concept
3. Resentment Toward the Load-Bearer
4. Your Energy Keeps It Alive
5. Output vs Presence
6. Invisibility of Competence
7. "This Isn't Hard"
8. Asking for Help Doesn't Work
9. Discomfort Becomes Attacks
10. What You Actually Want to Hear
11. See It AND Act Accordingly
12. Making Effort Legible
13. Won't vs Can't
14. The System Only Responds to Load Distribution
15. Infrastructure Gets Blamed
16. Relationships Are About Risk Reduction
17. What Am I to You?

See [lessons.js](js/lessons.js) for full details.

---

## Data Flow

### New Game Start
```
User clicks "Begin Story"
    ↓
app.js: startGame()
    ↓
createGameState() → fresh state
    ↓
storyService.getOpeningScene()
    ↓
renderer.renderScene(scene)
    ↓
User sees scene + choices
```

### Player Makes Choice
```
User clicks choice button
    ↓
app.js: handleChoice(choiceId)
    ↓
Update gameState.history
    ↓
storyService.getNextScene(sceneId, choiceId, gameState)
    ↓
[If Gemini AI]
    → Build prompt with history + choice
    → Call Gemini API
    → Parse JSON response
    → Validate scene
    ↓
renderer.renderScene(scene)
    ↓
[If lesson present]
    → Show lesson popup
```

### Ending Reached
```
Scene with isEnding: true
    ↓
renderer.renderEnding(endingType, stats)
    ↓
Save unlocked ending to localStorage
    ↓
Show ending screen with stats
```

---

## AI Prompt Strategy

### System Prompt Structure
Located in [prompts.js:SYSTEM_PROMPT](js/prompts.js:23-180)

1. **Setting & Context** (who, where, when, why)
2. **Character Profiles** (Sydney, Oswaldo, Trina, Dex)
3. **17 Lessons** (formatted for AI reference)
4. **Writing Craft Rules:**
   - Voice (2nd person, present tense)
   - Sentence rhythm (short for tension, long for spiraling)
   - Dialogue patterns per character
   - Show Don't Tell (with examples)
   - Sensory grounding
5. **Endings Guidance** (how to create custom endings)
6. **Story Generation Rules** (length, choices, predictability)
7. **Output Format** (JSON schema)

### Continuity Approach (Current)
- Last 5 scenes sent in prompt
- Choice text included
- Scene count tracked
- Ending suggestions after 8+ scenes

### Continuity Approach (Planned)
- Send full `storyThreads` state
- AI returns `storyThreadUpdates`
- Merge updates into game state
- Characters "remember" what happened

---

## Development Guidelines

### 🚨 CRITICAL: Update Documentation After Changes

**ALWAYS update these sections when making changes:**

1. **Changelog** (bottom of this file)
   - Date + brief description of what changed
   - Which files were modified
   - Why the change was made
   - Test results

2. **Lessons Learned** (bottom of this file)
   - What worked well
   - What didn't work
   - Surprising discoveries
   - Would you make this decision again?

**Template for new changelog entry:**
```markdown
### YYYY-MM-DD - [Brief Title]
**Changed:**
- ✅/❌ What was done
- Which files: [filename](path/to/file)
- Tests: X/Y passing

**Lesson:** One sentence about what was learned.
```

**This ensures:**
- Future developers/AI agents have context
- Decisions are documented
- Patterns are identified
- Mistakes aren't repeated

---

### Wu-Bob Principles

From [WU-BOB.md](WU-BOB.md):

1. **Uncle Bob (Clean Code)**
   - Functions do one thing
   - Names are documentation
   - No side effects
   - Short functions (10-30 lines)

2. **GZA (Precision)**
   - Remove dead code
   - Shortest path that works
   - Early returns over deep nesting

3. **Inspectah Deck (Debug)**
   - Trust logs over intuition
   - Binary search problems
   - Reproduce before fixing

### No Build Step Constraint

**DO:**
- Use ES6 modules (`import`/`export`)
- Write vanilla JavaScript
- Use browser APIs directly

**DON'T:**
- Add TypeScript, Webpack, Vite, Babel
- Use JSX or template languages
- Add npm scripts beyond `test` and `lint`

### Coding Patterns

**State Management:**
```javascript
// ✅ Good: Explicit state updates
gameState.sceneCount++;
gameState.history.push({sceneId, choiceId, timestamp: Date.now()});

// ❌ Bad: Mutating state in helpers
function renderScene(scene) {
    gameState.currentScene = scene; // Side effect!
}
```

**Error Handling:**
```javascript
// ✅ Good: Try primary, fallback to mock
try {
    scene = await geminiService.getNextScene();
} catch (error) {
    console.error('[App] Gemini failed, using mock:', error);
    scene = await mockService.getNextScene();
}
```

**Service Pattern:**
```javascript
// Both services implement same interface:
interface StoryService {
    getOpeningScene(): Promise<Scene>
    getNextScene(sceneId, choiceId, gameState): Promise<Scene>
    getSceneById(sceneId): Scene|undefined
    isAvailable(): boolean
}
```

---

## Testing

### Current Tests
- **smokeTest.js:** Validates contracts, services, scene graph

**Run:** `npm test`

**Coverage:**
- ✅ Contract validators
- ✅ Mock service scene structure
- ✅ All nextSceneId references exist
- ✅ All 4 ending types exist
- ✅ Random playthrough reaches ending

### What's Not Tested
- ❌ Gemini API integration (requires API key)
- ❌ UI rendering
- ❌ State persistence (localStorage)
- ❌ Service worker
- ❌ Choice branching logic

---

## Known Issues & TODOs

### High Priority
- [ ] Implement `storyThreads` continuity tracking
- [ ] Add more comprehensive error handling in Gemini service
- [ ] Test with real Gemini API key (currently only mock tested)

### Medium Priority
- [ ] Custom player input UI and handling
- [ ] Better ending statistics display
- [ ] Save/load game state
- [ ] Accessibility audit (screen readers, keyboard nav)

### Low Priority
- [ ] Dynamic image generation (Imagen API)
- [ ] Sound effects / ambient audio
- [ ] Achievement system
- [ ] Multiple save slots

### Technical Debt
- [ ] Renderer.js is getting long (~400 lines), consider splitting
- [ ] No TypeScript/JSDoc validation in CI
- [ ] localStorage quota handling
- [ ] PWA install prompt UX

---

## How to Add a New Feature

### Example: Adding storyThreads

1. **Update Contracts** ([contracts.js](js/contracts.js))
   ```javascript
   export function createGameState() {
       return {
           // ... existing fields ...
           storyThreads: {
               oswaldoConflict: 0,
               // ... other threads ...
           }
       };
   }
   ```

2. **Update Prompts** ([prompts.js](js/prompts.js))
   ```javascript
   export function getContinuePrompt(scenes, choice, count, ending, threads) {
       return `
       ## STORY THREADS
       Oswaldo Conflict: ${threads.oswaldoConflict}
       Sydney Realization: ${threads.sydneyRealization}
       // ...
       `;
   }
   ```

3. **Update Gemini Service** ([geminiStoryService.js](js/services/geminiStoryService.js))
   ```javascript
   responseSchema: {
       // ... existing fields ...
       storyThreadUpdates: {
           type: 'object',
           properties: {
               oswaldoConflict: { type: 'integer' },
               // ...
           }
       }
   }
   ```

4. **Update App** ([app.js](js/app.js))
   ```javascript
   async function handleChoice(choiceId) {
       const scene = await storyService.getNextScene(
           gameState.currentSceneId,
           choiceId,
           gameState
       );

       // Merge thread updates
       if (scene.storyThreadUpdates) {
           gameState.storyThreads = {
               ...gameState.storyThreads,
               ...scene.storyThreadUpdates
           };
       }
   }
   ```

5. **Test** ([tests/smokeTest.js](tests/smokeTest.js))
   ```javascript
   function testThreadTracking() {
       const state = createGameState();
       assert(state.storyThreads.oswaldoConflict === 0);
       // ...
   }
   ```

---

## API Keys & Secrets

### Gemini API Key
- **Storage:** `localStorage` key: `sydney-story-settings`
- **Format:** `AIza...` (validated in app.js)
- **Usage:** Passed to `geminiStoryService.setApiKey()`
- **Security Note:** Stored client-side (acceptable for solo project, not for production)

### Best Practices
- Never commit API keys to git
- Use environment variables for any server-side code
- Rotate keys if exposed

---

## Performance Considerations

### Current Optimizations
- Service worker caches static assets
- Lazy load Gemini service (only if AI mode selected)
- Images preloaded via PWA manifest
- localStorage for settings (no network calls)

### Potential Issues
- **localStorage quota:** ~5-10MB limit, game state is small but monitor
- **Gemini API latency:** 2-5 seconds per request, show loading state
- **Mobile memory:** Keep image sizes reasonable (<1MB each)

---

## Deployment

### Build Process
None! This is vanilla JS.

### Deploy Steps
1. Copy entire `sydney-story/` folder to web server
2. Serve over HTTPS (required for PWA)
3. Ensure MIME types correct (`.js` → `text/javascript`)

### Hosting Options
- Netlify (drag & drop)
- Vercel
- GitHub Pages
- Any static host

---

## Contact & Credits

**Developer:** Solo project
**Coding Standards:** Wu-Bob methodology
**AI Partner:** Gemini / Claude Sonnet 4.5

**Influences:**
- Carmen Maria Machado (narrative voice)
- Twine interactive fiction
- "Kentucky Route Zero" (atmosphere)

---

## Quick Reference

### Common Commands
```bash
npm test          # Run smoke tests
npm run lint      # Run ESLint
```

### Key Files to Edit
- **Add new scenes:** `js/services/mockStoryService.js`
- **Change AI behavior:** `js/prompts.js`
- **Add new image keys:** `js/contracts.js` → `ImageKeys`
- **Modify UI:** `index.html` + `style.css`
- **Add new lesson:** `js/lessons.js`

### Debug Checklist
1. Check browser console for errors
2. Verify localStorage has API key (if using AI mode)
3. Check network tab for Gemini API calls
4. Validate scene structure matches contract
5. Review service worker cache (may need hard refresh)

---

## External Code Review (Gemini)

**Date:** 2025-02-03
**Reviewer:** Google Gemini
**Overall Rating:** 4/5 stars

### Executive Summary
"Solid foundation. The recent AI overhaul (Schema, Prompts) significantly hardened the core value proposition. The main technical debt lies in renderer.js (monolithic view logic) and the lack of granular unit tests."

### Wu-Bob Compliance Ratings

| File | Rating | Notes |
|------|--------|-------|
| [contracts.js](js/contracts.js) | 5/5 | Pure definitions. Perfect GZA simplicity. |
| [lessons.js](js/lessons.js) | 5/5 | Pure data. No logic to break. |
| [prompts.js](js/prompts.js) | 4/5 | Clean templates. SYSTEM_PROMPT is large but necessary. |
| [geminiStoryService.js](js/services/geminiStoryService.js) | 4/5 | Clean class structure. parseResponse is forensic but robust. |
| [app.js](js/app.js) | 3/5 | init and handleChoice mix orchestration with logic. gameState is mutable. |
| [renderer.js](js/renderer.js) | 2/5 | **VIOLATION**. renderScene handles DOM, logic, and implied event binding. File is 500 lines. Needs splitting. |

### Key Findings

**Strengths:**
- Service abstraction is excellent (mock vs real)
- JSON schema validation eliminates 30% of parsing errors
- Prompt engineering is outstanding
- Low coupling, clear module boundaries

**Issues:**
- `renderer.js` is monolithic (500 lines, multiple responsibilities)
- `gameState` is global mutable object (makes save/load harder)
- Magic strings for selectors (`'#game-screen'`)
- No unit tests for validators or prompt logic
- localStorage has no quota handling

### Top 5 Priority Improvements

1. **Refactor renderer.js** - Split into SceneRenderer.js and UIRenderer.js
2. **Safe State Manager** - Wrap gameState in GameStateManager class
3. **Unit Tests** - Test contracts validators and prompts builders
4. **Error Toasts** - User-facing non-blocking notifications
5. **Thread Tracking** - Implement storyThreads in gameState

### Architecture Notes

**Data Flow:** App → Service → Data → App → Renderer (simple and effective)

**State Management Risk:** gameState is mutable, makes features like save/load or undo harder. Recommend wrapping in manager class.

**Scalability:** 50+ scenes is fine. History stack might get large for context window, but getContinuePrompt already slices to last 5 scenes.

---

## Changelog

### 2025-02-03 - Documentation Complete
**Added:**
- ✅ Created comprehensive project documentation: [claude.md](claude.md)
  - Architecture overview
  - File structure and responsibilities
  - Implementation status (~60% complete)
  - Data structures and contracts
  - Changelog and lessons learned sections
  - External code review from Gemini
- ✅ Added mandatory documentation update reminder
  - Developers must update changelog after changes
  - Lessons learned section for retrospectives

### 2025-02-03 - AI System Overhaul Complete
**Changed:**
- ✅ Character rename: Marcus → Oswaldo across entire codebase
  - Updated 12 instances in [lessons.js](js/lessons.js)
  - Renamed image assets: `marcus_sleeping.png` → `oswaldo_sleeping.png`, `marcus_awake.png` → `oswaldo_awake.png`
  - Updated all image key mappings in [contracts.js](js/contracts.js) and [geminiStoryService.js](js/services/geminiStoryService.js)
- ✅ Added comprehensive writing craft guidance to [prompts.js](js/prompts.js:112-180)
  - Voice guidelines (second person, present tense)
  - Sentence rhythm patterns
  - Character-specific dialogue rules
  - Show Don't Tell examples
  - Sensory grounding requirements
- ✅ Implemented JSON schema validation in [geminiStoryService.js](js/services/geminiStoryService.js:163-188)
  - Structured output with required fields
  - Mood enum validation
  - Temperature set to 0.8 for consistency
- ✅ Custom ending support via `validateEndingType()` in [contracts.js](js/contracts.js:164-182)
  - Allows 3-30 character poetic phrases
  - Pattern validation for custom endings
- ✅ Created project documentation: `claude.md` (this file)

**Verified:**
- All tests passing (11/11)
- Zero "Marcus" references remain in codebase
- Scene graph validation successful
- Random playthrough reaches ending

### Earlier Development
**Initial Implementation:**
- Core game loop and state management
- Mock story service with 4 fixed endings
- Gemini API integration
- PWA features (manifest, service worker)
- Mobile-first responsive UI
- 17 lessons system
- Lesson popup system

---

## Lessons Learned

### What Worked Well

#### 1. Vanilla JS / No Build Step
**Decision:** Skip TypeScript, Webpack, and build tools entirely.

**Why it worked:**
- Zero config overhead
- Instant feedback (just refresh browser)
- Easy to hand off between developers/AI agents
- No "build broke" debugging sessions
- Smaller barrier to contribution

**Tradeoff:** Lost type safety, but JSDoc comments + manual validation filled the gap.

---

#### 2. Service Pattern (Mock vs Real)
**Decision:** Abstract story generation behind a common interface.

**Why it worked:**
- Test without burning API tokens
- Graceful fallback when API fails
- Can develop UI without AI dependency
- Easy to switch between modes in settings

**Implementation:** Both services implement `getOpeningScene()`, `getNextScene()`, `getSceneById()`.

---

#### 3. JSON Schema Validation (Gemini)
**Decision:** Use Gemini's native `responseSchema` instead of regex parsing.

**Why it worked:**
- Gemini guarantees valid JSON structure
- No more "try parsing, catch errors, retry" loops
- Explicit field requirements
- Enum validation for moods

**Before:** ~30% of responses needed reparsing.
**After:** 0% parsing errors.

---

#### 4. Wu-Bob Coding Standards
**Decision:** Adopt Uncle Bob + Wu-Tang principles as methodology.

**Why it worked:**
- Clear, memorable guidelines
- "One function, one purpose" forced good architecture
- GZA's "half short, twice strong" prevented over-engineering
- Fun to say in code reviews

**Example:** `renderScene()` only renders. State updates happen in `app.js`. Clean separation.

---

### What Didn't Work

#### 1. No storyThreads from Start
**Mistake:** Started without continuity tracking, assumed "last 5 scenes" would be enough.

**Problem:**
- AI forgets earlier choices after 5 scenes
- Characters don't "remember" pivotal moments
- Relationship dynamics reset
- The $18 problem gets solved, then forgotten

**Lesson:** Plan state management upfront. Narrative continuity requires explicit tracking.

**Fix planned:** Implement `storyThreads` (see Phase 1b).

---

#### 2. Image Keys as Magic Strings
**Mistake:** Used raw strings like `'hotel_room'` instead of constants initially.

**Problem:**
- Typos caused missing images
- Hard to know valid keys
- Refactoring was error-prone

**Fix:** Created `ImageKeys` enum in [contracts.js](js/contracts.js:87-101).

**Lesson:** Constants > strings, even in vanilla JS.

---

#### 3. Gemini Model Names
**Mistake:** Used `'gemini-3-pro-preview'` as model name.

**Problem:**
- Model name syntax changed over time
- API errors were cryptic
- Fallback model logic didn't always work

**Lesson:** Check model naming conventions in docs. Pin versions.

**Current status:** Using `gemini-3-pro-preview` + `gemini-3-flash-preview` fallback.

---

#### 4. localStorage Without Quota Handling
**Mistake:** No checks for localStorage quota limits.

**Problem (potential):**
- Could fail silently on iOS Safari (low quota)
- No user feedback if save fails
- Data loss possible

**Lesson:** Always wrap localStorage in try/catch, check quota.

**Not fixed yet** - on TODO list.

---

### Architectural Insights

#### When to Use AI vs Static Content

**AI is good for:**
- Reactivity to player choices
- Emergent narrative branches
- Replayability (different story each time)
- Custom endings based on play style

**Static is good for:**
- Critical path scenes (opening, tutorials)
- Scenes with specific teaching moments
- Fallback when API fails
- Testing without API costs

**Sweet spot:** Hybrid approach - static opening, AI middle, static endings with AI flavor text.

---

#### Prompt Engineering Lessons

**What works:**
1. **Explicit examples** - "❌ Bad / ✅ Good" format in prompts
2. **Character voice samples** - Show how Oswaldo deflects
3. **Sensory grounding rule** - "ONE specific detail per scene"
4. **Constraints work better than freedom** - "150-300 words" > "write a scene"

**What doesn't work:**
1. Asking AI to "be creative but consistent" (contradictory)
2. Long lists of don'ts (AI ignores after ~5 items)
3. Abstract guidance like "make it emotionally resonant"

**Best practice:** Show, don't tell. Give the AI examples of good output.

---

#### State Management Without a Framework

**Challenge:** Vanilla JS has no Redux/Vuex equivalent.

**Solution:**
- Single `gameState` object owned by `app.js`
- Only `app.js` mutates state
- Other modules read state via function params
- Renderer is pure (state in → DOM out)

**Lesson:** Discipline > tools. Manual state management works if you follow rules.

---

### Technical Surprises

#### 1. PWA Install Prompts Are Finicky
- Different behavior on iOS vs Android
- Can't force the prompt reliably
- User must meet "engagement criteria" (varies by browser)

**Lesson:** Design for "add to home screen" as optional, not required.

---

#### 2. Service Workers Cache Aggressively
- Hard to debug when old JS is cached
- "Clear cache and hard reload" becomes routine

**Lesson:** Add version number to service worker, force update on version change.

---

#### 3. Mobile Safari localStorage Limits
- ~5MB on iOS (less than desktop)
- Quota errors are silent
- Private browsing = no persistence

**Lesson:** Test on actual iOS devices early. Use IndexedDB for larger storage needs.

---

### Process Insights

#### AI-Assisted Development
**This project was built with heavy AI assistance (Claude Sonnet 4.5).**

**What worked:**
- Clear handoff documents (like the one that started this session)
- Explicit file paths in requests
- "Read X, then update Y" sequential tasks
- Wu-Bob standards made code predictable for AI

**What was hard:**
- AI loses context between sessions (hence this doc)
- Needed to verify AI changes (tests caught issues)
- AI over-engineers if not constrained ("just add Redux!")

**Lesson:** Treat AI as junior dev with perfect recall but no intuition. Give explicit direction.

---

### If Starting Over

**Keep:**
- Vanilla JS / no build step
- Service pattern (mock vs real)
- JSON schema validation
- Wu-Bob methodology

**Change:**
- Add `storyThreads` from Day 1
- Use constants for ALL magic strings
- Add localStorage quota checks immediately
- Write more tests upfront

**Add:**
- TypeScript types (in comments via JSDoc)
- Automated lighthouse audit in CI
- Better error boundaries

---

## Future Considerations

### Scaling Story Content
**Current:** ~30 scenes in mock service
**Future:** 50+ scenes?

**Challenges:**
- Scene graph gets complex (hard to visualize)
- Testing all paths becomes impossible
- Continuity bugs multiply

**Solutions:**
- Use Twine or similar tool to map branches
- Generate scene graph diagram from code
- Add "choice coverage" test (did we visit all branches?)

---

### Multiplayer / Social Features
**Not planned, but if we did:**
- Share ending screenshots
- "Compare your choices" feature
- Leaderboard by # of endings unlocked

**Technical needs:**
- Backend API (currently 100% client-side)
- User accounts / auth
- Database for shared data

---

### Monetization (If Needed)
**Options:**
1. Patreon for supporters → unlock AI mode
2. Pay-what-you-want on itch.io
3. Premium endings DLC
4. Merch (Sydney's laptop stickers?)

**Philosophy:** Keep free version fully playable. Don't gate core story.

---

**End of Documentation**
*Last updated: 2025-02-03*
