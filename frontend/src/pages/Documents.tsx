import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { FileText, HardDrive, Layers, Clock, CheckCircle, Trash2, Search } from 'lucide-react'
import UploadZone from '@/components/documents/UploadZone'
import Card from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { getAllDocuments, deleteUpload, addNotification, type UploadedDoc } from '@/services/storage'
import { getPrefs, setPref } from '@/services/storage'
import { useQueryClient } from '@tanstack/react-query'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/context/ToastContext'
import { useDebounce } from '@/hooks/useDebounce'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

export default function Documents() {
  const [isLoading, setIsLoading] = useState(true)
  const [docs, setDocs] = useState<UploadedDoc[]>([])
  const [searchTerm, setSearchTerm] = useState(() => getPrefs().docSearch || '')
  const [deleteTarget, setDeleteTarget] = useState<UploadedDoc | null>(null)
  const queryClient = useQueryClient()
  const toast = useToast()
  const debouncedSearch = useDebounce(searchTerm, 200)

  const loadDocs = () => { setIsLoading(true); setTimeout(() => { setDocs(getAllDocuments()); setIsLoading(false) }, 200) }
  useEffect(() => { loadDocs() }, [])

  const handleSearchChange = (val: string) => {
    setSearchTerm(val)
    setPref('docSearch', val)
  }

  const filteredDocs = useMemo(() => {
    if (!debouncedSearch) return docs
    const q = debouncedSearch.toLowerCase()
    return docs.filter(d =>
      d.filename.toLowerCase().includes(q) ||
      d.title.toLowerCase().includes(q) ||
      d.tags.some(t => t.toLowerCase().includes(q)) ||
      d.text_content.toLowerCase().includes(q)
    )
  }, [docs, debouncedSearch])

  const confirmDelete = () => {
    if (!deleteTarget) return
    if (deleteTarget.is_sample) { toast.info('Sample document', 'Demo documents cannot be deleted.'); setDeleteTarget(null); return }
    deleteUpload(deleteTarget.id)
    addNotification({
      id: `n-${Date.now()}`, type: 'document', title: 'Document Removed',
      message: `${deleteTarget.filename} was deleted from your knowledge base.`,
      timestamp: new Date().toISOString(), read: false, priority: 'warning',
    })
    queryClient.invalidateQueries({ queryKey: ['documents'] })
    loadDocs()
    toast.success('Deleted', `${deleteTarget.filename} removed.`)
    setDeleteTarget(null)
  }

  const totalSize = docs.reduce((acc, d) => acc + d.size_bytes, 0)
  const totalChunks = docs.reduce((acc, d) => acc + d.chunk_count, 0)
  const totalPages = docs.reduce((acc, d) => acc + d.page_count, 0)

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4 sm:space-y-6">
      <motion.div variants={item}>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Documents</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your knowledge base — {docs.length} documents indexed</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/50 dark:border-indigo-800/30 rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400"><FileText className="w-4 h-4" /><span className="text-xs font-medium">Total Documents</span></div>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{docs.length}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-200/50 dark:border-emerald-800/30 rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400"><Layers className="w-4 h-4" /><span className="text-xs font-medium">Total Chunks</span></div>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{totalChunks}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-200/50 dark:border-purple-800/30 rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400"><HardDrive className="w-4 h-4" /><span className="text-xs font-medium">Total Size</span></div>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{(totalSize / 1_000_000).toFixed(1)} MB</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-200/50 dark:border-amber-800/30 rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400"><Layers className="w-4 h-4" /><span className="text-xs font-medium">Total Pages</span></div>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{totalPages}</p>
        </div>
      </motion.div>

      {/* Search bar */}
      <motion.div variants={item}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents by name, tags, or content..."
            value={searchTerm}
            onChange={e => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
            aria-label="Search documents"
          />
        </div>
      </motion.div>

      <motion.div variants={item}><Card><UploadZone /></Card></motion.div>

      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-800" />
                <div className="flex-1 space-y-2"><div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" /><div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/3" /></div>
              </div>
            </div>
          ))
        ) : filteredDocs.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400">
            <FileText className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">{searchTerm ? 'No documents match your search' : 'No documents yet'}</p>
            <p className="text-sm mt-1">{searchTerm ? 'Try a different search term.' : 'Upload a PDF to get started.'}</p>
          </div>
        ) : filteredDocs.map(doc => (
          <motion.div key={doc.id} whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"><FileText className="w-5 h-5" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 dark:text-white truncate" title={doc.filename}>{doc.filename}</p>
                  {!doc.is_sample && <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">UPLOADED</span>}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{doc.title}</p>
              </div>
              {!doc.is_sample && (
                <button onClick={() => setDeleteTarget(doc)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center" title="Delete" aria-label={`Delete ${doc.filename}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 line-clamp-2">{doc.description}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300"><Layers className="w-3 h-3" /> {doc.chunk_count} chunks</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"><HardDrive className="w-3 h-3" /> {doc.size_display}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">{doc.page_count} pages</span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <span className="flex items-center gap-1 text-xs text-gray-400"><Clock className="w-3 h-3" /> {formatDate(doc.uploaded_at)}</span>
              <span className="flex items-center gap-1 text-xs text-emerald-500"><CheckCircle className="w-3 h-3" /> Processed</span>
            </div>
            {doc.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {doc.tags.map(tag => <span key={tag} className="px-2 py-0.5 rounded-md text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">{tag}</span>)}
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Delete confirmation modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Document">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">{deleteTarget?.filename}</span>?
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            This will permanently remove the document and all its processed chunks from your local storage. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
