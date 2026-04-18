const { parseSoulFromRequest } = require('./lib/soul-engine');

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: '僅支援 POST 請求' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY 未設定' });

  try {
    const { systemPrompt, message, history } = parseSoulFromRequest(req.body);
    if (!message) return res.status(400).json({ error: '訊息不可為空' });

    const contents = [];
    if (history && history.length > 0) {
      history.forEach((msg) => {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      });
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    const payload = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      // Google Search Grounding — 讓 Gemini 會去 Google 查實時資訊再回答，
      // 等同於 Google AI Mode 的內部機制。
      tools: [{ google_search: {} }],
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
      },
    };

    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API 錯誤:', errText);
      return res.status(response.status).json({ error: 'Gemini API 呼叫失敗', detail: errText });
    }

    const data = await response.json();
    const candidate = data?.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const reply = parts.map((p) => p.text).filter(Boolean).join('\n') || '（無回應）';

    // 如果 Gemini 有拿到搜尋引用，附在回答後面
    const chunks = candidate?.grounding_metadata?.grounding_chunks || [];
    let sources = '';
    if (chunks.length > 0) {
      const lines = chunks.slice(0, 5).map((c, i) => {
        const u = c.web?.uri;
        const t = c.web?.title || u;
        return u ? `[${i + 1}] [${t}](${u})` : '';
      }).filter(Boolean);
      if (lines.length > 0) sources = '\n\n📎 **來源**\n' + lines.join('\n');
    }

    return res.status(200).json({
      reply: reply + sources,
      engine: 'gemini',
      model: 'gemini-2.0-flash',
      grounded: chunks.length > 0,
    });
  } catch (err) {
    console.error('處理錯誤:', err);
    return res.status(500).json({ error: '伺服器錯誤', detail: err.message });
  }
};
