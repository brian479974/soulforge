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
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || '（無回應）';
    return res.status(200).json({ reply, engine: 'gemini', model: 'gemini-2.0-flash' });
  } catch (err) {
    console.error('處理錯誤:', err);
    return res.status(500).json({ error: '伺服器錯誤', detail: err.message });
  }
};
