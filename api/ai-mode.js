const { parseSoulFromRequest } = require('./lib/soul-engine');

const PROVIDERS = {
  searchapi: {
    url: 'https://www.searchapi.io/api/v1/search',
    buildParams: (query, apiKey) => ({
      engine: 'google_ai_mode',
      q: query,
      api_key: apiKey,
    }),
    extractReply: (data) => {
      if (data.text_blocks && data.text_blocks.length > 0) {
        return data.text_blocks.map((block) => block.answer || block.snippet || '').filter(Boolean).join('\n\n');
      }
      if (data.answer) return data.answer;
      return null;
    },
  },
  serpapi: {
    url: 'https://serpapi.com/search.json',
    buildParams: (query, apiKey) => ({
      engine: 'google',
      q: query,
      udm: '50',
      api_key: apiKey,
      hl: 'zh-TW',
      gl: 'tw',
    }),
    extractReply: (data) => {
      if (data.ai_overview && data.ai_overview.text) return data.ai_overview.text;
      if (data.ai_overview && data.ai_overview.text_blocks) {
        return data.ai_overview.text_blocks.map((b) => b.snippet || b.text || '').filter(Boolean).join('\n\n');
      }
      return null;
    },
  },
};

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: '僅支援 POST 請求' });

  const apiKey = process.env.SERP_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'SERP_API_KEY 未設定' });

  const providerName = process.env.SERP_PROVIDER || 'searchapi';
  const provider = PROVIDERS[providerName];
  if (!provider) return res.status(500).json({ error: `不支援的 SERP 供應商: ${providerName}` });

  try {
    const { systemPrompt, message, history } = parseSoulFromRequest(req.body);
    if (!message) return res.status(400).json({ error: '訊息不可為空' });

    // AI Mode 是無狀態搜尋引擎，沒有對話記憶。這裡手動把 history 塞進每次查詢，
    // 讓使用者感覺「同一個視窗它一直記得」— 行為對齊 Google 官方 AI Mode web UI。
    // Google search URL 上限 ~2048 chars，分三塊預算：prompt 1000 / history 600 / 新問題其餘
    const MAX_PROMPT = 1000;
    const MAX_HISTORY = 600;
    const promptForQuery = systemPrompt.length > MAX_PROMPT
      ? systemPrompt.slice(0, MAX_PROMPT)
      : systemPrompt;

    let convoBlock = '';
    if (Array.isArray(history) && history.length > 0) {
      const lines = [];
      // 從最新往回加，直到接近 MAX_HISTORY
      for (let i = history.length - 1; i >= 0; i--) {
        const m = history[i];
        if (!m || !m.content) continue;
        const who = m.role === 'assistant' ? 'CoCo' : '使用者';
        const line = `${who}：${m.content}`;
        const accumulated = lines.join('\n').length + line.length + 1;
        if (accumulated > MAX_HISTORY) break;
        lines.unshift(line);
      }
      if (lines.length > 0) {
        convoBlock = `\n\n【先前的對話（請記得上下文）】\n${lines.join('\n')}`;
      }
    }

    const query = `${promptForQuery}${convoBlock}\n\n使用者新問題：${message}`;
    const params = provider.buildParams(query, apiKey);
    const url = new URL(provider.url);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const response = await fetch(url.toString());
    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: 'SERP API 呼叫失敗', detail: errText });
    }

    const data = await response.json();
    const reply = provider.extractReply(data);

    if (!reply) {
      return res.status(200).json({
        reply: '抱歉，Google AI Mode 目前沒有回傳結果。請稍後再試或切換至 Gemini 引擎。',
        engine: 'ai-mode',
      });
    }

    return res.status(200).json({ reply, engine: 'ai-mode', provider: providerName });
  } catch (err) {
    return res.status(500).json({ error: '伺服器錯誤', detail: err.message });
  }
};
