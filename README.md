# 🔥 SoulForge Bot — 帶靈魂進入 Google AI Mode

這個 repo 有兩個獨立的東西：

1. **主站** [`soulforge.markforged.tw`](https://soulforge.markforged.tw) — 靈魂鍛造器（React app 在 `soulforge-v2/`）
2. **Bot** [`soulforge-topaz.vercel.app/chat`](https://soulforge-topaz.vercel.app/chat) — 一個**純前端導向頁**：把靈魂打包成系統提示，自動帶進 Google AI 搜尋模式（`udm=50`），使用者在 Google 自己的視窗裡連續對話。

## 為什麼不自己做後端？

**Google AI Mode 本身就是最好的聊天後端**：
- 它是真正的 LLM，有多輪對話、有記憶
- 整合 Google 搜尋，可以查到最新資訊
- 完全免費、不用 API key、不用付費 tier
- 會話狀態由 Google 自己維護，我們完全不用碰

所以我們只做一件事：**把靈魂翻譯成 Google AI Mode 看得懂的開場指令**，剩下讓 Google 處理。

## `/chat` 怎麼用

```
https://soulforge-topaz.vercel.app/chat
https://soulforge-topaz.vercel.app/chat?name=Alice&user=Brian
https://soulforge-topaz.vercel.app/chat?soul={"name":"Alice","traits":["幽默風趣"]}
```

進去後 0.4 秒自動跳轉到 Google AI Mode，靈魂已包在第一則查詢裡。使用者接著就在 Google 那個視窗一直問問題。

## 支援的 URL 參數

| 參數 | 範例 | 對應 |
|---|---|---|
| `name` | `CoCo` | AI 名稱 |
| `role` | `AI 助理` | 角色定位 |
| `user` | `Brian` | 使用者名字 |
| `bg` | `Markforged 總經理...` | 背景資訊 |
| `traits` | `活潑,幽默` | 個性特質（逗號分隔） |
| `soul` | `{"name":"X",...}` | 完整 JSON 靈魂（覆蓋以上） |

沒帶任何參數時載入 Brian 的預設 CoCo。

## 部署

- **主站**：push main → GitHub Actions build `soulforge-v2/` → GH Pages
- **Bot**：push main → Vercel 自動部署 `chat.html` + `vercel.json`（純靜態，沒 serverless function）

不再需要任何環境變數。可以把 Vercel 上的 `SERP_API_KEY` / `GEMINI_API_KEY` 全部撤掉。

## 架構歷史

v2.0 最初做了一個完整的 Serverless Bot 後端（Gemini API + Google AI Mode via SearchAPI），但發現：
- SearchAPI 單次查詢沒記憶，聊天體驗差
- Gemini API 雖好但要付費、要管 key
- 直接用 Google AI Mode 本尊，比我們自己 proxy 任何 API 都強

v2.1 起，Bot 回歸最簡單的定位：**一個帶靈魂的 Google AI Mode 快速入口**。
