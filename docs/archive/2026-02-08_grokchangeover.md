# Grok Changeover Plan

## Overview & Process

The migration from Gemini to xAI's Grok involves two major architectural shifts: replacing the text generation engine with **Grok 4.1 Fast Reasoning** and upgrading the static image system to a generative one using **Grok Imagine**. The text migration is a straightforward service swap—mapping our existing `System Prompt -> Scene JSON` flow to xAI's OpenAI-compatible chat endpoint. We will update `prompts.js` to generate _visual descriptions_ rather than selecting from a fixed list of image keys, allowing the story to have infinite visual variety.

The image migration is the more complex change. Currently, the app loads instant local assets (e.g., `hotel_room.png`). Switching to Grok Imagine introduces a 5-10 second generation latency per scene. To handle this, we will re-architect the `renderer.js` to support "async image loading"—rendering the text immediately while showing a high-quality loading state (or the previous scene's image blurred) until the new generative image arrives. This ensures the gameplay remains snappy even while waiting for the AI art. We will utilize `grok-4-1-fast-reasoning` for the narrative intelligence and `grok-beta` (or the specialized image endpoint) for the visuals.

---

## File Changes & Creations

### 1. [NEW] `js/services/grokStoryService.js`

**Purpose:** The core driver for text generation.
**Implementation Details:**

- Implements the `StoryService` interface (same methods as `geminiStoryService.js`).
- **Endpoint:** `https://api.x.ai/v1/chat/completions`
- **Model:** `grok-4-1-fast-reasoning` (or `grok-beta` if rate-limited).
- **Logic:**
    - Sends `SYSTEM_PROMPT` and conversation history.
    - Requests JSON output.
    - **Crucial Update:** Instead of just requesting an `imageKey`, it will request an `imagePrompt` field—a concise visual description of the scene for the image generator.
    - Parses the JSON response into our `Scene` contract.

### 2. [NEW] `js/services/grokImageService.js`

**Purpose:** Handles interaction with the Grok Imagine API.
**Implementation Details:**

- **Endpoint:** `https://api.x.ai/v1/images/generations` (or equivalent xAI image endpoint).
- **Model:** `grok-2-vision-1212` or `grok-imagine` (depending on final key access).
- **Logic:**
    - Takes the `imagePrompt` from the story service.
    - Prepends rigid visual guardrails (e.g., "Digital art style noir atmosphere, no faces for Oswaldo").
    - Returns a URL to the generated image.

### 3. [MODIFY] `js/contracts.js`

**Changes:**

- Update `Scene` JSDoc/Schema.
- Add `imageUrl` `{string|null}` as an optional field.
- Add `imagePrompt` `{string|null}` to store the prompt used (for debugging/recap).
- _Maintain_ `imageKey` as a fallback for error states or rapid loading.

### 4. [MODIFY] `js/prompts.js`

**Changes:**

- **System Prompt:** Update the `OUTPUT FORMAT` section.
    - Change `imageKey` instruction to: _"Generate a `imagePrompt`: A concise, atmospheric visual description of the scene (approx 15-20 words). Focus on lighting and mood."_
- **Guardrails:** Move the "Visual Guardrails" (no Oswaldo face, Sydney's appearance) into a constant that `grokImageService` can prepend to every image request.

### 5. [MODIFY] `js/app.js`

**Changes:**

- **Service Loading:** Replace `loadGeminiService` with `loadGrokService`.
- **Initialization:** Initialize both `GrokStoryService` and `GrokImageService`.
- **Orchestration:**
    1. Call Story Service to get text + image prompt.
    2. Render text _immediately_.
    3. Trigger Image Service (fire-and-forget or async await).
    4. When image arrives, update the renderer.
- **Handling Keys:** Update `API_KEY_PATTERN` if xAI keys differ (usually `xai-...`).

### 6. [MODIFY] `js/renderer.js`

**Changes:**

- **Render Logic:** Update `renderScene` to accept `scene.imageUrl`.
- **Async Images:**
    - If `scene.imageUrl` is present, use it.
    - If `scene.imageUrl` is pending (interface change required if we want strict separation), show a specific "Generating..." visual state.
- **Fallback:** If generation fails, default to `imagePaths[scene.imageKey]` (mapping the generated mood to a generic local image like `hotel_room.png`).

### 7. [MODIFY] `index.html`

**Changes:**

- **Settings UI:** Rename "Gemini API Key" to "xAI API Key".
- Update the link to `console.x.ai`.

### 8. [MODIFY] `style.css`

**Changes:**

- Add styles for a "loading" state on the scene image (e.g., a subtle pulse or blur effect) while the generative image is being fetched.

---

## Recommendation & Thoughts

**The Latency Trade-off:**
Switching to generative images transforms the "instant" feel of the current app into a slower, more deliberate experience.

- **Recommendation:** **Do not block text on images.**
    - Let the text render immediately.
    - Keep the _previous_ scene's image visible (perhaps slightly dimmed) or show a generic "fog/neon" placeholder until the new image loads.
    - This "asynchronous storytelling" feels more modern and prevents the player from staring at a spinner for 8 seconds every turn.

**Cost Verification:**

- Grok 4.1 and Imagine are paid endpoints. Ensure you have credits in your xAI console.
- The system should be robust enough to fall back to the generic `hotel_room.png` if the image generation fails (zero credits, content filter bounce).

**One-Step vs. Two-Step:**

- We will implement this as a **Two-Step Pipeline** in `app.js`:
    1.  `StoryService` returns JSON (Text + Visual Description).
    2.  `App` passes Visual Description to `ImageService`.
    - _Why?_ It allows us to sanitize/modify the image prompt in code (enforcing the "No Oswaldo Face" rule) before sending it to the image model, rather than hoping the story model perfectly formatted the image request.
