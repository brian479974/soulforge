(function () {
  'use strict';
  if (window.__SOULFORGE_WIDGET__) return;
  window.__SOULFORGE_WIDGET__ = true;

  const script = document.currentScript;
  const defaults = {
    api: (script && script.getAttribute('data-api')) || 'https://soulforge-topaz.vercel.app/api',
    chat: (script && script.getAttribute('data-chat')) || 'https://soulforge-topaz.vercel.app/chat',
    engine: (script && script.getAttribute('data-engine')) || 'ai-mode',
    soul: null,
    title: 'SoulForge',
    position: 'bottom-right',
  };
  const cfg = Object.assign({}, defaults, window.SOULFORGE_CONFIG || {});

  const AVAILABLE_TRAITS = [
    '活潑開朗', '專業嚴謹', '溫柔體貼', '幽默風趣',
    '冷靜理性', '熱情積極', '創意無限', '簡潔有力',
    '知心夥伴', '策略思維', '耐心傾聽', '行動派'
  ];
  const DEFAULT_SOUL = {
    name: 'CoCo',
    role: '你的 AI 數位夥伴',
    traits: ['活潑開朗', '專業嚴謹', '知心夥伴'],
    userName: '',
    background: '',
  };
  const STORAGE_KEY = 'soulforge:widget';
  const HISTORY_LIMIT = 20;

  const state = {
    open: false,
    sending: false,
    engine: cfg.engine,
    apiBase: cfg.api,
    soul: Object.assign({}, DEFAULT_SOUL, cfg.soul || {}),
    history: [],
  };

  // Storage disabled by design — widget is public-facing, settings are ephemeral per page load.
  // Users who want to keep a custom soul should use the 📥 backup button (chat.html) or
  // pass soul via window.SOULFORGE_CONFIG / data-* attributes.
  function saveStorage() { /* no-op by design */ }

  // -------- Styles (scoped via custom prefix) --------
  const css = `
    .sf-root {
      position: fixed;
      bottom: 20px; right: 20px;
      z-index: 2147483640;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #f0f0f0;
    }
    .sf-launcher {
      width: 56px; height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #FF4500, #ff8c00);
      color: white;
      border: none;
      cursor: pointer;
      font-size: 24px;
      box-shadow: 0 4px 16px rgba(255, 69, 0, 0.45);
      display: flex; align-items: center; justify-content: center;
      transition: transform .2s;
    }
    .sf-launcher:hover { transform: scale(1.08); }
    .sf-panel {
      position: fixed;
      bottom: 90px; right: 20px;
      width: 360px; max-width: calc(100vw - 40px);
      height: 560px; max-height: calc(100vh - 120px);
      background: #0e0e0e;
      border: 1px solid #2a2a2a;
      border-radius: 16px;
      overflow: hidden;
      display: none;
      flex-direction: column;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    }
    .sf-panel.sf-open { display: flex; }
    .sf-header {
      flex-shrink: 0;
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 14px;
      background: #121212;
      border-bottom: 1px solid #2a2a2a;
    }
    .sf-hl { display: flex; align-items: center; gap: 8px; }
    .sf-avatar {
      width: 28px; height: 28px; border-radius: 50%;
      background: linear-gradient(135deg, #FF4500, #ff8c00);
      display: flex; align-items: center; justify-content: center;
      font-size: 14px;
    }
    .sf-name { font-size: 13px; font-weight: 600; }
    .sf-sub { font-size: 10px; color: #888; }
    .sf-hr { display: flex; align-items: center; gap: 4px; }
    .sf-toggle {
      display: flex; background: #1a1a1a;
      border-radius: 6px; padding: 2px;
    }
    .sf-etab {
      padding: 3px 6px; background: transparent; border: none;
      color: #888; cursor: pointer; font-size: 10px; border-radius: 4px;
    }
    .sf-etab.sf-active { background: #FF4500; color: white; }
    .sf-icon {
      width: 28px; height: 28px;
      background: transparent; border: none;
      color: #888; cursor: pointer;
      border-radius: 6px; font-size: 14px;
    }
    .sf-icon:hover { color: white; background: #1a1a1a; }
    .sf-body {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      background: #050505;
    }
    .sf-body::-webkit-scrollbar { width: 4px; }
    .sf-body::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
    .sf-welcome { text-align: center; padding: 20px 10px; color: #888; }
    .sf-welcome-e { font-size: 32px; margin-bottom: 8px; }
    .sf-welcome-t { color: #f0f0f0; font-weight: 600; font-size: 15px; margin-bottom: 4px; }
    .sf-msg {
      display: flex; gap: 6px; margin-bottom: 10px;
      align-items: flex-start;
    }
    .sf-msg.sf-user { flex-direction: row-reverse; }
    .sf-mav {
      width: 24px; height: 24px; border-radius: 50%;
      flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px;
    }
    .sf-msg.sf-ai .sf-mav { background: linear-gradient(135deg, #FF4500, #ff8c00); }
    .sf-msg.sf-user .sf-mav { background: #1a1a1a; border: 1px solid #2a2a2a; }
    .sf-bubble {
      padding: 8px 11px;
      border-radius: 12px;
      max-width: 80%;
      word-wrap: break-word;
      white-space: pre-wrap;
      font-size: 13px;
    }
    .sf-msg.sf-ai .sf-bubble {
      background: #1a0f08;
      border: 1px solid #3d2410;
      border-top-left-radius: 3px;
    }
    .sf-msg.sf-user .sf-bubble {
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-top-right-radius: 3px;
    }
    .sf-bubble code {
      background: rgba(255,255,255,0.08);
      padding: 1px 4px;
      border-radius: 3px;
      font-family: monospace;
      font-size: 0.9em;
      color: #00ffcc;
    }
    .sf-bubble strong { color: #ff8c00; }
    .sf-bubble a { color: #00ffcc; }
    .sf-typing { display: inline-flex; gap: 3px; padding: 2px; }
    .sf-dot {
      width: 5px; height: 5px; background: #ff8c00; border-radius: 50%;
      animation: sf-blink 1.4s infinite;
    }
    .sf-dot:nth-child(2) { animation-delay: .2s; }
    .sf-dot:nth-child(3) { animation-delay: .4s; }
    @keyframes sf-blink {
      0%, 60%, 100% { opacity: .3; }
      30% { opacity: 1; }
    }
    .sf-input-area {
      flex-shrink: 0;
      padding: 8px;
      background: #121212;
      border-top: 1px solid #2a2a2a;
    }
    .sf-ib {
      display: flex; align-items: flex-end; gap: 6px;
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-radius: 10px;
      padding: 4px;
    }
    .sf-ib textarea {
      flex: 1;
      min-height: 20px; max-height: 100px;
      background: transparent;
      border: none; outline: none;
      color: #f0f0f0;
      resize: none;
      font-family: inherit;
      font-size: 13px;
      padding: 5px 6px;
    }
    .sf-sendbtn {
      width: 30px; height: 30px;
      background: #FF4500; border: none;
      border-radius: 8px; color: white;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .sf-sendbtn:disabled { opacity: .4; cursor: not-allowed; }
    .sf-footer {
      text-align: center;
      padding: 4px;
      font-size: 10px;
      color: #555;
      background: #121212;
    }
    .sf-footer a { color: #ff8c00; text-decoration: none; }
    @media (max-width: 640px) {
      .sf-panel {
        bottom: 80px; right: 10px; left: 10px;
        width: auto; max-width: none;
        height: calc(100vh - 100px);
      }
      .sf-root { bottom: 14px; right: 14px; }
    }
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // -------- Build DOM --------
  const root = document.createElement('div');
  root.className = 'sf-root';
  root.innerHTML = `
    <div class="sf-panel" id="sf-panel">
      <div class="sf-header">
        <div class="sf-hl">
          <div class="sf-avatar">🔥</div>
          <div>
            <div class="sf-name" id="sf-name">${escape(state.soul.name)}</div>
            <div class="sf-sub" id="sf-sub">● 線上</div>
          </div>
        </div>
        <div class="sf-hr">
          <div class="sf-toggle" id="sf-toggle">
            <button class="sf-etab" data-engine="gemini">⚡</button>
            <button class="sf-etab sf-active" data-engine="ai-mode">🔍</button>
          </div>
          <button class="sf-icon" id="sf-backup" title="備份對話到本地">📥</button>
          <button class="sf-icon" id="sf-close" title="關閉">✕</button>
        </div>
      </div>
      <div class="sf-body" id="sf-body">
        <div class="sf-welcome">
          <div class="sf-welcome-e">🔥</div>
          <div class="sf-welcome-t">嗨，我是 ${escape(state.soul.name)}</div>
          <div>${escape(state.soul.role)}</div>
        </div>
      </div>
      <div class="sf-input-area">
        <div class="sf-ib">
          <textarea id="sf-input" placeholder="輸入訊息…" rows="1"></textarea>
          <button class="sf-sendbtn" id="sf-send" title="送出">➤</button>
        </div>
      </div>
      <div class="sf-footer">Powered by <a href="${cfg.chat}" target="_blank" rel="noopener">SoulForge</a></div>
    </div>
    <button class="sf-launcher" id="sf-launcher" title="打開 SoulForge 聊天">🔥</button>
  `;
  document.body.appendChild(root);

  // -------- Helpers --------
  function escape(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
  function md(text) {
    let t = escape(text);
    t = t.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    t = t.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return t;
  }
  const qs = (sel) => root.querySelector(sel);
  const body = qs('#sf-body');
  const inputEl = qs('#sf-input');
  const sendBtn = qs('#sf-send');

  function setEngineUI() {
    root.querySelectorAll('.sf-etab').forEach(b => {
      b.classList.toggle('sf-active', b.dataset.engine === state.engine);
    });
    qs('#sf-sub').textContent = `● ${state.engine === 'gemini' ? 'Gemini' : 'AI Mode'}`;
  }
  setEngineUI();

  function removeWelcome() {
    const w = body.querySelector('.sf-welcome');
    if (w) w.remove();
  }
  function scroll() { body.scrollTop = body.scrollHeight; }

  function appendMsg(role, content) {
    removeWelcome();
    const m = document.createElement('div');
    m.className = `sf-msg ${role === 'user' ? 'sf-user' : 'sf-ai'}`;
    m.innerHTML = `
      <div class="sf-mav">${role === 'user' ? '🙂' : '🔥'}</div>
      <div class="sf-bubble">${md(content)}</div>`;
    body.appendChild(m);
    scroll();
  }
  function appendTyping() {
    removeWelcome();
    const m = document.createElement('div');
    m.className = 'sf-msg sf-ai';
    m.id = 'sf-typing';
    m.innerHTML = `
      <div class="sf-mav">🔥</div>
      <div class="sf-bubble"><span class="sf-typing"><span class="sf-dot"></span><span class="sf-dot"></span><span class="sf-dot"></span></span></div>`;
    body.appendChild(m);
    scroll();
  }
  function removeTyping() {
    const t = root.querySelector('#sf-typing');
    if (t) t.remove();
  }

  function pad(n) { return String(n).padStart(2, '0'); }
  function downloadBackup() {
    const now = new Date();
    const stamp = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
    const payload = {
      app: 'SoulForge',
      version: '2.0',
      exportedAt: now.toISOString(),
      engine: state.engine,
      soul: state.soul,
      history: state.history,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soulforge-backup-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    appendMsg('ai', `✅ **備份完成**\n\n已下載 \`soulforge-backup-${stamp}.json\`（${state.history.length} 則對話）`);
  }

  async function send(text) {
    if (!text || state.sending) return;

    const trimmed = text.trim().toLowerCase();
    if (trimmed === '備份' || trimmed === 'backup') {
      appendMsg('user', text);
      state.history.push({ role: 'user', content: text });
      downloadBackup();
      return;
    }

    state.sending = true;
    sendBtn.disabled = true;
    appendMsg('user', text);
    state.history.push({ role: 'user', content: text });
    appendTyping();

    const endpoint = state.engine === 'gemini' ? '/chat' : '/ai-mode';
    const url = state.apiBase.replace(/\/$/, '') + endpoint;
    try {
      const ctx = state.history.slice(-HISTORY_LIMIT, -1);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          soul: state.soul,
          message: text,
          engine: state.engine,
          history: ctx,
        }),
      });
      const data = await res.json();
      removeTyping();
      if (!res.ok) {
        appendMsg('ai', `⚠️ ${data.error || res.statusText}`);
      } else {
        const reply = data.reply || '（無回應）';
        appendMsg('ai', reply);
        state.history.push({ role: 'assistant', content: reply });
      }
    } catch (err) {
      removeTyping();
      appendMsg('ai', `⚠️ 連線錯誤：${err.message}`);
    } finally {
      state.sending = false;
      sendBtn.disabled = false;
      inputEl.focus();
    }
  }

  // -------- Events --------
  qs('#sf-launcher').addEventListener('click', () => {
    state.open = !state.open;
    qs('#sf-panel').classList.toggle('sf-open', state.open);
    if (state.open) setTimeout(() => inputEl.focus(), 100);
  });
  qs('#sf-close').addEventListener('click', () => {
    state.open = false;
    qs('#sf-panel').classList.remove('sf-open');
  });
  root.querySelectorAll('.sf-etab').forEach(b => {
    b.addEventListener('click', () => {
      state.engine = b.dataset.engine;
      saveStorage();
      setEngineUI();
    });
  });
  function autoResize() {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + 'px';
  }
  inputEl.addEventListener('input', autoResize);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      const v = inputEl.value.trim();
      if (v) { send(v); inputEl.value = ''; autoResize(); }
    }
  });
  sendBtn.addEventListener('click', () => {
    const v = inputEl.value.trim();
    if (v) { send(v); inputEl.value = ''; autoResize(); }
  });

  // Public API
  window.SoulForge = {
    open: () => { state.open = true; qs('#sf-panel').classList.add('sf-open'); },
    close: () => { state.open = false; qs('#sf-panel').classList.remove('sf-open'); },
    setSoul: (s) => { Object.assign(state.soul, s); saveStorage(); qs('#sf-name').textContent = escape(state.soul.name); },
    setEngine: (e) => { if (e === 'gemini' || e === 'ai-mode') { state.engine = e; saveStorage(); setEngineUI(); } },
  };
})();
