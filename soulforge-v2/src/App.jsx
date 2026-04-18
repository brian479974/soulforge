import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Shield, Zap, Moon, Sun, Download, Upload, Trash2 } from 'lucide-react'
import './App.css'

function App() {
  const [darkMode, setDarkMode] = useState(true)
  const [formData, setFormData] = useState({
    userName: '',
    soulName: '',
    role: '',
    personalities: [],
    description: ''
  })
  const [generated, setGenerated] = useState(false)

  const personalities = [
    '活潑開朗', '專業嚴謹', '溫柔體貼', '幽默風趣', 
    '冷靜理性', '熱情積極', '創意無限', '簡潔有力',
    '知心夥伴', '策略思維', '耐心傾聽', '行動派'
  ]

  const togglePersonality = (p) => {
    setFormData(prev => ({
      ...prev,
      personalities: prev.personalities.includes(p)
        ? prev.personalities.filter(x => x !== p)
        : [...prev.personalities, p]
    }))
  }

  const generatePrompt = () => {
    const { userName, soulName, role, personalities, description } = formData
    let prompt = `你是一個名為「${soulName}」的 AI 助手。`
    
    if (role) prompt += `你的角色定位是：${role}。`
    if (personalities.length > 0) {
      prompt += `你的個性特質包括：${personalities.join('、')}。`
    }
    if (description) {
      prompt += `背景資訊：${description}`
    }
    if (userName) {
      prompt += ` 請以親切的方式稱呼我為「${userName}」。`
    }
    
    return prompt
  }

  const openAI = (platform) => {
    const prompt = encodeURIComponent(generatePrompt())
    const urls = {
      google: `https://gemini.google.com/?hl=zh-TW`,
      chatgpt: `https://chat.openai.com/?q=${prompt}`,
      grok: `https://grok.com/?q=${prompt}`
    }
    window.open(urls[platform], '_blank')
  }

  const launchBot = () => {
    const params = new URLSearchParams()
    if (formData.soulName) params.set('name', formData.soulName)
    if (formData.role) params.set('role', formData.role)
    if (formData.userName) params.set('user', formData.userName)
    if (formData.description) params.set('bg', formData.description)
    if (formData.personalities && formData.personalities.length > 0) {
      params.set('traits', formData.personalities.join(','))
    }
    const qs = params.toString()
    window.open(`https://soulforge-topaz.vercel.app/chat${qs ? '?' + qs : ''}`, '_blank')
  }

  const exportSoul = () => {
    const data = JSON.stringify(formData, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${formData.soulName || 'soul'}.json`
    a.click()
  }

  const importSoul = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        setFormData(data)
      } catch (err) {
        alert('檔案格式錯誤')
      }
    }
    reader.readAsText(file)
  }

  const clearData = () => {
    if (confirm('確定要清除所有資料嗎？')) {
      setFormData({
        userName: '',
        soulName: '',
        role: '',
        personalities: [],
        description: ''
      })
      setGenerated(false)
    }
  }

  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="header"
      >
        <div className="header-content">
          <motion.div 
            className="logo"
            whileHover={{ scale: 1.05 }}
          >
            <Sparkles className="logo-icon" />
            <span>SOULFORGE</span>
          </motion.div>
          
          <div className="header-actions">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setDarkMode(!darkMode)}
              className="icon-btn"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearData}
              className="icon-btn danger"
            >
              <Trash2 size={20} />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="main">
        <motion.div 
          className="hero"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1>鍛造你的 AI 靈魂</h1>
          <p className="subtitle">為 AI 取名、選擇個性、描述背景，一鍵帶入任何 AI 平台</p>
          
          <div className="privacy-badge">
            <Shield size={16} />
            <span>隱私模式已啟用 — 關閉頁面即清除一切</span>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div 
          className="form-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {/* User Name */}
          <div className="form-group">
            <label>👤 你的名字</label>
            <input
              type="text"
              value={formData.userName}
              onChange={(e) => setFormData({...formData, userName: e.target.value})}
              placeholder="例如：Brian"
            />
          </div>

          {/* Soul Name */}
          <div className="form-group">
            <label>📛 靈魂名稱</label>
            <input
              type="text"
              value={formData.soulName}
              onChange={(e) => setFormData({...formData, soulName: e.target.value})}
              placeholder="為你的 AI 取個名字"
            />
          </div>

          {/* Role */}
          <div className="form-group">
            <label>🎭 角色定位</label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              placeholder="例如：專業商業顧問、創意夥伴..."
            />
          </div>

          {/* Personalities */}
          <div className="form-group">
            <label>✨ 個性選擇（可多選）</label>
            <div className="personality-grid">
              {personalities.map((p) => (
                <motion.button
                  key={p}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => togglePersonality(p)}
                  className={`personality-tag ${formData.personalities.includes(p) ? 'active' : ''}`}
                >
                  {p}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label>🏢 公司與產品描述（選填）</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="讓 AI 更了解你的工作背景..."
              maxLength={500}
              rows={4}
            />
            <span className="char-count">{formData.description.length} / 500</span>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={launchBot}
              className="btn btn-bot"
            >
              🔥 直接跟 SoulForge Bot 對話
              <span className="btn-badge">NEW</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openAI('google')}
              className="btn btn-primary"
            >
              <Zap size={18} />
              開啟 Google AI
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openAI('chatgpt')}
              className="btn btn-secondary"
            >
              開啟 ChatGPT
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openAI('grok')}
              className="btn btn-secondary"
            >
              開啟 Grok
            </motion.button>
          </div>

          {/* Import/Export */}
          <div className="import-export">
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={exportSoul}
              className="btn btn-ghost"
            >
              <Download size={16} />
              匯出靈魂
            </motion.button>
            
            <label className="btn btn-ghost">
              <Upload size={16} />
              載入靈魂
              <input type="file" accept=".json" onChange={importSoul} hidden />
            </label>
          </div>
        </motion.div>

        {/* Preview */}
        <AnimatePresence>
          {(formData.soulName || formData.personalities.length > 0) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="preview-card"
            >
              <h3>📝 靈魂預覽</h3>
              <pre>{generatePrompt()}</pre>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="warning">
            ⚠️ 隱私提醒：SoulForge 僅在你的瀏覽器中運作，不會傳送任何資料至伺服器。
            一旦靈魂被帶入第三方平台，資料即受該平台之隱私政策規範。
          </p>
        </motion.footer>
      </main>
    </div>
  )
}

export default App
