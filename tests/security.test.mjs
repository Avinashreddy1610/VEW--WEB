import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { MongoClient } from 'mongodb'
import { emailSettings } from '../lib/server/auth.mjs'
import { hashPassword, signToken, verifyToken, safeUser, roleFor } from '../lib/server/security.mjs'

const require = createRequire(import.meta.url)
const root = new URL('../', import.meta.url)
let server, client, db, route
process.env.AUTH_SECRET = 'test-secret-that-is-long-enough-for-hmac'
process.env.OWNER_EMAIL = 'owner@example.com'
process.env.DB_NAME = 'vew_isolated_tests'
delete process.env.MONGO_URL
delete process.env.MONGODB_URI

// Test double for lib/server/clerk-auth.mjs: maps the x-test-user-id header to
// a local user via clerkId, and implements the impersonation cookie with the
// real token primitives so the cookie flow is genuinely exercised.
globalThis.__vewTestClerk = {
  resolveUser: async (request, db) => {
    const cookies = (request.headers.get('cookie') || '').split(';').map(s => s.trim())
    const imp = cookies.find(s => s.startsWith('vew-impersonate='))
    if (imp) {
      const payload = verifyToken(imp.slice('vew-impersonate='.length))
      if (payload?.impersonatedBy && payload?.userId) {
        const [target, owner] = await Promise.all([
          db.collection('users').findOne({ id: payload.userId }),
          db.collection('users').findOne({ id: payload.impersonatedBy }),
        ])
        if (target?.isActive && roleFor(target) && roleFor(owner) === 'owner') {
          return { ...safeUser(target), _impersonatedBy: owner.email }
        }
      }
    }
    const clerkId = request.headers.get('x-test-user-id')
    if (!clerkId) return null
    const user = await db.collection('users').findOne({ clerkId })
    if (!user || !user.isActive || !roleFor(user)) return null
    return safeUser(user)
  },
  setImpersonation: (response, targetUserId, owner) => {
    const token = signToken({ userId: targetUserId, impersonatedBy: owner.id })
    response.headers.append('Set-Cookie', `vew-impersonate=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200`)
    return response
  },
  clearImpersonation: (response) => {
    response.headers.append('Set-Cookie', 'vew-impersonate=; Path=/; HttpOnly; Max-Age=0')
    return response
  },
}

async function loadRoute() {
  let source = await fs.readFile(new URL('app/api/[[...path]]/route.js', root), 'utf8')
  source = source.replace("import { NextResponse } from 'next/server'", 'const NextResponse = Response')
  source = source.replace("import { MongoClient } from 'mongodb'", `import { MongoClient as OriginalClient } from '${pathToFileURL(require.resolve('mongodb')).href}'; class MongoClient extends OriginalClient { constructor(...args) { super(...args); globalThis.__vewTestClients.push(this) } }`)
  source = source.replace("import { v4 as uuidv4 } from 'uuid'", "import { randomUUID as uuidv4 } from 'node:crypto'")
  source = source.replace("import { resolveUser, setImpersonation, clearImpersonation } from '@/lib/server/clerk-auth.mjs'", 'const { resolveUser, setImpersonation, clearImpersonation } = globalThis.__vewTestClerk')
  source = source.replace("import { deliverRfqReceipt } from '@/lib/server/business-email.mjs'", 'const deliverRfqReceipt = async rfq => { if (globalThis.__vewReceiptFail) throw new Error("mock failure"); globalThis.__vewReceipts.push(rfq.customer.email); return "mock-email-id" }')
  source = source.replaceAll("'@/lib/server/", `'${new URL('lib/server/', root).href}`)
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
}
async function call(path, method = 'GET', body, token, headers = {}) {
  const request = new Request(`http://localhost/api/${path}`, { method, headers: { 'Content-Type': 'application/json', 'X-VEW-Request': '1', ...(token ? { 'x-test-user-id': token } : {}), ...headers }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) })
  const response = await route[method](request, { params: Promise.resolve({ path: path.split('/')[0].includes('?') ? [path.split('?')[0]] : path.split('?')[0].split('/') }) })
  return { status: response.status, body: await response.json(), cookies: response.headers.getSetCookie() }
}
async function user(id, role = 'customer', overrides = {}) {
  const u = { id, clerkId: `clerk_${id}`, email: `${id}@example.com`, firstName: id, lastName: 'Test', phoneNorm: id, passwordHash: await hashPassword('TestPassword42!'), role, emailVerifiedAt: new Date().toISOString(), isActive: true, sessionVersion: 0, ...overrides }
  await db.collection('users').insertOne(u)
  return { ...u, token: u.clerkId }
}

