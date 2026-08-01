import { useState, useRef, useCallback } from 'react'
import { FileText, CheckCircle2, XCircle, CloudUpload } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { processPdf } from '@/services/pdfProcessor'
import { addUpload, bumpCostsOnUpload } from '@/services/storage'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/context/ToastContext'

export default function UploadZone() {
  const [dragging, setDragging] = useState(false)
  const [files, setFiles] = useState<{ name: string; size: number; status: 'pending' | 'uploading' | 'success' | 'error'; progress: number; error?: string }[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const toast = useToast()

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    const pdfs = Array.from(fileList).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'))
    if (pdfs.length === 0) { toast.error('Invalid file', 'Only PDF files are accepted.'); return }
    const newFiles = pdfs.map(f => ({ name: f.name, size: f.size, status: 'pending' as const, progress: 0 }))
    setFiles(prev => [...prev, ...newFiles])
    for (let i = 0; i < pdfs.length; i++) {
      const idx = files.length + i
      setFiles(prev => prev.map((f, j) => j === idx ? { ...f, status: 'uploading', progress: 5 } : f))
      try {
        const doc = await processPdf(pdfs[i], (pct) => {
          setFiles(prev => prev.map((f, j) => j === idx ? { ...f, progress: pct } : f))
        })
        addUpload(doc)
        bumpCostsOnUpload()
        setFiles(prev => prev.map((f, j) => j === idx ? { ...f, status: 'success', progress: 100 } : f))
        queryClient.invalidateQueries({ queryKey: ['documents'] })
        toast.success('Document processed', `${doc.filename} → ${doc.chunk_count} chunks`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Upload failed'
        setFiles(prev => prev.map((f, j) => j === idx ? { ...f, status: 'error', error: msg } : f))
        toast.error('Upload failed', msg)
      }
    }
  }, [files.length, queryClient, toast])

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); processFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300',
          dragging
            ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/10 scale-[1.02]'
            : 'border-gray-300 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-800/30'
        )}
      >
        <input ref={inputRef} type="file" accept=".pdf" multiple className="hidden" onChange={(e) => e.target.files && processFiles(e.target.files)} />
        <CloudUpload className={cn('w-10 h-10 mx-auto mb-3 transition-colors', dragging ? 'text-indigo-500' : 'text-gray-400')} />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          <span className="text-indigo-600 dark:text-indigo-400">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-gray-400 mt-1">PDF files only — text is extracted and stored locally in your browser</p>
      </div>
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
                <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{f.name}</p>
                  <p className="text-xs text-gray-400">{formatSize(f.size)}</p>
                  {f.status === 'uploading' && (
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-1.5 overflow-hidden">
                      <motion.div className="h-full bg-indigo-500 rounded-full" initial={{ width: 0 }} animate={{ width: `${f.progress}%` }} transition={{ duration: 0.3 }} />
                    </div>
                  )}
                </div>
                {f.status === 'pending' && <span className="text-xs text-gray-400">Pending...</span>}
                {f.status === 'uploading' && <span className="text-xs text-indigo-500 font-medium">{f.progress}%</span>}
                {f.status === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {f.status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}