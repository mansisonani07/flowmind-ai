import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Building2,
  Palette,
  Save,
  Trash2,
  FileText,
  MessageSquare,
  Calendar,
  Loader2,
  BarChart3,
} from 'lucide-react'
import type { Business } from '@/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/context/ToastContext'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
}
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const demoBusiness: Business = {
  id: 'biz-001',
  name: 'FlowMind Demo Restaurant',
  description: 'A fine dining restaurant offering Mediterranean and American cuisine with an extensive wine list and outdoor seating.',
  created_at: '2025-07-15T10:00:00Z',
  document_count: 3,
  query_count: 247,
  branding: {
    primary_color: '#6366f1',
    accent_color: '#8b5cf6',
    logo_url: '',
  },
}

export default function BusinessSettings() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#6366f1')
  const [accentColor, setAccentColor] = useState('#8b5cf6')

  const fetchBusiness = useCallback(() => {
    setLoading(true)
    setTimeout(() => {
      setBusiness(demoBusiness)
      setName(demoBusiness.name)
      setDescription(demoBusiness.description)
      setPrimaryColor(demoBusiness.branding.primary_color)
      setAccentColor(demoBusiness.branding.accent_color)
      setLoading(false)
    }, 500)
  }, [])

  useEffect(() => { fetchBusiness() }, [fetchBusiness])

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    toast.success('Saved', 'Business settings updated successfully.')
  }

  const handleDelete = () => {
    if (!business) return
    if (window.confirm(`Are you sure you want to delete "${business.name}"? This action cannot be undone.`)) {
      setBusiness(null)
      setName('')
      setDescription('')
      setPrimaryColor('#6366f1')
      setAccentColor('#8b5cf6')
      toast.info('Deleted', 'Business has been removed.')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-3xl">
      <motion.div variants={item}>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Business Settings</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your business profile and branding</p>
      </motion.div>

      <motion.div variants={item}>
        <Card
          className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50"
          header={
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">General Information</h3>
            </div>
          }
        >
          <div className="space-y-4">
            <Input
              label="Business Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter business name"
              iconLeft={<Building2 className="w-4 h-4" />}
            />
            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your business..."
              rows={4}
              showCount
              maxLength={500}
            />
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card
          className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50"
          header={
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Branding</h3>
            </div>
          }
        >
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Primary Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-12 h-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 cursor-pointer overflow-hidden" style={{ padding: 0 }} />
                  <div className="flex-1">
                    <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500" placeholder="#6366f1" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md" style={{ backgroundColor: primaryColor }} />
                  <span className="text-xs text-gray-400">Preview</span>
                  <button className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-white" style={{ backgroundColor: primaryColor }} onClick={() => {}}>Sample Button</button>
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Accent Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-12 h-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 cursor-pointer overflow-hidden" style={{ padding: 0 }} />
                  <div className="flex-1">
                    <input type="text" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500" placeholder="#8b5cf6" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md" style={{ backgroundColor: accentColor }} />
                  <span className="text-xs text-gray-400">Preview</span>
                  <div className="ml-auto px-3 py-1.5 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: accentColor }}>Badge</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {business && (
        <motion.div variants={item}>
          <Card
            className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50"
            header={
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Statistics</h3>
              </div>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/40">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"><FileText className="w-4 h-4" /></div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Documents</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{business.document_count}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/40">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"><MessageSquare className="w-4 h-4" /></div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Queries</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{business.query_count}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/40">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"><Calendar className="w-4 h-4" /></div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(business.created_at)}</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      <motion.div variants={item} className="flex items-center gap-3">
        <Button iconLeft={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} onClick={handleSave} disabled={saving || (!name.trim() && !description.trim())}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
        {business && (
          <Button variant="danger" iconLeft={<Trash2 className="w-4 h-4" />} onClick={handleDelete}>Delete Business</Button>
        )}
      </motion.div>
    </motion.div>
  )
}
