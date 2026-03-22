# SoulForge 改版紀錄 / Changelog

All notable changes to SoulForge are documented in this file.

---

## 2026-03-22

### 🔐 隱私與安全 / Privacy & Security

- **新增 LLM 隱私警語**
  新增警告提醒使用者：將靈魂注入第三方 AI 平台後，對話內容可能被用於研究與開發，請避免輸入敏感資訊。支援全部 5 種語言。

- **新增 Google AI 對話備份機制**
  靈魂注入 Google AI 時，自動注入備份指令。使用者可在對話中說「備份」，AI 會產出靈魂備份碼（含對話摘要），可貼回 SoulForge 還原。

- **新增靈魂備份匯入功能**
  頁面新增「匯入靈魂備份」區塊，貼上備份碼即可還原靈魂設定與對話記憶，實現跨 session 的對話延續。

### 🎨 介面與體驗 / UI & UX

- **新增明暗主題切換**
  支援 Light / Dark 主題切換，所有元素皆適配兩種主題。

- **新增 Brian Chen 資訊與 LinkedIn 連結**
  側邊欄底部顯示創作者資訊。

- **修正淺色主題文字對比度**
  提升 Light 模式下的文字可讀性。

### 🌐 多語言 / i18n

- **新增五語系支援**
  繁體中文、簡體中文、English、한국어、日本語 完整翻譯，包含即時切換。

- **靈魂預覽隨語言切換**
  切換語言時，靈魂預覽內容同步更新。

- **側邊欄 credits 多語言化**
  側邊欄版權資訊支援五語系。

### 🚀 功能 / Features

- **專案初始化與 GitHub Pages 部署**
  建立 `index.html` 與 GitHub Actions 自動部署工作流程。

- **新增使用者名稱欄位**
  讓 AI 知道如何稱呼使用者，對話更有溫度。

- **新增 CoCo 預設靈魂**
  不填任何欄位直接啟動，自動使用 CoCo 預設靈魂。

- **平台支援調整：移除 Gemini / Claude，新增 Grok**
  一鍵啟動支援 Google AI 搜尋模式、ChatGPT、Grok。

- **新增側邊欄操作指南**
  詳細的步驟式操作說明，支援多語言。

- **鼓勵創意角色定義**
  角色欄位加入有趣的 placeholder 範例，激發使用者創意。

- **匯出靈魂 .json**
  可下載靈魂設定檔，方便備份與重複使用。

### 🔧 基礎建設 / Infrastructure

- **自訂網域 `soulforge.markforged.tw`**
  設定 CNAME 與 canonical URL。

- **SEO 最佳化**
  新增 Open Graph、Twitter Card、JSON-LD 結構化資料，提升 Google 搜尋可見度。

- **修正 GitHub Pages 部署**
  允許從 feature branch 部署，修正 404 問題。

- **行動裝置側邊欄關閉按鈕修正**
  修正手機版側邊欄無法正常關閉的問題。
