import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { apiFetch } from '../lib/client-http.mjs'
import { cleanContact, pageTitles, siteDescription } from '../lib/site-content.mjs'

test('placeholder contacts are hidden without replacing genuine business details', () => {
  assert.equal(cleanContact({ email: 'sales@vew.com', phone: '+91 98765 43210' }).email, '')
  assert.equal(cleanContact({ email: 'sales@company.example' }).email, 'sales@company.example')
  assert.ok(pageTitles.portal && pageTitles.contact && siteDescription.length > 80)
})
test('public CMS requests share a short cache; private requests and writes are not cached or retried', async t => {
  let calls = 0
  t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json({ success: true }) })
  const results = await Promise.all([apiFetch('/api/cms'), apiFetch('/api/cms')])
  assert.equal(calls, 1)
  for (const result of results) assert.equal((await result.json()).success, true)
  await apiFetch('/api/cms'); assert.equal(calls, 1)
  await apiFetch('/api/rfq'); await apiFetch('/api/rfq'); assert.equal(calls, 3)
  await apiFetch('/api/cms', { method: 'PATCH' }); await apiFetch('/api/cms'); assert.equal(calls, 5)
})
test('timeouts and disconnected requests give safe actionable messages without automatic resubmission', async t => {
  let calls = 0
  t.mock.method(globalThis, 'fetch', async () => { calls++; throw new DOMException('provider details', 'TimeoutError') })
  await assert.rejects(apiFetch('/api/rfq', { method: 'POST', body: '{}' }), /may have been saved/)
  assert.equal(calls, 1)
})
test('error and not-found pages exist; API keys are not exposed with public environment prefixes', async () => {
  for (const name of ['not-found.js', 'error.js', 'loading.js']) assert.ok((await fs.stat(new URL(`../app/${name}`, import.meta.url))).size > 0)
  const icon = await fs.readFile(new URL('../app/icon.png', import.meta.url))
  assert.equal(icon.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  assert.ok(icon.readUInt32BE(16) >= 48)
  assert.equal(icon.readUInt32BE(16), icon.readUInt32BE(20))
  for (const path of ['app/page.js', 'components/company-orders.jsx', 'components/management-panels.jsx']) {
    const source = await fs.readFile(new URL(`../${path}`, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /NEXT_PUBLIC_(?:MONGO|AUTH_SECRET|RESEND|VERCEL)/)
    assert.doesNotMatch(source, /dangerouslySetInnerHTML/)
  }
})
