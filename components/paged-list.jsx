'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetch } from '@/lib/client-http.mjs'
import { Button } from '@/components/ui/button'

export function usePagedList(url, field, identity, poll = false) {
  const [pageState, setPageState] = useState({ url, identity, page: 1 })
  const page = pageState.url === url && pageState.identity === identity ? pageState.page : 1
  const [result, setResult] = useState({ items: [], error: '', loading: true, hasMore: false })
  const sequence = useRef(0)
  const refresh = useCallback(async () => {
    const current = ++sequence.current
    setResult(prev => ({ ...prev, loading: true }))
    try {
      const response = await apiFetch(`${url}${url.includes('?') ? '&' : '?'}page=${page}&limit=50`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to load records')
      if (current === sequence.current) setResult({ items: data[field] || [], error: '', loading: false, hasMore: !!data.pagination?.hasMore })
    } catch (error) {
      if (current === sequence.current) setResult(prev => ({ ...prev, error: error.message, loading: false }))
    }
  }, [url, field, identity, page])
  useEffect(() => {
    setResult({ items: [], error: '', loading: true, hasMore: false })
    refresh()
    const timer = poll ? setInterval(() => { if (document.visibilityState === 'visible') refresh() }, 30000) : null
    return () => { sequence.current++; if (timer) clearInterval(timer) }
  }, [refresh, poll])
  return { ...result, page, refresh, setPage: value => setPageState({ url, identity, page: value }) }
}
export function ListPager({ list, label = 'records' }) {
  return <div className="space-y-2 my-4">
    {list.error && <p role="alert" className="text-red-700">{list.error} <button className="underline" onClick={list.refresh}>Retry</button></p>}
    <nav aria-label={`${label} pages`} className="flex flex-wrap items-center gap-3">
      <Button variant="outline" disabled={list.loading || list.page <= 1} onClick={() => list.setPage(list.page - 1)}>Previous</Button>
      <span role="status" className="text-sm">{list.loading ? 'Loading…' : `Page ${list.page}`}</span>
      <Button variant="outline" disabled={list.loading || !list.hasMore} onClick={() => list.setPage(list.page + 1)}>Next</Button>
    </nav>
  </div>
}
