import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Palette,
  Download,
  Upload,
  RotateCcw,
  Sun,
  Moon,
  Check,
  Eye,
  Type,
  Maximize,
  LayoutGrid,
  Sparkles,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { cn } from '@/lib/utils'
import { useToast } from '@/context/ToastContext'
import type { ThemeConfig } from '@/types'

const STORAGE_KEY = 'flowmind-theme'

const presetThemes: ThemeConfig[] = [
  {
    name: 'Modern',
    primary: '#6366f1',
    accent: '#8b5cf6',
    background: '#ffffff',
    text: '#111827',
    fontSize: 14,
    borderRadius: 12,
    density: 'comfortable',
    isDark: false,
  },
  {
    name: 'Corporate',
    primary: '#475569',
    accent: '#64748b',
    background: '#f8fafc',
    text: '#1e293b',
    fontSize: 14,
    borderRadius: 8,
    density: 'comfortable',
    isDark: false,
  },
  {
    name: 'Vibrant',
    primary: '#d946ef',
    accent: '#ec4899',
    background: '#fdf4ff',
    text: '#581c87',
    fontSize: 15,
    borderRadius: 16,
    density: 'spacious',
    isDark: false,
  },
  {
    name: 'Minimal',
    primary: '#71717a',
    accent: '#a1a1aa',
    background: '#ffffff',
    text: '#18181b',
    fontSize: 14,
    borderRadius: 4,
    density: 'compact',
    isDark: false,
  },
  {
    name: 'Neon',
    primary: '#06b6d4',
    accent: '#22d3ee',
    background: '#0f172a',
    text: '#e2e8f0',
    fontSize: 15,
    borderRadius: 12,
    density: 'comfortable',
    isDark: true,
  },
]

const defaultTheme: ThemeConfig = presetThemes[0]

const densityOptions: ThemeConfig['density'][] = ['compact', 'comfortable', 'spacious']

