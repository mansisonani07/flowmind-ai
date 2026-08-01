import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Upload,
  MessageSquare,
  Phone,
  PartyPopper,
  CheckCircle2,
  CloudUpload,
  FileText,
  Send,
  Loader2,
  Zap,
  Shield,
  Brain,
} from 'lucide-react'
import Confetti from 'react-confetti'
import { cn } from '@/lib/utils'
import { DEMO_MODE } from '@/lib/api'

const TOTAL_STEPS = 5

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
}

function ProgressDots({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-2 rounded-full transition-all duration-500 ease-out',
            i === current
              ? 'w-8 bg-indigo-500'
              : i < current
                ? 'w-2 bg-indigo-300'
                : 'w-2 bg-gray-300 dark:bg-gray-600',
          )}
        />
      ))}
      <span className="ml-3 text-xs font-medium text-gray-500 dark:text-gray-400">
        {current + 1}/{TOTAL_STEPS}
      </span>
    </div>
  )
}

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="text-center space-y-6"
    >
      {/* Logo */}
      <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40">
        <Brain className="w-10 h-10 text-white" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome to FlowMind AI
        </h2>
        <p className="mt-3 text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm mx-auto">
          Your intelligent business assistant powered by AI. Upload documents, answer questions
          automatically, and connect with your customers via WhatsApp.
        </p>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-3 gap-4 pt-2">
        <div className="text-center space-y-2">
          <div className="mx-auto w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Fast RAG</p>
        </div>
        <div className="text-center space-y-2">
          <div className="mx-auto w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Secure</p>
        </div>
        <div className="text-center space-y-2">
          <div className="mx-auto w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
            <Phone className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">WhatsApp</p>
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        Get Started
        <ArrowRight className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

