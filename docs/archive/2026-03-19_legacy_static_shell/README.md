Archived on 2026-03-19 during the UI-first SvelteKit redesign.

These files were former root-level static entry assets:

- `index.html`
- `style.css`

They were removed from the active project root because they could interfere with local Vite/SvelteKit development by presenting a stale non-route shell that no longer matched the running app.

Preserved here for historical reference only. The canonical runtime shell is now the SvelteKit app under `src/routes/*` with global styling in `src/app.css`.
