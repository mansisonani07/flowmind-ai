import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Plus, Building2 } from 'lucide-react'
import axios from 'axios'
import type { Business } from '@/types'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/lib/utils'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 15000,
})

const DOT_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899']

interface BusinessSwitcherProps {
  className?: string
}

export default function BusinessSwitcher({ className }: BusinessSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selected, setSelected] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Fetch businesses
  useEffect(() => {
    setLoading(true)
    api
      .get<Business[]>('/businesses')
      .then((res) => {
        setBusinesses(res.data)
        if (res.data.length > 0 && !selected) {
          setSelected(res.data[0].id)
        }
      })
      .catch(() => setBusinesses([]))
      .finally(() => setLoading(false))
  }, [])

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const currentBusiness = businesses.find((b) => b.id === selected)

  const handleSelect = (id: string) => {
    setSelected(id)
    setOpen(false)
    console.log('Switched to business:', businesses.find((b) => b.id === id)?.name)
  }

  return (
    <div ref={ref} className={cn('relative', className)}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer',
          'bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl',
          'border border-gray-200/60 dark:border-gray-700/60',
          'hover:bg-white/80 dark:hover:bg-gray-800/60 hover:border-gray-300/60 dark:hover:border-gray-600/60',
          'text-gray-900 dark:text-white',
        )}
      >
        <Building2 className="w-4 h-4 text-indigo-500" />
        <span className="max-w-[140px] truncate">
          {currentBusiness ? currentBusiness.name : 'Select Business'}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-gray-400 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute left-0 top-full mt-2 w-72 z-50"
          >
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 rounded-xl shadow-xl overflow-hidden">
              <div className="py-1.5">
                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    {businesses.map((business, i) => (
                      <button
                        key={business.id}
                        onClick={() => handleSelect(business.id)}
                        className={cn(
                          'flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors cursor-pointer',
                          'hover:bg-gray-50 dark:hover:bg-gray-800/50',
                          selected === business.id && 'bg-indigo-50/50 dark:bg-indigo-950/30',
                        )}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: DOT_COLORS[i % DOT_COLORS.length] }}
                        />
                        <div className="flex-1 min-w-0 text-left">
                          <p className={cn(
                            'font-medium truncate',
                            selected === business.id
                              ? 'text-indigo-700 dark:text-indigo-400'
                              : 'text-gray-900 dark:text-white',
                          )}>
                            {business.name}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                          {formatNumber(business.query_count)} queries
                        </span>
                      </button>
                    ))}

                    {businesses.length === 0 && (
                      <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
                        No businesses found
                      </div>
                    )}

                    {/* New business */}
                    <div className="border-t border-gray-200/50 dark:border-gray-700/50 mt-1 pt-1">
                      <button
                        onClick={() => {
                          setOpen(false)
                          console.log('Create new business')
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        New Business
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
