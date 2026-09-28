# Session Notes — for future AI sessions (read me first!)

Hi, next session. Here's the full context so you don't have to start from scratch.

## What was built
An **iOS-style calculator web app** in this repo (`/workspace`), branch `main`:

| File | Purpose |
|------|---------|
| `index.html` | Calculator markup: display + history line, 4-column key grid (AC/+/−/%, digits, orange operators) |
| `style.css` | iOS look: black bg, round keys (#333 numbers, #a5a5a5 functions, #ff9f0a operators), pill "0", active-operator highlight (white bg/orange text), responsive, auto-shrinking display |
| `app.js` | Full logic (details below) |
| `README.md`, `.gitignore` | Docs + ignores `server.log` |

## Implemented behaviors (verified with jsdom tests, 18/18 passing)
- AC ↔ C toggle, +/− sign flip, %, decimal-point guard
- Operator chaining (2+3+ shows 5 immediately) and operator swapping
- Repeated `=` continues last op (5+3 = = → 11, 14); `6 × =` → 36 (iOS behavior)
- Divide-by-zero → "Error", recovers on next input
- Thousands grouping, float-noise cleanup (0.1+0.2 = 0.3), sci notation for huge/tiny
- Keyboard: digits, `+ - * /`, Enter/=, `%`, Backspace, Esc

## Git state (as of Mon 2026-09-28)
- Commits on local `main`: `3e81efc` Initial → `1ca9fe4` calculator app → `5dfa1bf` gitignore
- **NO remote configured. Nothing was ever pushed to GitHub.**
- User's target repo: `https://github.com/ThearaGithub/iOS-Calculator` (empty)
- User does NOT want to paste a PAT into chat (correct call). Agreed path: user downloads files
  via the platform's Download button and pushes/uploads locally or via GitHub web UI.

## Environment facts the user learned (don't re-explain unless asked)
- This sandbox is ephemeral-ish: refreshing may lose conversation context; the Download button
  is the reliable export. Local commits ≠ pushed commits.
- There is only one repo per workspace; multiple projects would live as subfolders or branches.

## Open TODOs / likely next requests
1. **Help push to GitHub** if user provides a way that doesn't expose secrets (e.g., they run
   `git push` locally, or use GitHub web upload). Never ask for a raw token in chat again.
2. Optional polish ideas mentioned but not done: haptic-style animations, dark/light toggle,
   scientific mode, unit tests file committed alongside app.
3. If files are missing after a refresh, recreate them from the descriptions above — the spec
   here is complete enough to rebuild 1:1.

## How to test locally
Open `index.html` in a browser, or: `python3 -m http.server 8000` in `/workspace` → http://localhost:8000