function StepUpload({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') return
    setUploading(true)
    setFileName(file.name)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (DEMO_MODE) {
        await new Promise(r => setTimeout(r, 1500))
      } else {
        await fetch('/upload', { method: 'POST', body: formData })
      }
      setUploaded(true)
    } catch {
      setFileName(null)
      setUploading(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0])
      }
    },
    [handleFile],
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFile(e.target.files[0])
      }
    },
    [handleFile],
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="text-center space-y-6"
    >
      <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
        <Upload className="w-7 h-7 text-amber-500" />
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upload Your First Document</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Add a PDF to power your AI with knowledge.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploaded && inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 transition-all duration-300 cursor-pointer',
          uploaded
            ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/10'
            : dragging
              ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/10 scale-[1.02]'
              : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-800/30',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleInputChange}
          disabled={uploaded}
        />

        {uploading ? (
          <div className="space-y-3">
            <Loader2 className="w-8 h-8 mx-auto text-indigo-500 animate-spin" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Uploading {fileName}...</p>
          </div>
        ) : uploaded ? (
          <div className="space-y-3">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{fileName} uploaded!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <CloudUpload className="w-8 h-8 mx-auto text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="text-indigo-600 dark:text-indigo-400 font-medium">Click to upload</span> or drag
              and drop
            </p>
            <p className="text-xs text-gray-400">PDF files only</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {uploaded && (
          <button
            onClick={onNext}
            className="flex-1 py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
        {!uploaded && (
          <button
            onClick={onSkip}
            className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors cursor-pointer"
          >
            Skip for now
          </button>
        )}
      </div>
    </motion.div>
  )
}

function StepTest({ onNext }: { onNext: () => void }) {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async () => {
    if (!question.trim() || loading) return
    setLoading(true)
    try {
      if (DEMO_MODE) {
        await new Promise(r => setTimeout(r, 1000))
        const demoAnswer = "Thanks for your question! In demo mode, FlowMind AI would normally retrieve relevant passages from your uploaded documents and generate a precise, citation-backed answer. Upload real documents and connect a backend to see full RAG-powered responses."
        setResponse(demoAnswer)
      } else {
        const res = await fetch('/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: question.trim() }),
        })
        const data = await res.json()
        setResponse(data.answer)
      }
      setAnswered(true)
    } catch {
      setResponse('Something went wrong. That\'s OK — you can try again later!')
      setAnswered(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="text-center space-y-6"
    >
      <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
        <MessageSquare className="w-7 h-7 text-indigo-500" />
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Test Your AI</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Ask a question to see FlowMind in action.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
          <input
            ref={inputRef}
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Type a question..."
            disabled={loading || answered}
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none"
          />
          <button
            onClick={handleSubmit}
            disabled={!question.trim() || loading || answered}
            className={cn(
              'p-2 rounded-lg transition-colors cursor-pointer',
              question.trim() && !loading && !answered
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400',
            )}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>

        <AnimatePresence>
          {response && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-indigo-50 dark:bg-indigo-900/10 rounded-xl p-4 text-left"
            >
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{response}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {answered && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-medium">That was easy!</span>
          </div>
          <button
            onClick={onNext}
            className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}

function StepConnect({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const steps = [
    {
      label: 'Get a Twilio Account',
      description: 'Sign up for a free Twilio account at twilio.com',
    },
    {
      label: 'Setup WhatsApp Sandbox',
      description: 'Activate the WhatsApp Sandbox in your Twilio console',
    },
    {
      label: 'Configure Webhook',
      description: 'Point your Twilio webhook to /webhook/whatsapp',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="text-center space-y-6"
    >
      <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
        <Phone className="w-7 h-7 text-emerald-500" />
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Connect WhatsApp</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Set up WhatsApp integration to answer customer questions automatically.
        </p>
      </div>

      <div className="space-y-3">
        {steps.map((step, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-left"
          >
            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{i + 1}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{step.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <button
          onClick={onNext}
          className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          Looks Good
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={onSkip}
          className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors cursor-pointer"
        >
          Configure Later
        </button>
      </div>
    </motion.div>
  )
}

function StepComplete({ onDone }: { onDone: () => void }) {
  const [showConfetti, setShowConfetti] = useState(true)
  const [windowSize, setWindowSize] = useState({ width: 400, height: 400 })

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    const timer = setTimeout(() => setShowConfetti(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  const tips = [
    {
      icon: <FileText className="w-4 h-4" />,
      title: 'Upload Documents',
      description: 'Add PDFs to build your knowledge base',
    },
    {
      icon: <MessageSquare className="w-4 h-4" />,
      title: 'Ask Questions',
      description: 'Query your docs in the Playground',
    },
    {
      icon: <PartyPopper className="w-4 h-4" />,
      title: 'Monitor Activity',
      description: 'Track analytics and conversations',
    },
  ]

  return (
    <>
      {showConfetti && (
        // @ts-ignore react-confetti v4 types are overly strict
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          colors={['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#fbbf24', '#34d399']}
        />
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center space-y-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.3, bounce: 0.5 }}
          className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
        >
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </motion.div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">You're all set!</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Here are some tips to get the most out of FlowMind AI.
          </p>
        </div>

        <div className="space-y-3">
          {tips.map((tip, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.15 }}
              className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0 text-indigo-500">
                {tip.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{tip.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{tip.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          onClick={onDone}
          className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          Go to Dashboard
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </motion.div>
    </>
  )
}

export default function OnboardingWizard() {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)

  useEffect(() => {
    const onboarded = localStorage.getItem('flowmind_onboarded')
    if (!onboarded) {
      setIsOpen(true)
    }
  }, [])

  const goNext = useCallback(() => {
    setDirection(1)
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
  }, [])

  const goBack = useCallback(() => {
    setDirection(-1)
    setStep((s) => Math.max(s - 1, 0))
  }, [])

  const handleComplete = useCallback(() => {
    localStorage.setItem('flowmind_onboarded', 'true')
    setIsOpen(false)
  }, [])

  const handleClose = useCallback(() => {
    if (step === TOTAL_STEPS - 1) {
      handleComplete()
    } else {
      setIsOpen(false)
      localStorage.setItem('flowmind_onboarded', 'true')
    }
  }, [step, handleComplete])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    },
    [handleClose],
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      {/* Wizard container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-lg"
      >
        {/* Glass card */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
            aria-label="Close wizard"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="px-6 py-8 min-h-[420px] flex flex-col">
            <ProgressDots current={step} />

            <div className="flex-1 relative overflow-hidden">
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                  key={step}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                >
                  {step === 0 && <StepWelcome onNext={goNext} />}
                  {step === 1 && <StepUpload onNext={goNext} onSkip={goNext} />}
                  {step === 2 && <StepTest onNext={goNext} />}
                  {step === 3 && <StepConnect onNext={goNext} onSkip={goNext} />}
                  {step === 4 && <StepComplete onDone={handleComplete} />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation (except step 4 which has its own button) */}
            {step < 4 && step > 0 && (
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={goBack}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <div className="flex items-center gap-2">
                  {step !== 0 && (
                    <button
                      onClick={handleClose}
                      className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
                    >
                      Skip Setup
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>,
    document.body,
  )
}
