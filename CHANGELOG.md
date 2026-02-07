# Changelog

## [Unreleased] - 2026-02-05

### Changed

- **Narrative Context:** Added app-owned `NarrativeContext` building with hard budget enforcement, older-scene compression, boundary/lesson/thread narrative translations, and context-mode prompt path.
- **Prompt Hardening:** Added Trina behavior examples to `SYSTEM_PROMPT`, introduced generalized thread-state narrative lines, boundary-specific translation mapping, and 17-line lesson-history mapping.
- **Transition Bridges:** Added thread-jump detection and one-turn transition bridge injection so major state shifts read as earned instead of abrupt.
- **Telemetry Guardrails:** Added context-size/truncation/transition usage telemetry and payload sanitization/redaction to prevent key/token leakage.
- **Contracts + App Flow:** Added `NarrativeContext` contract validation; app now builds/passes validated context to Gemini service through a compatibility seam.
- **Tests:** Expanded integration coverage with T1-T4 narrative-upgrade gates (prompt assets, context contract/budget, transition-only-on-jump behavior, telemetry redaction).
- **Prompt Depth:** Expanded lesson payload in `SYSTEM_PROMPT` formatting to include per-lesson emotional stakes, common triggers, and unconventional angle (in addition to title/quote/insight).
- **Continuity Language:** Replaced stale `laptop` continuity anchor with `phone/phones/popsocket` anchors in Gemini quality checks.
- **Voice Anchors:** Added two high-signal narrative lines to `SYSTEM_PROMPT` as explicit voice-ceiling examples so model tone targets stay sharp across generations.

## [Unreleased] - 2026-02-03

### Changed

- **Character Overhaul:** Renamed "Marcus" to "Oswaldo" throughout the codebase, prompts, and assets. Oswaldo is now defined as more actively toxic (gaslighting, weaponized incompetence) rather than just lazy.
- **Narrative Logic:** Shifted core motivation metaphor from "Trapped by Empathy" to "Sunk Cost/Double Down". Sydney stays because calling it quits means admitting she was wrong.
- **Visual Style:** Pivoted from pixel-art experiments back to the original digital painting style. Added 3 new Sydney-centric scenes: `sydney_phone`, `sydney_coffee`, `sydney_window`.
- **Ending System:** Replaced 4 fixed ending types with a dynamic system. AI generates custom 1-3 word poetic endings (e.g., "Cold Clarity").
- **Contracts:** Updated `ImageKeys` to focus on Sydney's perspective. Removed generic setting keys.

### Added

- **Writing Craft Rules:** System prompt now includes specific instructions for "Show Don't Tell", "Sensory Grounding", and "Voice" to reduce AI-sounding prose.
- **Validation:** Added `validateEndingType` in `contracts.js` to support custom endings while preventing garbage output.
- **Schema:** Implemented strict JSON `responseSchema` in `geminiStoryService.js` for reliability.
- **Assets:** 5 new generated images in `images/`.

### Fixed

- **Testing:** Fixed smoke tests to align with new Oswaldo character and image keys. All tests passing.
- **Ending UX:** Endings no longer auto-jump to recap mid-typewriter. Players now click `View Recap` after ending text completes.
- **Lesson Timing:** Lesson insight popup now appears only after scene text has finished typing.
- **Regression Coverage:** Added renderer + e2e checks for delayed lesson display and recap transition/copy/download flow.
