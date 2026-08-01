import { useState } from 'react'
import { FileText, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatDate } from '@/lib/utils'
import type { DocumentInfo } from '@/types'

interface DocumentCardProps {
  document: DocumentInfo
  onDelete: (filename: string) => void
}

export default function DocumentCard({ document, onDelete }: DocumentCardProps) {
  const [confirming, setConfirming] = useState(false)
  const { filename, chunk_count, uploaded_at } = document

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 dark:text-white truncate" title={filename}>{filename}</p>
            <p className="text-xs text-gray-400 mt-0.5">{chunk_count} chunks</p>
          </div>
        </div>
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { onDelete(filename); setConfirming(false); }}
              className="px-2.5 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
            >Delete</button>
            <button
              onClick={() => setConfirming(false)}
              className="px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
            >Cancel</button>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-3">Uploaded {formatDate(uploaded_at)}</p>
    </motion.div>
  )
}
