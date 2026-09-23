import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readCookie, setSession, sessionName, isSameOriginMutation } from '../lib/server/session.mjs'
test('session transport sets HttpOnly, same-site, host-scoped production cookies', t => {
  const previous = process.env.NODE_ENV
  process.env.NODE_ENV = 'production'
  t.after(() => { if (previous === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous })
  const response = setSession(Response.json({ ok: true }), 'signed.session')
  const cookie = response.headers.get('set-cookie')
  assert.match(cookie, /__Host-vew-session=signed.session/)
  for (const flag of ['HttpOnly','Secure','SameSite=Lax','Path=/']) assert.ok(cookie.includes(flag))
  assert.ok(!cookie.includes('Domain='))
  assert.match(setSession(Response.json({}), '').headers.get('set-cookie'), /Max-Age=0/)
  const request = new Request('https://site.test', { headers: { cookie: `${sessionName()}=signed.session` } })
  assert.equal(readCookie(request), 'signed.session')
  assert.equal(readCookie(new Request('https://site.test', { headers: { cookie: `${sessionName()}=a; ${sessionName()}=b` } })), '')
})
test('mutation guard rejects forms and foreign origins but allows same-origin browser requests', () => {
  const req = headers => new Request('https://site.test/api/rfq', { method: 'POST', headers })
  assert.equal(isSameOriginMutation(req({})), false)
  assert.equal(isSameOriginMutation(req({ 'x-vew-request':'1', origin:'https://evil.test' })), false)
  assert.equal(isSameOriginMutation(req({ 'x-vew-request':'1', origin:'https://site.test', 'sec-fetch-site':'cross-site' })), false)
  assert.equal(isSameOriginMutation(req({ 'x-vew-request':'1', origin:'https://site.test' })), true)
})
