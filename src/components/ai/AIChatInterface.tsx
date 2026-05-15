'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2 } from 'lucide-react'
import { UI_LABELS } from '@/lib/constants/labels'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED_QUESTIONS = [
  'Wie viele Bewohner sind aktuell im System?',
  'Welche Einheiten haben noch freie Plätze?',
  'Zeige mir die letzten offenen Vorfälle.',
  'Was ist die aktuelle Belegungsrate?',
]

export function AIChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return

    const userMessage: Message = { role: 'user', content: text.trim() }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setStreaming(true)
    setStreamingText('')

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      if (!reader) throw new Error('No reader')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (!data.trim()) continue

          try {
            const event = JSON.parse(data) as { type: string; text?: string; message?: string }
            if (event.type === 'text' && event.text) {
              accumulated += event.text
              setStreamingText(accumulated)
            } else if (event.type === 'error') {
              accumulated = event.message ?? 'Ein Fehler ist aufgetreten.'
              setStreamingText(accumulated)
            }
          } catch {
            // malformed SSE line — skip
          }
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: accumulated }])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Die Anfrage konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut.' },
      ])
    } finally {
      setStreaming(false)
      setStreamingText('')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const isEmpty = messages.length === 0 && !streaming

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[400px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            <div className="icon-container-lg bg-aoz-primary/10">
              <Bot className="w-6 h-6 text-aoz-primary" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">KI-Assistent für AOZ</p>
              <p className="text-sm text-gray-500 mt-1">Stellen Sie Fragen zu Bewohnern, Unterkünften und Vorfällen.</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {SUGGESTED_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-sm px-3 py-2 rounded-lg border border-gray-200 hover:border-aoz-primary hover:text-aoz-primary hover:bg-aoz-accent transition-colors text-gray-600 text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {streaming && (
          <div className="flex gap-3">
            <div className="icon-container-sm flex-shrink-0 bg-aoz-primary/10">
              <Bot className="w-4 h-4 text-aoz-primary" />
            </div>
            <div className="flex-1 min-w-0">
              {streamingText ? (
                <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap">
                  {streamingText}
                  <span className="inline-block w-1 h-4 bg-aoz-primary ml-0.5 animate-pulse align-middle" />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Daten werden abgerufen…
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-2 items-end border-t border-gray-100 pt-4">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={UI_LABELS.aiChatPlaceholder}
          rows={1}
          disabled={streaming}
          className="flex-1 resize-none input py-2.5 text-sm min-h-[44px] max-h-32 overflow-y-auto disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ height: 'auto' }}
          onInput={e => {
            const el = e.currentTarget
            el.style.height = 'auto'
            el.style.height = `${Math.min(el.scrollHeight, 128)}px`
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || streaming}
          className="btn btn-primary flex-shrink-0 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={UI_LABELS.sendMessage}
        >
          {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span className="hidden sm:inline">{UI_LABELS.aiChatSend}</span>
        </button>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`icon-container-sm flex-shrink-0 ${isUser ? 'bg-aoz-secondary/10' : 'bg-aoz-primary/10'}`}>
        {isUser
          ? <User className="w-4 h-4 text-aoz-secondary" />
          : <Bot className="w-4 h-4 text-aoz-primary" />
        }
      </div>
      <div
        className={`flex-1 min-w-0 rounded-lg px-4 py-3 text-sm ${
          isUser
            ? 'bg-aoz-secondary text-white max-w-[80%] ml-auto'
            : 'bg-gray-50 text-gray-800 border border-gray-100'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  )
}