before(async () => {
  globalThis.__vewTestClients = []
  globalThis.__vewReceipts = []
  server = await MongoMemoryServer.create({ instance: { ip: '127.0.0.1' } })
  client = await new MongoClient(server.getUri()).connect()
  db = client.db(process.env.DB_NAME)
  route = await loadRoute()
  await user('test-owner', 'customer', { email: process.env.OWNER_EMAIL })
})
after(async () => {
  for (const c of globalThis.__vewTestClients) await c.close()
  if (client) await client.close()
  if (server) await server.stop()
})

test('missing database configuration returns a safe 503; corrected config recovers', async () => {
  const missing = await call('health')
  assert.equal(missing.status, 503)
  assert.equal(missing.body.code, 'DATABASE_CONFIGURATION')
  assert.ok(!JSON.stringify(missing).includes('startsWith'))
  process.env.MONGO_URL = server.getUri()
  assert.equal((await call('health')).status, 200)
})

test('Clerk identity resolves to the local user; unknown and disabled accounts are rejected', async () => {
  const u = await user('clerk-link')
  assert.equal((await call('auth/me')).status, 401)
  const me = await call('auth/me', 'GET', undefined, u.token)
  assert.equal(me.status, 200)
  assert.equal(me.body.user.id, u.id)
  assert.equal(me.body.user.role, 'customer')
  assert.equal(me.body.user.passwordHash, undefined)
  assert.equal((await call('auth/me', 'GET', undefined, 'clerk_unknown')).status, 401)
  await db.collection('users').updateOne({ id: u.id }, { $set: { isActive: false } })
  assert.equal((await call('auth/me', 'GET', undefined, u.token)).status, 401)
  await db.collection('users').updateOne({ id: u.id }, { $set: { isActive: true } })
})

test('owner impersonation cookie grants a scoped customer view and exits cleanly', async () => {
  const owner = { id: 'test-owner', email: process.env.OWNER_EMAIL, token: 'clerk_test-owner' }
  const customer = await user('imp-customer')
  const denied = await call(`admin/users/${customer.id}/impersonate`, 'POST', {}, customer.token)
  assert.equal(denied.status, 403)
  const start = await call(`admin/users/${customer.id}/impersonate`, 'POST', {}, owner.token)
  assert.equal(start.status, 200)
  assert.equal(start.body.user._impersonatedBy, owner.email)
  const rawCookie = start.cookies.find(c => c.startsWith('vew-impersonate='))
  assert.ok(rawCookie.includes('HttpOnly'))
  const cookie = rawCookie.split(';')[0]
  const asCustomer = await call('auth/me', 'GET', undefined, undefined, { Cookie: cookie })
  assert.equal(asCustomer.body.user.id, customer.id)
  assert.equal(asCustomer.body.user._impersonatedBy, owner.email)
  // The impersonated customer cannot reach admin routes.
  assert.equal((await call('admin/stats', 'GET', undefined, undefined, { Cookie: cookie })).status, 403)
  const exit = await call('auth/exit-impersonation', 'POST', {}, undefined, { Cookie: cookie })
  assert.equal(exit.status, 200)
  assert.equal(exit.body.user.id, owner.id)
  assert.ok(exit.cookies.some(c => c.includes('Max-Age=0')))
})

