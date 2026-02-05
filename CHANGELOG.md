# Changelog

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
