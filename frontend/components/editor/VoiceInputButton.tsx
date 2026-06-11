'use client'

import { useState, useRef } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import toast from 'react-hot-toast'

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpeechRecognition = any

export function VoiceInputButton({ onTranscript }: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<AnySpeechRecognition>(null)

  const startListening = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const SpeechRecognitionAPI = w.SpeechRecognition || w.webkitSpeechRecognition

    if (!SpeechRecognitionAPI) {
      toast.error('Voice input not supported in this browser')
      return
    }

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-IN'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((result: any) => result[0].transcript)
        .join('')
      if (event.results[event.results.length - 1].isFinal) {
        onTranscript(transcript)
      }
    }

    recognition.onerror = () => {
      setIsListening(false)
      toast.error('Voice input error. Please try again.')
    }

    recognition.onend = () => setIsListening(false)

    recognition.start()
    recognitionRef.current = recognition
    setIsListening(true)
    toast.success('Listening… click mic to stop', { duration: 2000 })
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  return (
    <button
      onMouseDown={(e) => {
        e.preventDefault()
        isListening ? stopListening() : startListening()
      }}
      title={isListening ? 'Stop recording' : 'Voice input'}
      className={cn(
        'p-1.5 rounded transition-all',
        isListening
          ? 'bg-[rgba(239,68,68,0.15)] text-[var(--color-error)] animate-pulse'
          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-teal)] hover:bg-[var(--color-teal-muted)]'
      )}
    >
      {isListening ? <MicOff size={14} /> : <Mic size={14} />}
    </button>
  )
}