test('concurrent identical RFQ and upload retries save exactly once and reject changed payloads', async () => {
  const u = await user('idempotent-rfq')
  const key = { 'Idempotency-Key': 'test-concurrent-rfq-0001' }
  const body = { gearType: 'Spur Gear', general: { quantity: 3 }, customer: { email: u.email }, files: [] }
  const before = globalThis.__vewReceipts.length
  const responses = await Promise.all(Array.from({ length: 8 }, () => call('rfq', 'POST', body, u.token, key)))
  assert.ok(responses.every(r => r.status === 200))
  assert.equal(new Set(responses.map(r => r.body.rfq.id)).size, 1)
  assert.equal(await db.collection('rfqs').countDocuments({ userId: u.id }), 1)
  assert.equal(globalThis.__vewReceipts.length - before, 1)
  assert.equal((await call('rfq', 'POST', { ...body, general: { quantity: 4 } }, u.token, key)).status, 409)
  const files = { files: [{ name: 'drawing.pdf', dataUrl: 'data:application/pdf;base64,JVBERi0=' }] }
  const uploaded = await Promise.all([call('upload', 'POST', files, u.token, key), call('upload', 'POST', files, u.token, key)])
  assert.equal(uploaded[0].body.files[0].id, uploaded[1].body.files[0].id)
  assert.equal(await db.collection('files').countDocuments({ userId: u.id }), 1)
  assert.equal((await call('upload', 'POST', { files: [{ name: 'fake.pdf', dataUrl: 'data:application/pdf;base64,PGh0bWw+' }] }, u.token)).status, 400)
})

test('paged RFQs preserve customer isolation and literal search; invalid limits are rejected', async () => {
  const u = await user('paged-customer')
  await db.collection('rfqs').insertMany(Array.from({ length: 3 }, (_, i) => ({ id: `paging-${i}`, userId: u.id, rfqNumber: `literal[${i}]`, customer: { email: u.email }, createdAt: new Date().toISOString(), productionStages: [] })))
  const first = await call('rfq?limit=2&page=1', 'GET', undefined, u.token)
  const second = await call('rfq?limit=2&page=2', 'GET', undefined, u.token)
  assert.equal(first.body.rfqs.length, 2); assert.equal(first.body.pagination.hasMore, true)
  assert.equal(second.body.rfqs.length, 1); assert.equal(second.body.pagination.hasMore, false)
  assert.equal(new Set([...first.body.rfqs, ...second.body.rfqs].map(r => r.id)).size, 3)
  assert.equal((await call('rfq?limit=100000', 'GET', undefined, u.token)).status, 400)
  assert.equal((await call('rfq?q=%5B1%5D', 'GET', undefined, u.token)).body.rfqs.length, 1)
})

test('only the verified configured Gmail owns administration; demo admin and disabled sessions fail', async () => {
  const owner = { ...(await db.collection('users').findOne({ id: 'test-owner' })), token: 'clerk_test-owner' }
  assert.equal(roleFor(owner), 'owner')
  assert.equal(safeUser(owner).role, 'owner')
  const legacy = await user('legacy', 'admin')
  assert.equal((await call('admin/users', 'GET', undefined, legacy.token)).status, 403)
  await db.collection('users').updateOne({ id: 'test-owner' }, { $set: { isActive: false } })
  assert.equal((await call('auth/me', 'GET', undefined, owner.token)).status, 401)
  await db.collection('users').updateOne({ id: 'test-owner' }, { $set: { isActive: true } })
})

