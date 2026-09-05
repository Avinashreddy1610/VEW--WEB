import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { MongoClient } from 'mongodb'
import { createAuthHandler, emailSettings } from '../lib/server/auth.mjs'
import { hashPassword, signToken, safeUser, newToken, roleFor } from '../lib/server/security.mjs'

const require = createRequire(import.meta.url)
const root = new URL('../', import.meta.url)
let server, client, db, route
let messages = []
globalThis.__vewTestClients = []
globalThis.__vewTestAuth = createAuthHandler({ checkEmail: () => {}, deliver: async (user, kind, token) => messages.push({ user: user.id, email: user.email, kind, token }) })
process.env.AUTH_SECRET = 'isolated-test-secret-that-is-at-least-32-characters'
process.env.OWNER_EMAIL = 'avinashreddk@gmail.com'
process.env.DB_NAME = 'vew_isolated_tests'
delete process.env.MONGO_URL
delete process.env.MONGODB_URI

async function loadRoute() {
  let source = await fs.readFile(new URL('app/api/[[...path]]/route.js', root), 'utf8')
  source = source.replace("import { NextResponse } from 'next/server'", 'const NextResponse = Response')
  source = source.replace("import { MongoClient } from 'mongodb'", `import { MongoClient as OriginalClient } from '${pathToFileURL(require.resolve('mongodb')).href}'; class MongoClient extends OriginalClient { constructor(...args) { super(...args); globalThis.__vewTestClients.push(this) } }`)
  source = source.replace("import { v4 as uuidv4 } from 'uuid'", "import { randomUUID as uuidv4 } from 'node:crypto'")
  source = source.replace("import { handleAuth } from '@/lib/server/auth.mjs'", 'const handleAuth = globalThis.__vewTestAuth')
  source = source.replaceAll("'@/lib/server/", `'${new URL('lib/server/', root).href}`)
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
}
async function call(path, method = 'GET', body, token) {
  const request = new Request(`http://localhost/api/${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) })
  const response = await route[method](request, { params: Promise.resolve({ path: path.split('/')[0].includes('?') ? [path.split('?')[0]] : path.split('?')[0].split('/') }) })
  return { status: response.status, body: await response.json() }
}
async function user(id, role = 'customer', overrides = {}) {
  const u = { id, email: `${id}@example.com`, firstName: id, lastName: 'Test', phoneNorm: id, passwordHash: await hashPassword('TestPassword42!'), role, emailVerifiedAt: new Date().toISOString(), isActive: true, sessionVersion: 0, ...overrides }
  await db.collection('users').insertOne(u)
  return { ...u, token: signToken({ userId: u.id, sessionVersion: 0 }) }
}

before(async () => {
  server = await MongoMemoryServer.create({ instance: { ip: '127.0.0.1' } })
  client = await new MongoClient(server.getUri()).connect()
  db = client.db(process.env.DB_NAME)
  route = await loadRoute()
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
test('signup validates inputs and blocks login until an email token is consumed once', async () => {
  assert.equal((await call('auth/signup', 'POST', { email: { $ne: null } })).status, 400)
  const signup = await call('auth/signup', 'POST', { email: 'NEW@example.com', firstName: 'New', lastName: 'Person', phone: '+15550001234', password: 'StrongPass123!' })
  assert.equal(signup.status, 201)
  assert.equal(signup.body.token, undefined)
  assert.equal((await call('auth/login','POST',{ identifier: 'new@example.com', password: 'StrongPass123!' })).body.code, 'EMAIL_NOT_VERIFIED')
  const mail = messages.find(m => m.email === 'new@example.com')
  assert.ok(mail)
  const stored = await db.collection('users').findOne({ id: mail.user })
  assert.notEqual(stored.emailVerificationTokenHash, mail.token)
  const results = await Promise.all([call('auth/verify-email','POST',{token:mail.token}), call('auth/verify-email','POST',{token:mail.token})])
  assert.deepEqual(results.map(r=>r.status).sort(), [200,400])
  const login = await call('auth/login','POST',{identifier:'new@example.com', password:'StrongPass123!'})
  assert.equal(login.status,200)
  assert.ok(login.body.token)
  assert.equal(login.body.user.passwordHash, undefined)
  assert.equal(login.body.user.emailVerificationTokenHash, undefined)
})
test('reset tokens expire, are single-use under concurrency, and revoke sessions', async () => {
  const u = await user('reset-user')
  const forgot = await call('auth/forgot','POST',{identifier:u.email})
  assert.equal(forgot.status,200)
  const token = messages.find(m=>m.user===u.id && m.kind==='reset').token
  const results = await Promise.all([call('auth/reset-password','POST',{token,password:'NewPass123!'}),call('auth/reset-password','POST',{token,password:'OtherPass123!'})])
  assert.deepEqual(results.map(r=>r.status).sort(),[200,400])
  assert.equal((await call('auth/me','GET',undefined,u.token)).status,401)
  assert.equal((await call('auth/login','POST',{identifier:u.email,password:'TestPassword42!'})).status,401)
  const expired = newToken()
  await db.collection('users').updateOne({id:u.id},{$set:{passwordResetTokenHash:expired.hash,passwordResetExpiresAt:new Date(0)}})
  assert.equal((await call('auth/reset-password','POST',{token:expired.token,password:'NewPass123!'})).status,400)
  assert.equal((await call('auth/forgot','POST',{identifier:'missing@example.com'})).body.message,forgot.body.message)
})
test('only the verified configured Gmail owns administration; demo admin and disabled sessions fail', async () => {
  const owner = await user('owner','customer',{ email:process.env.OWNER_EMAIL })
  assert.equal(roleFor(owner),'owner')
  assert.equal(safeUser(owner).role,'owner')
  const legacy = await user('legacy','admin')
  assert.equal((await call('admin/users','GET',undefined,legacy.token)).status,403)
  await db.collection('users').updateOne({id:owner.id},{$set:{isActive:false}})
  assert.equal((await call('auth/me','GET',undefined,owner.token)).status,401)
  await db.collection('users').updateOne({id:owner.id},{$set:{isActive:true}})
})
test('only owner grants/revokes manager access; revocation invalidates manager session', async () => {
  const owner = signToken({userId:'owner',sessionVersion:0})
  const manager = await user('manager')
  assert.equal((await call('admin/managers','POST',{email:manager.email},manager.token)).status,403)
  assert.equal((await call('admin/managers','POST',{email:manager.email},owner)).status,200)
  const token = signToken({userId:manager.id,sessionVersion:1})
  assert.equal((await call('admin/stats','GET',undefined,token)).status,200)
  assert.equal((await call('admin/managers','GET',undefined,token)).status,403)
  assert.equal((await call('admin/users/owner/reset-password','POST',{password:'AnotherPass1!'},token)).status,403)
  assert.equal((await call('admin/users/owner','DELETE',undefined,token)).status,403)
  assert.equal((await call('admin/managers/manager','DELETE',undefined,owner)).status,200)
  assert.equal((await call('admin/stats','GET',undefined,token)).status,403)
})
test('staff can create/update/archive companies; customer cannot write CMS or companies', async () => {
  const manager = await user('staff','manager')
  const customer = await user('visitor')
  assert.equal((await call('admin/companies','POST',{name:'Company'},customer.token)).status,403)
  assert.equal((await call('cms','PATCH',{companyName:'Bad'},customer.token)).status,403)
  assert.equal((await call('admin/companies','POST',{name:'Test Company', email:'contact@example.com'},manager.token)).status,200)
  const list = await call('admin/companies','GET',undefined,manager.token)
  const id = list.body.companies[0].id
  assert.equal((await call(`admin/companies/${id}`,'PATCH',{name:'Edited Company'},manager.token)).status,200)
  assert.equal((await call(`admin/companies/${id}`,'DELETE',undefined,manager.token)).status,200)
  assert.equal((await call('admin/companies','GET',undefined,manager.token)).body.companies.length,0)
  assert.ok((await db.collection('companies').findOne({id})).deletedAt)
})
test('RFQ isolation, file ownership, message authorship, pricing and archive permissions', async () => {
  const customer = await user('rfqcustomer')
  const other = await user('othercustomer')
  const staff = signToken({userId:'staff',sessionVersion:0})
  const file = await call('upload','POST',{files:[{name:'drawing.pdf',dataUrl:'data:application/pdf;base64,JVBERi0='}]},customer.token)
  assert.equal(file.status,200,JSON.stringify(file.body))
  const id = file.body.files[0].id
  const payload = {gearType:'Spur Gear', general:{quantity:'2'},customer:{email:customer.email}, files:[{id}]}
  assert.equal((await call('rfq','POST',payload,other.token)).status,400)
  const result = await call('rfq','POST',payload,customer.token)
  assert.equal(result.status,200,JSON.stringify(result.body))
  const rfq = result.body.rfq
  assert.equal((await call('rfq?email='+customer.email)).status,401)
  assert.equal((await call(`rfq/${rfq.id}`)).status,401)
  assert.equal((await call(`rfq/${rfq.id}`,'GET',undefined,other.token)).status,404)
  assert.equal((await call(`files/${id}`,'GET',undefined,other.token)).status,404)
  assert.equal((await call(`rfq/${rfq.id}/messages`,'POST',{text:'hello',from:'admin',author:'Owner'},customer.token)).body.message.from,'customer')
  assert.equal((await call(`rfq/${rfq.id}`,'PATCH',{internalNotes:'private',pricing:{unitPrice:'12',quantity:2,total:1}},staff)).status,200)
  const view = await call(`rfq/${rfq.id}`,'GET',undefined,customer.token)
  assert.equal(view.body.rfq.internalNotes,undefined)
  assert.equal(view.body.rfq.pricing.total,24)
  assert.equal((await call(`rfq/${rfq.id}`,'PATCH',{status:'fake'},staff)).status,400)
  assert.equal((await call(`rfq/${rfq.id}/stages/reorder`,'PUT',{order:[]},staff)).status,400)
  assert.equal((await call(`rfq/${rfq.id}`,'DELETE',undefined,customer.token)).status,403)
  assert.equal((await call(`rfq/${rfq.id}`,'DELETE',undefined,staff)).status,200)
  assert.equal((await call(`rfq/${rfq.id}`,'GET',undefined,customer.token)).status,404)
})
test('parallel RFQ submissions receive distinct numbers', async () => {
  const token = signToken({userId:'staff',sessionVersion:0})
  const payload = {gearType:'Spur Gear',general:{quantity:'1'},customer:{email:'request@example.com'},files:[]}
  const results = await Promise.all(Array.from({length:5},()=>call('rfq','POST',payload,token)))
  assert.ok(results.every(r=>r.status===200),JSON.stringify(results))
  assert.equal(new Set(results.map(r=>r.body.rfq.rfqNumber)).size,5)
})
test('failed verification delivery is retryable and does not grant a session', async () => {
  const failing = createAuthHandler({checkEmail:()=>{},deliver:async()=>{throw new Error('simulated unavailable provider')}})
  const data = {email:'retry@example.com',firstName:'Retry',lastName:'Test',phone:'+15550909090',password:'RetryPass123!'}
  await assert.rejects(()=>failing('auth/signup',new Request('http://localhost/api/auth/signup',{method:'POST',body:JSON.stringify(data)}),db))
  const stored = await db.collection('users').findOne({email:data.email})
  assert.ok(stored)
  assert.equal(stored.emailVerifiedAt,null)
  assert.equal(stored.emailVerificationTokenHash,undefined)
  assert.equal(stored.emailVerificationSentAt,undefined)
  assert.equal((await call('auth/signup','POST',data)).status,200)
  assert.ok(messages.some(m=>m.email===data.email&&m.kind==='verify'))
})
test('rate limits persist in database and malformed JSON returns 400', async () => {
  for (let i=0;i<12;i++) await call('auth/login','POST',{identifier:'rate@example.com',password:'wrong'})
  assert.equal((await call('auth/login','POST',{identifier:'rate@example.com',password:'wrong'})).status,429)
  const r = await route.POST(new Request('http://localhost/api/auth/signup',{method:'POST',body:'{'}),{params:Promise.resolve({path:['auth','signup']})})
  assert.equal(r.status,400)
})
test('email delivery fails closed when provider or trusted site URL is absent', () => {
  delete process.env.APP_URL; delete process.env.RESEND_API_KEY; delete process.env.EMAIL_FROM
  assert.throws(()=>emailSettings(), {code:'EMAIL_CONFIGURATION'})
})
