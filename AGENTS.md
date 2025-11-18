# Repository Guidelines

## Project Structure & Module Organization
- Root contains `chagpt.html`, which bundles HTML, CSS variables, and vanilla JS. No external build pipeline exists.
- Demo assets referenced in JS expect `videos/` and `photos/` subfolders (e.g., `videos/sample1.mp4`, `photos/photo1.jpg`). Replace with your media files and update the inline `initialState` block accordingly.
- All state and DOM logic live in the bottom `<script>` tag; UI styling is defined in the `<style>` block at the top of the same file.

## Build, Test, and Development Commands
- Serve locally to avoid browser local-file restrictions: `python3 -m http.server 8000` (open `http://localhost:8000/chagpt.html`).
- Quick preview without a server (where allowed): `open chagpt.html`.
- Clear demo data during manual testing by removing `localStorage` key `mediaManagerStateV1` in DevTools.

## Coding Style & Naming Conventions
- Use 2-space indentation and keep existing double-quote style for JS strings and HTML attributes.
- Prefer `const`/`let` over `var`; keep helper functions pure and co-located near usage.
- Maintain CSS variables defined in `:root`; keep component class names descriptive and kebab-case.
- Sanitize user-facing strings via the existing `escapeHtml` utility when rendering dynamic content.

## Testing Guidelines
- No automated test suite exists; rely on manual verification. Check tab switching, video playback, tag filtering, add/delete tag flows, and persistence across reloads.
- When adding features, include lightweight inline checks (e.g., guard clauses) instead of heavy dependencies.
- If you add automated tests, prefer a zero-build approach (e.g., Playwright or Web Test Runner) and document commands alongside `python3 -m http.server`.

## Commit & Pull Request Guidelines
- Use clear, imperative commit messages (e.g., `Add photo preview grid interaction`).
- PRs should describe the user-visible change, notes on media assets touched, and manual test steps (browser, server command, scenarios exercised). Attach before/after screenshots or screen recordings when UI changes.
- Link related issues and call out any shifts to `initialState` sample data or storage keys.

## Assets & Configuration Tips
- Avoid committing large binary media; use short demo clips or placeholders. Respect the existing localStorage version key `mediaManagerStateV1` to prevent user data loss; bump only when schema changes and include migration logic.
- Keep inline script and style blocks minimal; extract shared constants near the top of the script for readability before adding new modules or build tooling.
