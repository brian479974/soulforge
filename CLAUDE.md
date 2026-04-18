# Claude Memory — SoulForge Repo

## ⚠️ READ THIS FIRST before touching anything

The live site `soulforge.markforged.tw` is **NOT** the root `index.html`.
It's the React/Vite app under `soulforge-v2/`, built by `.github/workflows/deploy-pages.yml` and deployed to GitHub Pages.

**Deployment map:**

| URL | Source | Served by |
|---|---|---|
| `soulforge.markforged.tw` | `soulforge-v2/dist/` (built) | GitHub Pages |
| `soulforge-topaz.vercel.app` | repo root (`chat.html`, `widget.js`, `api/`) | Vercel |

Modifying `soulforge-v2/**` changes the live site. Users see those changes. Root `index.html` is **not served anywhere** — edits are invisible.

## 🧠 Lessons from the v2.0 Bot launch (2026-04-18)

### Before doing anything

1. Run `git log --oneline -20` — check recent history
2. Read `.github/workflows/*` — know how deploy works
3. Read `CNAME`, root `package.json`, `README.md` — know the domain + framework
4. Then (and only then) propose changes

### Hard rules

- **Do not modify `soulforge-v2/**` without explicit user confirmation**. That folder IS the live website. One wrong push = visible regression.
- **Embedded / cross-origin components use absolute URLs, not relative paths.** `chat.html` and `widget.js` live at Vercel but can be opened from anywhere — relative `/api/...` will 405 on GH Pages.
- **Bot-specific code stays at repo root** (Vercel needs `api/` at root). Do not move it under `soulforge-v2/` or similar — Vercel won't detect functions.
- **Don't assume `index.html` at root is what users see.** It is not. The deploy workflow uploads `soulforge-v2/dist`, nothing else.

### Communication rules (user feedback — "你解決問題不是帶來問題")

- **Decide and execute** when there's a defensible answer. Don't hand the user 1/2/3 menus for trivial choices.
- **Only ask when architecturally ambiguous** (new repo vs subfolder vs same folder — that's worth asking).
- **Be honest about sandbox limits.** `*.vercel.app`, `*.markforged.tw`, `api.vercel.com`, `searchapi.io` are all blocked. Say "I can't verify, you need to test" rather than pretend it works.

### Style rules (user feedback — "真他媽囉說")

- Short responses. One-sentence update between tool calls. End-of-turn summary ≤ 2 sentences.
- No multi-level explanations when the user just wants action.

## 🔧 Current architecture (as of v2.0.0 merge)

```
soulforge/
├── index.html                   ← legacy static generator (NOT served)
├── soulforge-v2/                ← React app → soulforge.markforged.tw (LIVE)
│   └── src/App.jsx
├── chat.html                    ← Vercel-only chat page (/chat)
├── widget.js                    ← Vercel-only embed widget
├── api/
│   ├── ai-mode.js               ← Google AI Mode (SERP) POST /api/ai-mode
│   ├── chat.js                  ← Gemini (hidden/disabled) POST /api/chat
│   └── lib/soul-engine.js
├── vercel.json                  ← rewrites / to chat.html
├── docs/DEPLOY.md               ← deploy + troubleshoot guide
└── .github/workflows/deploy-pages.yml  ← builds soulforge-v2/ → GH Pages
```

**Engines:** Gemini code is retained but UI hidden (`display:none`). Only AI Mode is user-facing. To re-enable Gemini, undo `data-hidden="v2.0"` inline style + set `GEMINI_API_KEY` env.

**Env vars (on Vercel):**
- `SERP_API_KEY` (required) — SearchAPI or SerpAPI key
- `SERP_PROVIDER` (optional) — `searchapi` (default) or `serpapi`
- `GEMINI_API_KEY` (optional) — only if re-enabling Gemini

## Owner / context

- **Owner**: Brian Chen (`brian479974`) — Markforged 大中華區總經理
- **Default soul** in `chat.html`: CoCo 💖, personalized for Brian (Markforged GC, X7 FE / FX10 / FX20 / PX100 product line)
- When user says "我的網頁" they mean `soulforge.markforged.tw` (the React app), not the root index.html.