test('only owner grants/revokes manager access; deleted and disabled managers lose access', async () => {
  const owner = { id: 'test-owner', email: process.env.OWNER_EMAIL, token: 'clerk_test-owner' }
  const manager = await user('manager')
  assert.equal((await call('admin/managers', 'POST', { email: manager.email }, manager.token)).status, 403)
  assert.equal((await call('admin/managers', 'POST', { email: manager.email }, owner.token)).status, 200)
  assert.equal((await call('admin/stats', 'GET', undefined, manager.token)).status, 200)
  assert.equal((await call('admin/managers', 'GET', undefined, manager.token)).status, 403)
  assert.equal((await call('admin/users/test-owner/reset-password', 'POST', { password: 'AnotherPass1!' }, manager.token)).status, 404)
  assert.equal((await call('admin/users/manager', 'DELETE', undefined, owner.token)).status, 200)
  assert.equal((await call('admin/stats', 'GET', undefined, manager.token)).status, 403)
})

test('staff can create/update/archive companies; customer cannot write CMS or companies', async () => {
  const manager = await user('staff', 'manager')
  const customer = await user('visitor')
  assert.equal((await call('admin/companies', 'POST', { name: 'Company' }, customer.token)).status, 403)
  assert.equal((await call('cms', 'PATCH', { companyName: 'Bad' }, customer.token)).status, 403)
  assert.equal((await call('admin/companies', 'POST', { name: 'Test Company', email: 'contact@example.com' }, manager.token)).status, 200)
  const list = await call('admin/companies', 'GET', undefined, manager.token)
  const id = list.body.companies[0].id
  assert.equal((await call(`admin/companies/${id}`, 'PATCH', { name: 'Edited Company' }, manager.token)).status, 200)
  assert.equal((await call(`admin/companies/${id}`, 'DELETE', undefined, manager.token)).status, 200)
  assert.equal((await call('admin/companies', 'GET', undefined, manager.token)).body.companies.length, 0)
  assert.ok((await db.collection('companies').findOne({ id })).deletedAt)
})

test('RFQ isolation, file ownership, message authorship, pricing and archive permissions', async () => {
  const customer = await user('rfqcustomer')
  const other = await user('othercustomer')
  const staffUser = await user('staff2', 'manager')
  const file = await call('upload', 'POST', { files: [{ name: 'drawing.pdf', dataUrl: 'data:application/pdf;base64,JVBERi0=' }] }, customer.token)
  assert.equal(file.status, 200, JSON.stringify(file.body))
  const id = file.body.files[0].id
  const payload = { gearType: 'Spur Gear', general: { quantity: '2' }, customer: { email: customer.email }, files: [{ id }] }
  assert.equal((await call('rfq', 'POST', payload, other.token)).status, 400)
  const result = await call('rfq', 'POST', payload, customer.token)
  assert.equal(result.status, 200, JSON.stringify(result.body))
  const rfq = result.body.rfq
  assert.equal(result.body.receiptEmailStatus, 'accepted')
  assert.ok(globalThis.__vewReceipts.includes(customer.email))
  assert.equal((await call('rfq?email=' + customer.email)).status, 401)
  assert.equal((await call(`rfq/${rfq.id}`)).status, 401)
  assert.equal((await call(`rfq/${rfq.id}`, 'GET', undefined, other.token)).status, 404)
  assert.equal((await call(`files/${id}`, 'GET', undefined, other.token)).status, 404)
  assert.equal((await call(`rfq/${rfq.id}/messages`, 'POST', { text: 'hello', from: 'admin', author: 'Owner' }, customer.token)).body.message.from, 'customer')
  assert.equal((await call(`rfq/${rfq.id}`, 'PATCH', { internalNotes: 'private', pricing: { unitPrice: '12', quantity: 2, total: 1 } }, staffUser.token)).status, 200)
  const view = await call(`rfq/${rfq.id}`, 'GET', undefined, customer.token)
  assert.equal(view.body.rfq.internalNotes, undefined)
  assert.equal(view.body.rfq.pricing.total, 24)
  assert.equal((await call(`rfq/${rfq.id}`, 'PATCH', { status: 'fake' }, staffUser.token)).status, 400)
  assert.equal((await call(`rfq/${rfq.id}/stages/reorder`, 'PUT', { order: [] }, staffUser.token)).status, 400)
  assert.equal((await call(`rfq/${rfq.id}`, 'DELETE', undefined, customer.token)).status, 403)
  assert.equal((await call(`rfq/${rfq.id}`, 'DELETE', undefined, staffUser.token)).status, 200)
  assert.equal((await call(`rfq/${rfq.id}`, 'GET', undefined, customer.token)).status, 404)
})

