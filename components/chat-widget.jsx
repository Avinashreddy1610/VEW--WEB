'use client'
import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const SUGGESTIONS = [
  'What gears do you manufacture?',
  'How do I request a quote?',
  'How can I track my order?',
]

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I can help with questions about our gears, the quote process, and order tracking. What would you like to know?' },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' }) }, [messages, open])

  async function send(text) {
    const content = (text ?? input).trim()
    if (!content || busy) return
    const next = [...messages, { role: 'user', content: content.slice(0, 2000) }]
    setMessages(next)
    setInput('')
    setBusy(true)
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.map(m => ({ role: m.role, content: m.content })) }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Something went wrong.')
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const parts = buf.split('\n\n')
        buf = parts.pop()
        for (const part of parts) {
          const line = part.trim()
          if (!line.startsWith('data:')) continue
          const payload = line.slice(5).trim()
          if (payload === '[DONE]') continue
          try {
            const data = JSON.parse(payload)
            if (data.text) {
              setMessages(prev => {
                const copy = [...prev]
                copy[copy.length - 1] = { role: 'assistant', content: copy[copy.length - 1].content + data.text }
                return copy
              })
            } else if (data.error) {
              throw new Error(data.error)
            }
          } catch (e) { if (e.message && !e.message.includes('Unexpected')) throw e }
        }
      }
    } catch (err) {
      setMessages(prev => {
        const copy = [...prev]
        copy[copy.length - 1] = { role: 'assistant', content: err.message || 'Sorry, I could not reply just now. Please try again or use the Contact page.' }
        return copy
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="w-[calc(100vw-2rem)] max-w-sm bg-white border border-neutral-200 rounded-2xl shadow-xl overflow-hidden flex flex-col" style={{ height: 'min(480px, calc(100vh - 12rem))' }} role="dialog" aria-label="VEW assistant chat">
          <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
            <div>
              <div className="font-semibold text-neutral-900 text-sm">VEW Assistant</div>
              <div className="text-[11px] text-neutral-500">AI-generated answers · for quotes, use Request a Quote</div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="p-2 text-neutral-500 hover:text-neutral-900"><X className="h-5 w-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.role === 'user' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-800'}`}>
                  {m.content || <span className="text-neutral-400">…</span>}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)} className="text-xs border border-neutral-200 rounded-full px-3 py-1.5 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900">{s}</button>
              ))}
            </div>
          )}
          <form onSubmit={e => { e.preventDefault(); send() }} className="p-3 border-t border-neutral-200 flex gap-2">
            <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about gears, quotes…" aria-label="Message" className="flex-1" maxLength={2000} />
            <Button type="submit" disabled={busy || !input.trim()} aria-label="Send" className="rounded-full bg-neutral-900 text-white hover:bg-neutral-700 h-10 w-10 p-0 shrink-0"><Send className="h-4 w-4" /></Button>
          </form>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
        className="h-14 w-14 rounded-full bg-neutral-900 text-white shadow-lg flex items-center justify-center hover:bg-neutral-700"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  )
}
