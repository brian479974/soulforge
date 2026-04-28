# 部署與維運指南

## 當前狀態

- **Production**: https://soulforge-topaz.vercel.app
- **Platform**: Vercel (Serverless Functions)
- **引擎**: Google AI Mode (SearchAPI)
- **Repo**: `brian479974/soulforge`, branch `main`

## 域名綁定

如果要把聊天 bot 綁到子域名 `bot.soulforge.markforged.tw`：

### 1. Vercel 端

1. 開 https://vercel.com/brian479974s-projects/soulforge/settings/domains
2. **Add Domain** → 輸入 `bot.soulforge.markforged.tw` → **Add**
3. Vercel 會顯示一組 DNS 設定，記下來（通常是 CNAME 指向 `cname.vercel-dns.com`）

### 2. DNS 端

1. 登入你的 DNS 供應商（markforged.tw 的 DNS 管理介面）
2. 新增 CNAME 記錄：
   - **Name/Host**: `bot.soulforge`
   - **Type**: `CNAME`
   - **Value**: `cname.vercel-dns.com`（以 Vercel 顯示的為準）
   - **TTL**: 3600（或預設）
3. 等 5-30 分鐘 DNS 生效，Vercel Dashboard 會自動顯示綠勾 ✓

### 3. 驗證

打開 `https://bot.soulforge.markforged.tw/chat` 應該看到聊天頁面。

> **注意**：不要綁 `soulforge.markforged.tw` 主域名到 Vercel，因為那個目前由 GitHub Pages 服務（顯示 index.html 靜態頁）。綁到主域名會讓 GitHub Pages 失效。

## 環境變數

在 https://vercel.com/brian479974s-projects/soulforge/settings/environment-variables 管理。

| Key | 必填 | 說明 |
|---|---|---|
| `SERP_API_KEY` | ✅ | SearchAPI 金鑰 ([searchapi.io](https://www.searchapi.io/)) |
| `SERP_PROVIDER` | 選配 | `searchapi`（預設）或 `serpapi` |
| `GEMINI_API_KEY` | ⛔ 停用 | 程式碼保留但 UI 隱藏，要啟用再填 |

變數改動後**要 Redeploy 才生效**：Deployments tab → 最新 deployment 右邊 `⋯` → **Redeploy**。

## 啟用 Gemini 引擎（日後用）

如果之後要重新開啟 Gemini：

1. 設 `GEMINI_API_KEY` 環境變數（[aistudio.google.com/apikey](https://aistudio.google.com/apikey)）
2. 修改 `public/chat.html` 搜 `data-hidden="v2.0"`，把 `style="display:none"` 拿掉
3. 同樣改 `public/widget.js`
4. 改 `chat.html` 裡 `engine: 'ai-mode'` 改回 `engine: 'gemini'` 若要預設 Gemini
5. Push 到 main → Vercel 自動部署

## 重新部署 / 回滾

- **重新部署**（環境變數改動後）：Deployments → 最新的 → `⋯` → Redeploy
- **回滾上一版**：Deployments → 想回的那個 → `⋯` → Promote to Production

## 本地開發

```bash
npm i -g vercel
vercel link                # 綁定這個 project
vercel env pull .env.local # 抓 Vercel 上的環境變數
vercel dev                 # 本機啟動 http://localhost:3000
```

## 測試清單

| 路徑 | 期望 |
|---|---|
| `/` | 原 SoulForge 生成器網頁，有 🔥 NEW 按鈕 |
| `/chat` | 全螢幕聊天頁 |
| `/chat?name=X&user=Y` | 聊天頁帶入靈魂參數 |
| `POST /api/ai-mode` | JSON 回覆 AI Overview |
| `widget.js` | 嵌入式右下浮動按鈕 |

**快速煙霧測試：**

1. `/` 點 🔥 按鈕 → 開 `/chat` → 打「你好」→ AI 回應
2. 在 `/chat` 打「備份」→ 自動下載 `soulforge-backup-*.json`
3. ⚙️ 設定面板 → 改名字 → 儲存 → 歡迎訊息變了

## 疑難排解

**`/api/ai-mode` 回 500 `SERP_API_KEY 未設定`**
→ 環境變數沒設或沒 Redeploy

**回 `SERP API 呼叫失敗`**
→ 金鑰無效 / 額度用完 / 供應商暫時故障。檢查 SearchAPI Dashboard 餘額。

**聊天記憶不連貫**
→ AI Mode 是單輪搜尋引擎，沒有對話記憶。這是設計上的 tradeoff。要多輪記憶請啟用 Gemini 引擎。

**404 在 `/chat`**
→ `vercel.json` routes 沒生效。確認 `vercel.json` 在 repo 根目錄、push 到 main、Redeploy。