test('parallel RFQ submissions receive distinct numbers', async () => {
  const staffUser = await user('staff3', 'manager')
  const payload = { gearType: 'Spur Gear', general: { quantity: '1' }, customer: { email: 'request@example.com' }, files: [] }
  const results = await Promise.all(Array.from({ length: 5 }, () => call('rfq', 'POST', payload, staffUser.token)))
  assert.ok(results.every(r => r.status === 200), JSON.stringify(results))
  assert.equal(new Set(results.map(r => r.body.rfq.rfqNumber)).size, 5)
})

test('RFQ survives a receipt email failure without asking the customer to resubmit', async () => {
  globalThis.__vewReceiptFail = true
  try {
    const staffUser = await user('staff4', 'manager')
    const r = await call('rfq', 'POST', { gearType: 'Spur Gear', general: { quantity: '1' }, customer: { email: 'receipt@example.com' }, files: [] }, staffUser.token)
    assert.equal(r.status, 200)
    assert.equal(r.body.success, true)
    assert.equal(r.body.receiptEmailStatus, 'failed')
    assert.ok(await db.collection('rfqs').findOne({ id: r.body.rfq.id }))
  } finally { globalThis.__vewReceiptFail = false }
})

test('rate limits persist in database and malformed JSON returns 400', async () => {
  const r = await route.POST(new Request('http://localhost/api/auth/me', { method: 'POST', headers: { 'X-VEW-Request': '1' }, body: '{' }), { params: Promise.resolve({ path: ['auth', 'me'] }) })
  assert.equal(r.status, 400)
})

test('email delivery fails closed when provider or trusted site URL is absent', () => {
  delete process.env.APP_URL; delete process.env.RESEND_API_KEY; delete process.env.EMAIL_FROM
  assert.throws(() => emailSettings(), { code: 'EMAIL_CONFIGURATION' })
})

test('company/order routes use the real API authentication and cannot bypass customer isolation', async () => {
  const staffUser = await user('staff5', 'manager')
  const customer = await user('rfqcustomer2')
  assert.equal((await call('orders')).status, 401)
  assert.equal((await call('admin/companies/unknown/members', 'GET', undefined, customer.token)).status, 403)
  assert.equal((await call('admin/companies', 'POST', { name: 'Bulk route test' }, staffUser.token)).status, 200)
  const company = (await call('companies', 'GET', undefined, staffUser.token)).body.companies.find(c => c.name === 'Bulk route test')
  const created = await call('orders', 'POST', { companyId: company.id, items: [{ name: 'Test gear', quantity: 12 }], internalNotes: 'PRIVATE' }, staffUser.token)
  assert.equal(created.status, 200, JSON.stringify(created.body))
  assert.deepEqual((await call('orders', 'GET', undefined, customer.token)).body.orders, [])
  await db.collection('companyMembers').insertOne({ id: 'route-membership', userId: customer.id, companyId: company.id, status: 'active' })
  const shared = (await call('orders', 'GET', undefined, customer.token)).body.orders
  assert.equal(shared[0].id, created.body.order.id)
  assert.equal(shared[0].internalNotes, undefined)
  assert.equal((await call(`orders/${created.body.order.id}`, 'DELETE', undefined, customer.token)).status, 403)
  assert.equal((await call(`admin/companies/${company.id}/members/route-membership`, 'DELETE', undefined, staffUser.token)).status, 200)
  assert.deepEqual((await call('orders', 'GET', undefined, customer.token)).body.orders, [])
})
