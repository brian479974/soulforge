# 🔥 SoulForge Bot v2.0

> AI 靈魂鍛造器 — 現在帶上了後端，可以直接跟你的靈魂對話了。

[soulforge.markforged.tw](https://soulforge.markforged.tw/) 的後端升級版：把原本只能「生成 System Prompt → 複製貼上」的工作流，升級成「直接在網頁上跟 AI 靈魂對話」。

## ✨ 新功能

- **`/chat` 全螢幕聊天頁面** — 沉浸式 AI 對話體驗
- **嵌入式 Widget** — 一行 `<script>` 嵌入任何網頁
- **AI 引擎** — Google AI Mode (SERP) 🔍（Gemini API 程式碼已內建但目前停用，可日後開啟）
- **靈魂即時調整** — 名字、角色、個性、背景通通可改
- **URL 參數帶入** — `?name=CoCo&user=Brian&engine=gemini`
- **對話記憶** — 最近 20 則訊息作為上下文

## 📐 架構

```
soulforge/
├── api/
│   ├── chat.js             # Gemini API 端點 (POST /api/chat)
│   ├── ai-mode.js          # Google AI Mode 端點 (POST /api/ai-mode)
│   └── lib/
│       └── soul-engine.js  # 靈魂組裝核心
├── public/
│   ├── chat.html           # 全螢幕聊天頁 (/chat)
│   └── widget.js           # 嵌入式 Widget
├── vercel.json             # Vercel 部署設定
└── package.json
```

## 🚀 部署到 Vercel

### 1. Import repo

到 [vercel.com/new](https://vercel.com/new) import 這個 repo。

### 2. 設定環境變數

在 Vercel Dashboard → Settings → Environment Variables 加上：

| 變數名 | 必填 | 說明 |
|---|---|---|
| `SERP_API_KEY` | ✅ | SearchAPI 或 SerpAPI 金鑰（AI Mode 引擎需要） |
| `SERP_PROVIDER` | 選配 | `searchapi` (預設) 或 `serpapi` |
| `GEMINI_API_KEY` | ⛔ 停用 | Gemini 端點 (`/api/chat`) 程式碼保留但 UI 隱藏中。日後要重新啟用再填，並把 chat.html / widget.js 的 engine-toggle `display:none` 拿掉即可 |

### 3. 部署

push 到 branch → Vercel 自動部署。

### 4. 綁定域名（選配）

Vercel Dashboard → Settings → Domains。如果要用 `soulforge.markforged.tw`，請先確認 GitHub Pages 的 DNS 已移除。建議用子域名如 `bot.soulforge.markforged.tw` 避免衝突。

## 💬 使用方式

### A. 直接開 `/chat`

```
https://your-domain.com/chat
https://your-domain.com/chat?name=CoCo&user=Brian&engine=gemini
https://your-domain.com/chat?soul={"name":"Alice","traits":["幽默風趣"]}
```

### B. 嵌入 Widget

```html
<script src="https://your-domain.com/widget.js" data-api="/api"></script>
```

進階設定：

```html
<script>
  window.SOULFORGE_CONFIG = {
    api: 'https://your-domain.com/api',
    engine: 'gemini',
    soul: {
      name: 'CoCo',
      role: '你的 AI 數位夥伴',
      traits: ['活潑開朗', '知心夥伴'],
      userName: 'Brian',
      background: '喜歡科技、熱愛設計',
    }
  };
</script>
<script src="https://your-domain.com/widget.js"></script>
```

JavaScript API：

```js
SoulForge.open();                          // 打開 widget
SoulForge.close();                         // 關閉
SoulForge.setSoul({ name: 'Alice' });      // 更新靈魂
SoulForge.setEngine('ai-mode');            // 切換引擎
```

## 🔌 API

### `POST /api/chat` — Gemini API

```json
{
  "soul": { "name": "CoCo", "role": "...", "traits": [...], "userName": "", "background": "" },
  "message": "你好",
  "history": [{ "role": "user", "content": "..." }, { "role": "assistant", "content": "..." }]
}
```

回應：

```json
{ "reply": "嗨～", "engine": "gemini", "model": "gemini-2.0-flash" }
```

### `POST /api/ai-mode` — Google AI Mode (SERP)

同上格式，回應：

```json
{ "reply": "...", "engine": "ai-mode", "provider": "searchapi" }
```

## 🧪 本地開發

```bash
npm i -g vercel
vercel link
vercel env pull .env.local
vercel dev
```

開 `http://localhost:3000/chat`。

## 📝 版本

- **v2.0.0** — 新增 Web Bot 後端 (Gemini + AI Mode)、全螢幕聊天頁、嵌入式 Widget
- v1.x — 靜態 System Prompt 生成器（見 [CHANGELOG.md](./CHANGELOG.md)）

## 🔐 隱私

- API Key 全部走 `process.env`，不會出現在前端 bundle
- 對話記錄只存在使用者瀏覽器 localStorage，伺服器不留存
- Gemini 和 SERP 供應商有各自的資料使用政策，請自行評估

## 📄 License

MIT — Brian Chen
