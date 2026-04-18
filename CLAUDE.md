# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Read this first — the repo has two independent apps

| URL | Source | Stack | Host |
|---|---|---|---|
| `soulforge.markforged.tw` (LIVE main site) | `soulforge-v2/` | React 19 + Vite | GitHub Pages |
| `soulforge-topaz.vercel.app/chat` (the Bot) | repo root (`chat.html`, `vercel.json`) | Vanilla HTML redirector | Vercel static |

**The Bot is NOT a full chat app. It's a redirector.** `/chat` builds a system-prompt-laden query from URL params and `window.location.replace(...)` to Google AI Mode (`google.com/search?q=...&udm=50`). Google's own UI handles the actual conversation, memory, and UX. No backend, no API keys, no serverless functions.

**Critical consequence:** The root `index.html` is the legacy static generator (~2200 lines). It is **not served by any domain**. Edits to it are invisible to users. GitHub Pages uploads only `soulforge-v2/dist/`; Vercel serves only `chat.html` (via rewrite `/chat → /chat.html`).

**Before modifying any file, check which of the two apps it belongs to.** Changes to `soulforge-v2/**` hit the live React site. Changes to root `chat.html` hit only the Vercel redirector.

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

No build, no dependencies. `chat.html` is plain HTML+JS. `vercel.json` routes `/chat` → `/chat.html`.

Deploy is automatic: push to `main` → Vercel auto-deploys. No env vars needed.

Local test: open `chat.html` directly in a browser. URL params still work because the redirect uses `window.location.search`.

## Architecture

### React app (`soulforge-v2/`)

Single-page app, no routing. `src/App.jsx` is the whole UI (~300 lines): a form for name/role/personalities/background, a prompt preview, and launcher buttons that `window.open(...)` third-party AI sites (Google, ChatGPT, Grok) with the soul pre-loaded via URL params.

State is local `useState` in `App.jsx`. No backend. `generatePrompt()` builds the system prompt string that gets URL-encoded and passed to external AIs.

### Bot (`chat.html` at repo root)

~120 lines of HTML+JS. Three-step flow:

1. **Read URL params** (`?name=`, `?user=`, `?traits=`, `?bg=`, `?soul={...}`) or fall back to hardcoded `DEFAULT_SOUL` (Brian's CoCo with Markforged GCR context).
2. **Build a Chinese system prompt** covering identity / personality / background / rules, ending with "請先用這個身份跟我打招呼".
3. **`window.location.replace` to `https://www.google.com/search?q=<encoded prompt>&udm=50`** (`udm=50` is Google AI Mode). Shows a 0.4s loading UI + manual-link fallback if replace fails.

That's it. No API calls, no conversation loop, no localStorage. Google AI Mode handles the rest: multi-turn memory, search grounding, UI.

## Gotchas that have bitten before

- **Don't re-introduce a SearchAPI / SerpAPI / Gemini backend for this bot.** We had one. It was worse than just redirecting to Google AI Mode directly — SearchAPI single-shot has no memory, Gemini needs paid keys + env setup. Google AI Mode is free, has memory, grounds in search. Stay simple.
- **Never assume `index.html` at root is what users see.** It is not. The deploy workflow uploads `soulforge-v2/dist`, nothing else.
- **Do not modify `soulforge-v2/**` without explicit user confirmation.** That folder IS the live website. One wrong push = visible regression.
- **`/chat` must keep the manual-link fallback.** Some browsers / extensions block `window.location.replace` — users on those need the 🔍 "手動開啟 Google AI Mode" link to still work.

## Entry points for common tasks

- Change the default CoCo greeting / context → `chat.html` → `const DEFAULT_SOUL = {...}`
- Adjust the system prompt Google AI Mode receives → `chat.html` → `buildSoulPrompt()`
- Add a launcher button to the live site → `soulforge-v2/src/App.jsx` (in the `action-buttons` block) — **confirm with Brian first, this is user-visible**
- Tweak deploy pipeline → `.github/workflows/deploy-pages.yml`

## Context

- **Owner:** Brian Chen (`brian479974` on GitHub) — Markforged GCR (Greater China Region) General Manager. Markets: Taiwan / China / HK / Vietnam. Product line: X7 FE, FX10, FX10+Metal Kit, FX20, PX100. The default soul in `chat.html` reflects this.
- **Language:** UI and docs are mostly Traditional Chinese (`zh-TW`). AI responses default to 繁體中文 per the system prompt.
- See `docs/DEPLOY.md` for deploy / domain binding / troubleshooting (may still reference the retired backend — update if you touch that area).
