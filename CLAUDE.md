# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Read this first — the repo has two independent apps

The repo deploys to **two different places** with different tech stacks:

| URL | Source | Stack | Host |
|---|---|---|---|
| `soulforge.markforged.tw` (the LIVE website) | `soulforge-v2/` | React 19 + Vite | GitHub Pages |
| `soulforge-topaz.vercel.app` (the chat bot) | repo root (`chat.html`, `widget.js`, `api/`) | Vanilla HTML/JS + Vercel Functions | Vercel |

**Critical consequence:** The root `index.html` is the legacy static generator (~2200 lines). It is **not served by any domain**. Edits to it are invisible to users. GitHub Pages uploads only `soulforge-v2/dist/`; Vercel serves root files per `vercel.json` rewrites.

**Before modifying any file, check which of the two apps it belongs to.** Changes to `soulforge-v2/**` hit the live React site. Changes to root `chat.html` / `widget.js` / `api/` hit only the Vercel bot.

## Commands

### React app (the live site — `soulforge-v2/`)

```bash
cd soulforge-v2
npm install              # first time
npm run dev              # local dev (Vite, default :5173)
npm run build            # production build → dist/
npm run preview          # serve dist/ locally
npm run lint             # ESLint (flat config, eslint.config.js)
```

Deploy is automatic: push to `main` → `.github/workflows/deploy-pages.yml` runs `cd soulforge-v2 && npm ci && npm run build` and publishes `soulforge-v2/dist/` to GitHub Pages.

### Bot (Vercel — repo root)

```bash
npm i -g vercel          # one-time
vercel link              # bind local to the project
vercel env pull .env.local  # fetch SERP_API_KEY etc.
vercel dev               # local server at http://localhost:3000
vercel --prod            # manual prod deploy (normally Git auto-deploys)
```

Deploy is automatic: push to `main` → Vercel auto-detects `api/*.js` as serverless functions + serves root files per `vercel.json`.

Required Vercel env vars:
- `SERP_API_KEY` (required) — SearchAPI or SerpAPI
- `SERP_PROVIDER` (optional, default `searchapi`) — `searchapi` | `serpapi`
- `GEMINI_API_KEY` (optional) — only if re-enabling the hidden Gemini engine

## Architecture

### React app (`soulforge-v2/`)

Single-page app, no routing. `src/App.jsx` is the whole UI (~300 lines): a form for name/role/personalities/background, a prompt preview, and launcher buttons that `window.open(...)` third-party AI sites (Google, ChatGPT, Grok) with the soul pre-loaded via URL params.

State is local `useState` in `App.jsx`. No backend. `generatePrompt()` builds the system prompt string that gets URL-encoded and passed to external AIs.

### Bot (repo root)

Three-layer flow:

1. **Frontend** (`chat.html`, `widget.js`) — plain HTML+JS, no framework. `chat.html` is a standalone full-screen chat page; `widget.js` is a drop-in floating-bubble widget for embedding elsewhere. Both read URL params (`?name=`, `?user=`, `?traits=`, `?bg=`, `?soul={...}`) to pre-load a soul, and persist state to `localStorage`.
2. **API** (`api/ai-mode.js`, `api/chat.js`) — Vercel Node functions. Both call `lib/soul-engine.forgeSoul()` to turn the soul JSON into a system prompt, then hit an upstream LLM:
   - `ai-mode.js` → Google AI Mode via SearchAPI/SerpAPI (single-turn, no memory — search-based)
   - `chat.js` → Gemini 2.0 Flash (multi-turn with `history[]`)
3. **Soul engine** (`api/lib/soul-engine.js`) — pure function that takes soul JSON + builds a Chinese system prompt. Knows a `TRAIT_MAP` that expands personality keywords (活潑開朗, 專業嚴謹, ...) into behavioral instructions.

### Engine selection

Gemini is **intentionally hidden** in the UI (`display:none` with `data-hidden="v2.0"` marker in `chat.html` and `widget.js`). AI Mode is the only user-facing option. The Gemini code path is kept for future re-enablement — look for the `engine-toggle` element and remove the `display:none` when Brian decides to turn it back on.

### Soul data shape

Consistent across all frontends and the API:

```js
{
  name: 'CoCo 💖',
  role: 'AI 助理 / 數位夥伴',
  traits: ['活潑開朗', '知心夥伴', ...],   // keys into TRAIT_MAP
  userName: 'Brian',
  background: '多行自由文字',
}
```

`chat.html` has a default soul hardcoded for Brian (Markforged GCR, X7 FE/FX10/FX20/PX100 product line). `widget.js` has a bland default and expects callers to pass a soul via `window.SOULFORGE_CONFIG` or `data-*` attributes.

## Gotchas that have bitten before

- **Public bot — user settings are ephemeral by design.** `chat.html` and `widget.js` intentionally do **not** persist soul / engine / apiBase to `localStorage`. Each page load starts from the hardcoded default (Brian's CoCo). If a user wants to keep a custom soul, they export via the 📥 backup button and re-import via the settings panel. Do **not** re-enable `localStorage` persistence — it would cause one user's customization to leak to the next person on the same device.
- **Don't truncate `systemPrompt` before sending to AI Mode.** `api/ai-mode.js` previously did `split('\n').slice(0, 3)` which silently dropped the background / Markforged context. Keep the full prompt (cap at ~1600 chars for URL length safety).
- **Cross-origin fetch:** `chat.html` and `widget.js` default `apiBase` to the absolute Vercel URL (`https://soulforge-topaz.vercel.app/api`), not `/api`. If someone opens `chat.html` from a non-Vercel origin (GH Pages, local file, embedded iframe), relative paths 405 on the wrong host.
- **Vercel root-dir detection:** If Vercel's "Root Directory" setting ever gets auto-set to `soulforge-v2` (because of the React app's `package.json`), the bot breaks — `api/` at repo root stops being detected. It must be empty / `.`.
- **Bot code must stay at repo root.** Moving `api/` under a subfolder breaks Vercel function detection.

## Entry points for common tasks

- Change how the CoCo default soul greets Brian → `chat.html` → `const DEFAULT_SOUL = {...}`
- Add a new personality trait → `api/lib/soul-engine.js` → `TRAIT_MAP` (also add to the `AVAILABLE_TRAITS` arrays in `chat.html` and `widget.js`)
- Re-enable Gemini engine in UI → remove `style="display:none"` (and `data-hidden="v2.0"`) from the `engine-toggle` blocks in `chat.html` and `widget.js`, then set `GEMINI_API_KEY` on Vercel
- Add a launcher button to the live site → `soulforge-v2/src/App.jsx` (in the `action-buttons` block) — **confirm with Brian first, this is user-visible**
- Tweak deploy pipeline → `.github/workflows/deploy-pages.yml`

## Context

- **Owner:** Brian Chen (`brian479974` on GitHub) — Markforged GCR General Manager (Taiwan / China / Hong Kong / Vietnam). The default soul in `chat.html` reflects this.
- **Language:** UI and docs are mostly Traditional Chinese (`zh-TW`). AI responses default to 繁體中文 per `soul-engine.js` guardrails.
- See `docs/DEPLOY.md` for detailed deploy / domain binding / troubleshooting.
