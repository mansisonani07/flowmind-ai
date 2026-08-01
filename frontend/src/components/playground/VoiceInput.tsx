'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import Tooltip from '@/components/ui/Tooltip'
import { useToast } from '@/context/ToastContext'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  disabled?: boolean
  className?: string
}

// Type definition for SpeechRecognition API
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent {
  error: string
  message?: string
}

type SpeechRecognitionInstance = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance
  }
}

const isSpeechRecognitionSupported = (): boolean => {
  if (typeof window === 'undefined') return false
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}

export default function VoiceInput({ onTranscript, disabled = false, className }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const toast = useToast()

  const createRecognition = useCallback((): SpeechRecognitionInstance | null => {
    if (!isSpeechRecognitionSupported()) return null
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionCtor) return null
    return new SpeechRecognitionCtor()
  }, [])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsRecording(false)
  }, [])

  const startRecording = useCallback(() => {
    if (disabled) return

    const recognition = createRecognition()
    if (!recognition) {
      toast.error('Voice not supported', 'Your browser does not support speech recognition.')
      return
    }

    recognition.lang = 'en-US'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    let finalTranscript = ''

    recognition.onstart = () => {
      setIsRecording(true)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }

      if (finalTranscript.trim()) {
        onTranscript(finalTranscript.trim())
        finalTranscript = ''
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMsg = event.error
      if (errorMsg === 'not-allowed') {
        toast.error('Microphone access denied', 'Please allow microphone access in your browser settings.')
      } else if (errorMsg === 'no-speech') {
        toast.warning('No speech detected', 'Could not hear anything. Please try again.')
      } else if (errorMsg === 'aborted') {
        // User initiated stop, no error
      } else {
        toast.error('Voice error', `Speech recognition error: ${errorMsg}`)
      }
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
      recognitionRef.current = null
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [createRecognition, disabled, onTranscript, toast])

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [isRecording, startRecording, stopRecording])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
        recognitionRef.current = null
      }
    }
  }, [])

  const supported = isSpeechRecognitionSupported()

  const micButton = (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleRecording}
      disabled={disabled || !supported}
      className={cn(
        'relative flex items-center justify-center w-10 h-10 rounded-xl transition-colors cursor-pointer',
        'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
        'hover:bg-gray-200 dark:hover:bg-gray-700',
        disabled && 'opacity-40 cursor-not-allowed',
        !disabled && supported && 'hover:text-gray-900 dark:hover:text-gray-100',
      )}
      aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
    >
      <AnimatePresence mode="wait">
        {isRecording ? (
          <motion.div
            key="recording"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <MicOff className="w-4 h-4 text-red-500" />
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Mic className="w-4 h-4" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulsing red ring while recording */}
      <AnimatePresence>
        {isRecording && (
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-xl border-2 border-red-500 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Static red ring */}
      <AnimatePresence>
        {isRecording && (
          <motion.span
            initial={{ scale: 1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.4 }}
            exit={{ scale: 1, opacity: 0 }}
            className="absolute inset-0 rounded-xl border-2 border-red-500 pointer-events-none"
          />
        )}
      </AnimatePresence>
    </motion.button>
  )

  if (!supported) {
    return (
      <Tooltip content="Voice not supported in this browser" placement="top">
        <div className={className}>{micButton}</div>
      </Tooltip>
    )
  }

  return (
    <Tooltip content={isRecording ? 'Click to stop recording' : 'Click to speak'} placement="top">
      <div className={className}>{micButton}</div>
    </Tooltip>
  )
}