function applyThemeToDOM(theme: ThemeConfig) {
  const root = document.documentElement
  root.style.setProperty('--theme-primary', theme.primary)
  root.style.setProperty('--theme-accent', theme.accent)
  root.style.setProperty('--theme-bg', theme.background)
  root.style.setProperty('--theme-text', theme.text)
  root.style.setProperty('--theme-font-size', `${theme.fontSize}px`)
  root.style.setProperty('--theme-border-radius', `${theme.borderRadius}px`)

  const densityPadding: Record<ThemeConfig['density'], string> = {
    compact: '4px',
    comfortable: '12px',
    spacious: '20px',
  }
  root.style.setProperty('--theme-spacing', densityPadding[theme.density])

  if (theme.isDark) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function ThemeCustomizer() {
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) return JSON.parse(saved) as ThemeConfig
      } catch {
        // ignore
      }
    }
    return defaultTheme
  })
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [showResetModal, setShowResetModal] = useState(false)
  const toast = useToast()

  // Apply theme to DOM on changes
  useEffect(() => {
    applyThemeToDOM(theme)
  }, [theme])

  // Save to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(theme))
    } catch {
      // ignore
    }
  }, [theme])

  const applyPreset = useCallback((preset: ThemeConfig) => {
    setTheme(preset)
    setActivePreset(preset.name)
  }, [])

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(theme, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `flowmind-theme-${theme.name.toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const imported = JSON.parse(reader.result as string) as ThemeConfig
          setTheme(imported)
          setActivePreset(null)
        } catch {
          console.error('Invalid theme file')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleReset = () => {
    setTheme(defaultTheme)
    setActivePreset(null)
    setShowResetModal(false)
    toast.info('Theme reset', 'Reverted to default Modern theme.')
  }

  const update = (partial: Partial<ThemeConfig>) => {
    setTheme((prev) => ({ ...prev, ...partial }))
    setActivePreset(null)
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-4xl">
      {/* Header */}
      <motion.div variants={item}>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Theme Customizer</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Personalize your FlowMind AI experience</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preset themes */}
        <div className="lg:col-span-2">
          <Card
            className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50"
            header={
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Preset Themes</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Click to apply instantly</p>
                </div>
              </div>
            }
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <AnimatePresence>
                {presetThemes.map((preset) => {
                  const isActive = activePreset === preset.name
                  return (
                    <motion.button
                      key={preset.name}
                      layout
                      whileHover={{ scale: 1.04, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => applyPreset(preset)}
                      className={cn(
                        'relative flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all cursor-pointer',
                        isActive
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-sm'
                          : 'border-gray-200/60 dark:border-gray-700/60 hover:border-gray-300/80 dark:hover:border-gray-600/60',
                      )}
                    >
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center"
                        >
                          <Check className="w-3 h-3 text-white" />
                        </motion.div>
                      )}

                      {/* Color circles */}
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-600"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <div
                          className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-600"
                          style={{ backgroundColor: preset.accent }}
                        />
                        <div
                          className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-600"
                          style={{ backgroundColor: preset.background === '#ffffff' || preset.background === '#f8fafc' || preset.background === '#fdf4ff'
                            ? '#f1f5f9'
                            : preset.background }}
                        />
                      </div>

                      <p className={cn(
                        'text-xs font-medium',
                        isActive ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400',
                      )}>
                        {preset.name}
                      </p>

                      {/* Mini preview */}
                      <div
                        className="w-full h-8 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor: preset.background === '#ffffff' || preset.background === '#f8fafc' || preset.background === '#fdf4ff'
                            ? '#f8fafc'
                            : preset.background,
                          borderRadius: `${preset.borderRadius}px`,
                        }}
                      >
                        <div
                          className="w-12 h-2 rounded-full"
                          style={{ backgroundColor: preset.primary, opacity: 0.7 }}
                        />
                      </div>
                    </motion.button>
                  )
                })}
              </AnimatePresence>
            </div>
          </Card>
        </div>

        {/* Live preview */}
        <div>
          <Card
            className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50"
            header={
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-emerald-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Live Preview</h3>
              </div>
            }
          >
            <motion.div
              layout
              className="rounded-xl p-4 space-y-3"
              style={{
                backgroundColor: theme.background,
                color: theme.text,
                fontSize: `${theme.fontSize}px`,
                borderRadius: `${theme.borderRadius}px`,
                padding: theme.density === 'compact' ? '8px' : theme.density === 'spacious' ? '20px' : '16px',
              }}
            >
              <div
                className="font-semibold"
                style={{ color: theme.primary }}
              >
                Sample Card
              </div>
              <p style={{ fontSize: `${theme.fontSize - 1}px`, opacity: 0.8 }}>
                This preview updates in real-time as you customize your theme.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toast.success('Primary Action', `Applied theme primary color: ${theme.primary}`)}
                  className="px-3 py-1 text-white text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: theme.primary, borderRadius: `${theme.borderRadius}px` }}
                >
                  Primary
                </button>
                <button
                  onClick={() => toast.info('Accent Action', `Applied theme accent color: ${theme.accent}`)}
                  className="px-3 py-1 text-white text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: theme.accent, borderRadius: `${theme.borderRadius}px` }}
                >
                  Accent
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.primary }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.accent }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.text }} />
                <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: theme.background, borderColor: theme.text + '33' }} />
              </div>
            </motion.div>
          </Card>
        </div>
      </motion.div>

      {/* Custom settings */}
      <motion.div variants={item}>
        <Card
          className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50"
          header={
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-500" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Custom Settings</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Fine-tune every detail</p>
              </div>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Color inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { key: 'primary' as const, label: 'Primary Color', icon: '🎨' },
                { key: 'accent' as const, label: 'Accent Color', icon: '✨' },
                { key: 'background' as const, label: 'Background', icon: '🖼️' },
                { key: 'text' as const, label: 'Text Color', icon: '📝' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    <span>{field.icon}</span>
                    {field.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme[field.key]}
                      onChange={(e) => update({ [field.key]: e.target.value })}
                      className="w-10 h-10 rounded-lg border-2 border-gray-200 dark:border-gray-700 cursor-pointer"
                      style={{ padding: 0 }}
                    />
                    <input
                      type="text"
                      value={theme[field.key]}
                      onChange={(e) => update({ [field.key]: e.target.value })}
                      className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Font size */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Type className="w-4 h-4" />
                    Font Size
                  </label>
                  <span className="text-sm font-mono text-indigo-600 dark:text-indigo-400">
                    {theme.fontSize}px
                  </span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="20"
                  value={theme.fontSize}
                  onChange={(e) => update({ fontSize: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>12px</span>
                  <span>20px</span>
                </div>
              </div>

              {/* Border radius */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Maximize className="w-4 h-4" />
                    Border Radius
                  </label>
                  <span className="text-sm font-mono text-indigo-600 dark:text-indigo-400">
                    {theme.borderRadius}px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={theme.borderRadius}
                  onChange={(e) => update({ borderRadius: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0px</span>
                  <span>24px</span>
                </div>
              </div>
            </div>

            {/* Density toggle */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <LayoutGrid className="w-4 h-4" />
                Density
              </label>
              <div className="flex items-center gap-1 p-1 bg-gray-100/80 dark:bg-gray-800/60 rounded-xl w-fit">
                {densityOptions.map((d) => (
                  <button
                    key={d}
                    onClick={() => update({ density: d })}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize cursor-pointer',
                      theme.density === d
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Dark/Light toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/40">
              <div className="flex items-center gap-2">
                {theme.isDark ? <Moon className="w-5 h-5 text-indigo-500" /> : <Sun className="w-5 h-5 text-amber-500" />}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {theme.isDark ? 'Dark Mode' : 'Light Mode'}
                </span>
              </div>
              <button
                onClick={() => update({ isDark: !theme.isDark })}
                className={cn(
                  'relative w-12 h-7 rounded-full transition-colors duration-300 cursor-pointer',
                  theme.isDark ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600',
                )}
              >
                <motion.div
                  layout
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className={cn(
                    'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center',
                    theme.isDark ? 'left-[calc(100%-26px)]' : 'left-0.5',
                  )}
                >
                  {theme.isDark ? (
                    <Moon className="w-3 h-3 text-indigo-600" />
                  ) : (
                    <Sun className="w-3 h-3 text-amber-500" />
                  )}
                </motion.div>
              </button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Action buttons */}
      <motion.div variants={item} className="flex flex-wrap items-center gap-3">
        <Button
          iconLeft={<Download className="w-4 h-4" />}
          onClick={handleExport}
          variant="secondary"
          size="sm"
        >
          Export JSON
        </Button>
        <Button
          iconLeft={<Upload className="w-4 h-4" />}
          onClick={handleImport}
          variant="secondary"
          size="sm"
        >
          Import JSON
        </Button>
        <Button
          iconLeft={<RotateCcw className="w-4 h-4" />}
          onClick={() => setShowResetModal(true)}
          variant="secondary"
          size="sm"
        >
          Reset to Default
        </Button>
      </motion.div>

      {/* Reset confirmation modal */}
      <Modal open={showResetModal} onClose={() => setShowResetModal(false)} title="Reset Theme">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to reset your theme to the default <span className="font-semibold text-gray-900 dark:text-white">Modern</span> theme? Your current customization will be lost.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowResetModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleReset}>Reset</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
