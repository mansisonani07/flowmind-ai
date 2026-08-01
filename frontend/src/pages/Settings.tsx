import { useState } from 'react'
import { motion } from 'framer-motion'
import { Save, Globe, Brain, Bell, Info } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

export default function Settings() {
  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_API_URL || 'http://localhost:8000')
  const [confidence, setConfidence] = useState(0.7)
  const [topK, setTopK] = useState(5)
  const [telegramAlerts, setTelegramAlerts] = useState(true)
  const [dailySummaries, setDailySummaries] = useState(false)

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-3xl">
      <motion.div variants={item}>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Configure your FlowMind AI instance</p>
      </motion.div>

      <motion.div variants={item}>
        <Card header={<div className="flex items-center gap-2"><Globe className="w-5 h-5 text-indigo-500" /><h3 className="font-semibold text-gray-900 dark:text-white">API Configuration</h3></div>}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">API Base URL</label>
              <input
                type="text" value={apiUrl} onChange={e => setApiUrl(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
              />
            </div>
            <Button variant="secondary" onClick={() => console.log('Test connection:', apiUrl)}>Test Connection</Button>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card header={<div className="flex items-center gap-2"><Brain className="w-5 h-5 text-purple-500" /><h3 className="font-semibold text-gray-900 dark:text-white">RAG Settings</h3></div>}>
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Confidence Threshold</label>
                <span className="text-sm font-mono text-indigo-600 dark:text-indigo-400">{confidence.toFixed(2)}</span>
              </div>
              <input type="range" min="0" max="1" step="0.05" value={confidence} onChange={e => setConfidence(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-indigo-600" />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>0.0</span><span>1.0</span></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Top K Results</label>
              <input type="number" min="1" max="20" value={topK} onChange={e => setTopK(parseInt(e.target.value) || 5)}
                className="w-32 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500" />
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card header={<div className="flex items-center gap-2"><Bell className="w-5 h-5 text-amber-500" /><h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3></div>}>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div><p className="text-sm font-medium text-gray-900 dark:text-white">Telegram Alerts</p><p className="text-xs text-gray-400">Get notified on escalations</p></div>
              <div className={`relative w-11 h-6 rounded-full transition-colors ${telegramAlerts ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`} onClick={() => setTelegramAlerts(!telegramAlerts)}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${telegramAlerts ? 'translate-x-5' : ''}`} />
              </div>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div><p className="text-sm font-medium text-gray-900 dark:text-white">Daily Summaries</p><p className="text-xs text-gray-400">Receive daily usage reports</p></div>
              <div className={`relative w-11 h-6 rounded-full transition-colors ${dailySummaries ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`} onClick={() => setDailySummaries(!dailySummaries)}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${dailySummaries ? 'translate-x-5' : ''}`} />
              </div>
            </label>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card header={<div className="flex items-center gap-2"><Info className="w-5 h-5 text-cyan-500" /><h3 className="font-semibold text-gray-900 dark:text-white">About</h3></div>}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Version</span>
              <Badge>v1.0.0</Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">FlowMind AI is a production-ready RAG (Retrieval-Augmented Generation) system for intelligent document question answering.</p>
            <div className="flex flex-wrap gap-2">
              {['FastAPI', 'ChromaDB', 'Groq', 'React', 'TypeScript', 'Tailwind'].map(t => <Badge key={t} variant="info">{t}</Badge>)}
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Button iconLeft={<Save className="w-4 h-4" />} onClick={() => console.log('Settings saved')}>Save Settings</Button>
      </motion.div>
    </motion.div>
  )
}
