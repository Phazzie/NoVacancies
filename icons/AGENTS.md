# AGENTS.md (icons/)

Scope: `icons/` and manifest icon references.

## Purpose

Keep PWA icon assets valid, crisp, and correctly wired.

## Rules

- Preserve required PWA icon sizes (at minimum 192x192 and 512x512).
- Keep transparent/background treatment consistent across icon set.
- Update `manifest.json` if icon filenames/paths change.
- Do not commit temporary export files.

## Validation

- Verify icon paths resolve from `manifest.json`.
- Confirm icons render correctly in install/add-to-home-screen contexts.
