'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Salad, Clock, DollarSign, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { samplePlayground } from '@/lib/api'
import type { LucideIcon } from 'lucide-react'

interface SampleQuestionsProps {
  onQuestion: (question: string) => void
  disabled?: boolean
  className?: string
}

const iconMap: Record<string, LucideIcon> = {
  Salad,
  Clock,
  DollarSign,
  Shield,
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25, ease: 'easeOut' } },
}

export default function SampleQuestions({ onQuestion, disabled = false, className }: SampleQuestionsProps) {
  const questions = useMemo(() => samplePlayground.sample_questions, [])

  return (
    <div className={cn('w-full', className)}>
      <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-2 px-1">Try asking:</p>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin -mx-1 px-1"
        role="list"
        aria-label="Sample questions"
      >
        {questions.map((q) => {
          const Icon = iconMap[q.icon] || Shield
          return (
            <motion.button
              key={q.id}
              variants={itemVariants}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => !disabled && onQuestion(q.text)}
              disabled={disabled}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap',
                'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
                'text-gray-700 dark:text-gray-300',
                'hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-gray-300 dark:hover:border-gray-600',
                'transition-all shadow-sm hover:shadow',
                'flex-shrink-0 cursor-pointer',
                disabled && 'opacity-40 cursor-not-allowed',
              )}
              role="listitem"
            >
              <span className="text-indigo-500 dark:text-indigo-400"><Icon className="w-3.5 h-3.5" /></span>
              {q.text}
            </motion.button>
          )
        })}
      </motion.div>
    </div>
  )
}
