import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { HttpError, text, email, password, hashPassword, signToken, getAuthUser, isStaff, isOwner, safeUser, safeRfq, canReadRfq, rateLimit, ownerEmail } from '@/lib/server/security.mjs'
import { handleAuth } from '@/lib/server/auth.mjs'
import { handleManagement } from '@/lib/server/management.mjs'
import { handleCompanyOrders } from '@/lib/server/company-orders.mjs'
import { deliverRfqReceipt } from '@/lib/server/business-email.mjs'
import { isSameOriginMutation, readCookie, setSession, sessionName, ownerSessionName } from '@/lib/server/session.mjs'
import { boundedBody, insertOnce, validateUpload } from '@/lib/server/request-safety.mjs'
import { pageQuery, literalSearch } from '@/lib/server/pagination.mjs'

let connection
async function getDb() {
  if (!connection) {
    connection = (async () => {
      const uri = process.env.MONGO_URL || process.env.MONGODB_URI
      if (typeof uri !== 'string' || !/^mongodb(\+srv)?:\/\//.test(uri)) {
        throw new HttpError(503, 'The database connection is not configured. Please contact the site owner.', 'DATABASE_CONFIGURATION')
      }
      const client = new MongoClient(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 8000, socketTimeoutMS: 15000, waitQueueTimeoutMS: 8000 })
      try {
        await client.connect()
        const db = client.db(process.env.DB_NAME || 'vew_gears')
        await ensureSeed(db)
        return db
      } catch (error) { await client.close(); throw error }
    })().catch(error => { connection = null; throw error })
  }
  return connection
}
function json(data, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })
}
function cleanFields(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(Object.entries(value).filter(([key]) => /^[a-zA-Z][a-zA-Z0-9_]{0,60}$/.test(key) && !['constructor','prototype'].includes(key)).slice(0, 80).map(([key, v]) => [key, typeof v === 'number' && Number.isFinite(v) ? String(v) : text(v, 5000)]))
}
function validatedPricing(value) {
  if (!value || typeof value !== 'object') throw new HttpError(400, 'Invalid quote pricing')
  const p = {}
  for (const key of ['unitPrice','quantity','tooling','engineering','shipping','tax']) {
    p[key] = Number(value[key] || 0)
    if (!Number.isFinite(p[key]) || p[key] < 0 || p[key] > 1e9) throw new HttpError(400, 'Pricing values must be valid nonnegative numbers')
  }
  p.total = p.unitPrice * p.quantity + p.tooling + p.engineering + p.shipping + p.tax
  p.paymentTerms = text(value.paymentTerms); p.validity = text(value.validity)
  return p
}
async function ownedFiles(db, me, files = []) {
  if (!Array.isArray(files) || files.length > 5) throw new HttpError(400, 'Invalid attachments')
  const result = []
  for (const file of files) {
    const record = await db.collection('files').findOne({ id: text(file?.id), userId: me.id })
    if (!record) throw new HttpError(400, 'Attachment is unavailable; please upload it again')
    result.push({ id: record.id, name: record.name, type: record.type, size: record.size })
  }
  return result
}

// === Constants ===
const PRODUCTION_STAGES = ['Raw Material','Drawing','Turning','Gear Cutting','Heat Treatment','Jig Boring','Lapping','Sand Blasting','Grinding','Dispatched']
const RFQ_STATUSES = ['Submitted','Under Review','Engineering Review','Need More Information','Quote Prepared','Quote Sent','Customer Approved','Order Confirmed','In Production','Quality Inspection','Ready to Ship','Shipped','Completed','Cancelled']

// Business notifications still require a separately configured workflow.
function mockSendEmail() { return { mocked: true } }

// === Seed ===
function normalizePhone(p) {
  return text(p, 40).replace(/\D/g, '')
}

async function ensureSeed(db) {
  for (const name of ['users','rfqs','files','companies','orders']) await db.collection(name).createIndex({ id: 1 })
  await db.collection('users').createIndex({ phoneNorm: 1 })
  await db.collection('rfqs').createIndex({ userId: 1, deletedAt: 1, createdAt: -1, id: 1 })
  await db.collection('rfqs').createIndex({ 'customer.email': 1, deletedAt: 1, createdAt: -1, id: 1 })
  await db.collection('rfqs').createIndex({ year: 1, rfqNumber: -1 })
  await db.collection('rfqs').createIndex({ 'files.id': 1 })
  await db.collection('companies').createIndex({ deletedAt: 1, name: 1, id: 1 })
  await db.collection('companyMembers').createIndex({ userId: 1, status: 1 })
  await db.collection('companyMembers').createIndex({ companyId: 1 })
  await db.collection('orders').createIndex({ companyId: 1, createdAt: -1 })
  await db.collection('rateLimits').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
  await db.collection('users').createIndex({ email: 1 }, { unique: true })
  const s = await db.collection('_meta').findOne({ key: 'seeded_v2' })
  if (s) return
  const now = new Date().toISOString()

  // Default CMS content
  await db.collection('cms').updateOne({ key: 'site' }, {
    $setOnInsert: {
      key: 'site',
      companyName: 'Vijaya Engineering Works',
      tagline: 'Precision Gears Built to Your Specifications',
      email: 'sales@vew.com',
      phone: '+91 98765 43210',
      address: '15 Industrial Estate, Peenya, Bangalore, KA 560058',
      hours: 'Mon–Sat, 9:00 AM – 6:00 PM IST',
      aboutTitle: 'About Vijaya Engineering Works',
      aboutText: 'For over three decades, Vijaya Engineering Works (VEW) has been a trusted partner to OEMs and MRO customers across aerospace, energy, automotive, and heavy industry. Every gear we produce is built from your drawing and specifications — no catalog parts, no compromises.',
      productDescriptions: {
        'spiral-bevel': 'Precision spiral bevel gears for high-torque, smooth power transmission at angled shafts.',
        'spiral-bevel-pinion': 'Matched spiral bevel pinions manufactured to Gleason and Klingelnberg standards.',
        'helical': 'Ground and cut helical gears delivering high load capacity with quiet operation.',
        'spur': 'Precision spur gears in all module and DP ranges, hardened and ground on request.',
        'gear-sets': 'Fully matched gear sets — lapped, tested, and serialized for guaranteed performance.',
      },
      updatedAt: now,
    }
  }, { upsert: true })

  await db.collection('rfqs').createIndex({ 'customer.email': 1 })
  await db.collection('users').createIndex({ email: 1 }, { unique: true })
  await db.collection('_meta').updateOne({ _id: 'seeded_v2' }, { $set: { key: 'seeded_v2', at: now } }, { upsert: true })
}

async function generateRfqNumber(db) {
  const year = new Date().getFullYear()
  const latest = await db.collection('rfqs').find({ year }).sort({ rfqNumber: -1 }).limit(1).toArray()
  const previous = Number(latest[0]?.rfqNumber?.split('-').pop()) || 0
  try { await db.collection('counters').updateOne({ _id: `rfq-${year}` }, { $max: { value: previous } }, { upsert: true }) }
  catch (error) { if (error.code !== 11000) throw error }
  const counter = await db.collection('counters').findOneAndUpdate({ _id: `rfq-${year}` }, { $inc: { value: 1 } }, { returnDocument: 'after' })
  return `RFQ-${year}-${String(counter.value).padStart(6, '0')}`
}

function newProductionStages() {
  return PRODUCTION_STAGES.map((name, i) => ({
    id: uuidv4(), name, sequence: i + 1, status: 'NOT_STARTED',
    startedAt: null, completedAt: null, notes: '',
  }))
}

// === HANDLER ===
async function dispatchRequest(request, ctx) {
    if (!isSameOriginMutation(request)) throw new HttpError(403, 'Refresh this page and try again from this website', 'REQUEST_ORIGIN')
    if (['POST','PATCH','PUT'].includes(request.method)) await boundedBody(request)
    const db = await getDb()
    const method = request.method
    const p = await ctx.params
    const path = p?.path || []
    const route = path.join('/')

    if (route === '' || route === 'health') { await db.command({ ping: 1 }, { maxTimeMS: 5000 }); return json({ status: 'ok', service: 'VEW API' }) }

    const authentication = await handleAuth(route, request, db)
    if (authentication) {
      const { token, ...data } = authentication.data
      const response = json(data, authentication.status)
      if (token) { setSession(response, token); setSession(response, '', ownerSessionName()) }
      return response
    }
    const me = await getAuthUser(request, db)
    if (route === 'auth/logout' && method === 'POST') {
      let actor = me
      if (readCookie(request, ownerSessionName())) actor = await getAuthUser(new Request(request.url, { headers: { cookie: `${sessionName()}=${readCookie(request, ownerSessionName())}` } }), db)
      if (actor && !actor._impersonatedBy) await db.collection('users').updateOne({ id: actor.id }, { $inc: { sessionVersion: 1 } })
      return setSession(setSession(json({ success: true }), ''), '', ownerSessionName())
    }
    if (route === 'auth/exit-impersonation' && method === 'POST') {
      const token = readCookie(request, ownerSessionName())
      const owner = await getAuthUser(new Request(request.url, { headers: { cookie: `${sessionName()}=${token}` } }), db)
      if (!isOwner(owner) || owner._impersonatedBy) throw new HttpError(403, 'Sign in again as the owner')
      return setSession(setSession(json({ user: owner }), token), '', ownerSessionName())
    }
    if (me && !['GET','HEAD'].includes(method)) await rateLimit(db, `write:${me.id}`, 120, 60000)
    const companyOrders = await handleCompanyOrders(route, request, db, me)
    if (companyOrders) return json(companyOrders)
    const management = await handleManagement(route, request, db, me)
    if (management) return json(management)
    // Deny every nested RFQ/file route unless the caller owns the record or is staff.
    if (route.startsWith('rfq/') || route.startsWith('files/') || route === 'upload') {
      if (!me) return json({ error: 'Please sign in to continue' }, 401)
    }
    if (route.startsWith('rfq/')) {
      const record = await db.collection('rfqs').findOne({ $or: [{ id: path[1] }, { rfqNumber: path[1] }] })
      if (!canReadRfq(me, record)) return json({ error: 'RFQ not found' }, 404)
    }

    if (route === 'auth/me' && method === 'GET') {
      if (!me) return json({ error: 'Unauthorized' }, 401)
      return json({ user: me })
    }

    // ==== CMS (public read, admin write) ====
    if (route === 'cms' && method === 'GET') {
      const doc = await db.collection('cms').findOne({ key: 'site' }, { projection: { _id: 0 } })
      return json({ cms: doc })
    }
    if (route === 'cms' && method === 'PATCH') {
      if (!isStaff(me)) return json({ error: 'Admin only' }, 403)
      const body = await request.json()
      const b = Object.fromEntries(['companyName','tagline','email','phone','address','hours','aboutTitle','aboutText'].filter(k => body[k] !== undefined).map(k => [k, text(body[k], 10000)]))
      if (body.productDescriptions && typeof body.productDescriptions === 'object') {
        b.productDescriptions = Object.fromEntries(['spiral-bevel','spiral-bevel-pinion','helical','spur','gear-sets'].map(k => [k, text(body.productDescriptions[k], 5000)]))
      }
      b.updatedAt = new Date().toISOString()
      await db.collection('cms').updateOne({ key: 'site' }, { $set: b })
      return json({ success: true })
    }

    // ==== RFQ ====
    if (route === 'rfq' && method === 'POST') {
      const b = await request.json()
      if (!me) return json({ error: 'Please create and verify an account before submitting a quote request' }, 401)
      if (!text(b.gearType) || !b.general || !b.customer || !Number.isFinite(Number(b.general.quantity)) || Number(b.general.quantity) <= 0) return json({ error: 'Gear type, positive quantity and customer details are required' }, 400)
      const rfqNumber = await generateRfqNumber(db)
      const now = new Date().toISOString()
      // If authed customer, link to their account
      const customer = b.customer || {}
      if (me && me.role === 'customer') {
        customer.email = me.email
        customer.firstName = me.firstName
        customer.lastName = me.lastName
        customer.companyName = customer.companyName || me.companyName
        customer.phone = customer.phone || me.phone
      }
      customer.email = email(customer.email)

      const doc = {
        id: uuidv4(), rfqNumber, year: new Date().getFullYear(),
        userId: me?.id || null,
        gearType: text(b.gearType), specifications: cleanFields(b.specifications),
        general: cleanFields(b.general), files: await ownedFiles(db, me, b.files),
        customer: { ...cleanFields(customer), email: email(customer.email) }, notes: text(b.notes, 10000),
        status: 'Submitted', internalNotes: '', pricing: null, leadTime: '',
        productionStages: newProductionStages(),
        statusHistory: [{ status: 'Submitted', at: now, note: 'RFQ submitted' }],
        messages: [], createdAt: now, updatedAt: now,
      }
      const inserted = await insertOnce(db.collection('rfqs'), request, me.id, b, doc)
      if (inserted.replayed) return json({ success: true, rfq: safeRfq(inserted.doc, me), receiptEmailStatus: inserted.doc.receiptEmailStatus || 'pending' })
      let receiptEmailStatus = 'accepted'
      try { await deliverRfqReceipt(doc) } catch {
        receiptEmailStatus = 'failed'
        console.error('RFQ receipt email failed', { code: 'EMAIL_DELIVERY', rfqId: doc.id })
      }
      // The request is already saved. Email/provider failures must never invite duplicate orders.
      doc.receiptEmailStatus = receiptEmailStatus
      try { await db.collection('rfqs').updateOne({ id: doc.id }, { $set: { receiptEmailStatus } }) }
      catch { console.error('RFQ receipt status could not be saved', { rfqId: doc.id }) }
      const { _id, ...rest } = doc
      return json({ success: true, rfq: rest, receiptEmailStatus })
    }

    if (route === 'rfq' && method === 'GET') {
      let query = {}
      if (me && me.role === 'customer') {
        // Customer can only see their own (by userId or matching email)
        query = { $or: [{ userId: me.id }, { 'customer.email': me.email }] }
      } else if (isStaff(me)) {
        query = {}
      } else {
        return json({ error: 'Unauthorized' }, 401)
      }
      const params = new URL(request.url).searchParams, q = literalSearch(params.get('q'))
      const groups = { new: ['Submitted'], review: ['Under Review','Engineering Review','Need More Information'], quotes: ['Quote Prepared','Quote Sent'], production: ['Customer Approved','Order Confirmed','In Production','Quality Inspection'], completed: ['Completed'] }
      const conditions = [query, { deletedAt: { $exists: false } }]
      if (q) conditions.push({ $or: ['rfqNumber','gearType','customer.email','customer.companyName','customer.firstName','customer.lastName','general.partName','general.partNumber'].map(k => ({ [k]: { $regex: q, $options: 'i' } })) })
      if (groups[params.get('filter')]) conditions.push({ status: { $in: groups[params.get('filter')] } })
      const { rows, pagination } = await pageQuery(db.collection('rfqs'), { $and: conditions }, request)
      return json({ rfqs: rows.map(r => safeRfq(r, me)), pagination })
    }

    if (route.startsWith('rfq/') && path.length === 2 && method === 'GET') {
      const id = path[1]
      const rfq = await db.collection('rfqs').findOne({ $or: [{ id }, { rfqNumber: id }] }, { projection: { _id: 0 } })
      if (!rfq) return json({ error: 'Not found' }, 404)
      // Access control
      if (me?.role === 'customer' && rfq.userId !== me.id && rfq.customer?.email !== me.email) {
        return json({ error: 'Forbidden' }, 403)
      }
      // Backfill production stages if missing
      if (!rfq.productionStages) {
        rfq.productionStages = newProductionStages()
        await db.collection('rfqs').updateOne({ id: rfq.id }, { $set: { productionStages: rfq.productionStages } })
      }
      return json({ rfq: safeRfq(rfq, me) })
    }

    if (route.startsWith('rfq/') && path.length === 2 && method === 'DELETE') {
      if (!isStaff(me)) return json({ error: 'Staff access required' }, 403)
      await db.collection('rfqs').updateOne({ id: path[1] }, { $set: { deletedAt: new Date().toISOString(), deletedBy: me.id } })
      return json({ success: true })
    }
    if (route.startsWith('rfq/') && path.length === 2 && method === 'PATCH') {
      if (!isStaff(me)) return json({ error: 'Admin only' }, 403)
      const id = path[1]
      const body = await request.json()
      if (body.status && !RFQ_STATUSES.includes(body.status)) return json({ error: 'Invalid RFQ status' }, 400)
      const rfq = await db.collection('rfqs').findOne({ id })
      if (!rfq) return json({ error: 'Not found' }, 404)
      const now = new Date().toISOString()
      const updates = { updatedAt: now }
      const historyAdd = []
      if (body.status && body.status !== rfq.status) {
        updates.status = body.status
        historyAdd.push({ status: body.status, at: now, note: body.statusNote || '' })
        mockSendEmail({
          to: rfq.customer?.email,
          subject: `RFQ ${rfq.rfqNumber} status update: ${body.status}`,
          body: `Hello ${rfq.customer?.firstName || ''}, your RFQ ${rfq.rfqNumber} is now: ${body.status}. Log in to your portal to view details.`
        })
      }
      if (body.internalNotes !== undefined) updates.internalNotes = text(body.internalNotes, 10000)
      if (body.pricing !== undefined) updates.pricing = validatedPricing(body.pricing)
      if (body.leadTime !== undefined) updates.leadTime = text(body.leadTime)
      const op = { $set: updates }
      if (historyAdd.length) op.$push = { statusHistory: { $each: historyAdd } }
      await db.collection('rfqs').updateOne({ id }, op)
      const updated = await db.collection('rfqs').findOne({ id }, { projection: { _id: 0 } })
      return json({ success: true, rfq: updated })
    }

    // Add / Update / Delete production stages (admin only)
    if (route.match(/^rfq\/[^/]+\/stages$/) && method === 'POST') {
      if (!isStaff(me)) return json({ error: 'Admin only' }, 403)
      const id = path[1]
      const b = await request.json()
      if (!text(b.name, 100)) return json({ error: 'Stage name required' }, 400)
      const rfq = await db.collection('rfqs').findOne({ id })
      if (!rfq) return json({ error: 'Not found' }, 404)
      const stages = rfq.productionStages || []
      const newStage = {
        id: uuidv4(), name: text(b.name, 100), sequence: (Number.isFinite(b.afterSequence) ? b.afterSequence + 0.5 : stages.length + 1),
        status: 'NOT_STARTED', startedAt: null, completedAt: null, notes: b.notes || '',
      }
      stages.push(newStage)
      // Re-index sequences to integers 1..N
      stages.sort((a, b) => a.sequence - b.sequence).forEach((s, i) => s.sequence = i + 1)
      await db.collection('rfqs').updateOne({ id }, { $set: { productionStages: stages, updatedAt: new Date().toISOString() } })
      return json({ success: true, stages })
    }

    if (route.match(/^rfq\/[^/]+\/stages\/[^/]+$/) && method === 'PATCH') {
      if (!isStaff(me)) return json({ error: 'Admin only' }, 403)
      const id = path[1], sid = path[3]
      const b = await request.json()
      const rfq = await db.collection('rfqs').findOne({ id })
      if (!rfq) return json({ error: 'Not found' }, 404)
      const stages = rfq.productionStages || []
      const s = stages.find(x => x.id === sid)
      if (!s) return json({ error: 'Stage not found' }, 404)
      if (b.name !== undefined) { if (!text(b.name, 100)) throw new HttpError(400, 'Stage name required'); s.name = text(b.name, 100) }
      if (b.notes !== undefined) s.notes = text(b.notes, 5000)
      await db.collection('rfqs').updateOne({ id }, { $set: { productionStages: stages, updatedAt: new Date().toISOString() } })
      return json({ success: true })
    }

    if (route.match(/^rfq\/[^/]+\/stages\/[^/]+$/) && method === 'DELETE') {
      if (!isStaff(me)) return json({ error: 'Admin only' }, 403)
      const id = path[1], sid = path[3]
      const rfq = await db.collection('rfqs').findOne({ id })
      if (!rfq) return json({ error: 'Not found' }, 404)
      const stages = (rfq.productionStages || []).filter(s => s.id !== sid)
      stages.forEach((s, i) => s.sequence = i + 1)
      await db.collection('rfqs').updateOne({ id }, { $set: { productionStages: stages, updatedAt: new Date().toISOString() } })
      return json({ success: true })
    }

    if (route.match(/^rfq\/[^/]+\/stages\/reorder$/) && method === 'PUT') {
      if (!isStaff(me)) return json({ error: 'Admin only' }, 403)
      const id = path[1]
      const b = await request.json()  // { order: [stageId, stageId, ...] }
      const rfq = await db.collection('rfqs').findOne({ id })
      if (!rfq) return json({ error: 'Not found' }, 404)
      const stages = rfq.productionStages || []
      if (!Array.isArray(b.order) || b.order.length !== stages.length || new Set(b.order).size !== stages.length || b.order.some(id => !stages.some(s => s.id === id))) return json({ error: 'Order must include every stage exactly once' }, 400)
      const stageMap = Object.fromEntries(stages.map(s => [s.id, s]))
      const reordered = (b.order || []).map((sid, i) => stageMap[sid] && ({ ...stageMap[sid], sequence: i + 1 })).filter(Boolean)
      // Include any stages not in the reorder list at the end
      const missing = stages.filter(s => !b.order?.includes(s.id))
      const final = [...reordered, ...missing].map((s, i) => ({ ...s, sequence: i + 1 }))
      await db.collection('rfqs').updateOne({ id }, { $set: { productionStages: final, updatedAt: new Date().toISOString() } })
      return json({ success: true })
    }

    // Production stage update (admin only)
    if (route.match(/^rfq\/[^/]+\/stage$/) && method === 'PATCH') {
      if (!isStaff(me)) return json({ error: 'Admin only' }, 403)
      const id = path[1]
      const b = await request.json()
      const rfq = await db.collection('rfqs').findOne({ id })
      if (!rfq) return json({ error: 'Not found' }, 404)
      const stages = rfq.productionStages || newProductionStages()
      const idx = stages.findIndex(s => s.id === b.stageId)
      if (idx < 0) return json({ error: 'Stage not found' }, 404)
      const now = new Date().toISOString()
      const s = stages[idx]
      if (!['NOT_STARTED','IN_PROGRESS','COMPLETED'].includes(b.status)) return json({ error: 'Invalid stage status' }, 400)
      s.status = b.status
      if (b.status === 'IN_PROGRESS' && !s.startedAt) s.startedAt = now
      if (b.status === 'COMPLETED') s.completedAt = now
      if (b.notes !== undefined) s.notes = text(b.notes, 5000)
      await db.collection('rfqs').updateOne({ id }, { $set: { productionStages: stages, updatedAt: now } })
      // Notify customer on major transitions
      if (['IN_PROGRESS','COMPLETED'].includes(b.status)) {
        mockSendEmail({
          to: rfq.customer?.email,
          subject: `Production update: ${s.name} — RFQ ${rfq.rfqNumber}`,
          body: `Hello ${rfq.customer?.firstName || ''}, the "${s.name}" stage of your RFQ ${rfq.rfqNumber} is now ${b.status.replace('_',' ')}.`
        })
      }
      return json({ success: true, stage: s })
    }

    if (route.match(/^rfq\/[^/]+\/messages$/) && method === 'POST') {
      const id = path[1]
      const b = await request.json()
      if (!text(b.text, 5000)) return json({ error: 'Message is required' }, 400)
      const msg = { id: uuidv4(), from: isStaff(me) ? 'admin' : 'customer', author: me.firstName || 'Staff', text: text(b.text, 5000), at: new Date().toISOString() }
      await db.collection('rfqs').updateOne({ id }, { $push: { messages: msg }, $set: { updatedAt: msg.at } })
      return json({ success: true, message: msg })
    }

    // Files
    if (route === 'upload' && method === 'POST') {
      const b = await request.json()
      const saved = []
      if (!Array.isArray(b.files) || !b.files.length || b.files.length > 5) return json({ error: 'Upload between one and five files' }, 400)
      await rateLimit(db, `upload:${me.id}`, 30, 3600_000)
      let total = 0
      const validated = b.files.map(f => {
        const valid = validateUpload(f)
        total += valid.size
        if (total > 2_500_000) throw new HttpError(400, 'Keep total attachments under 2.5 MB')
        return { ...valid, id: uuidv4(), userId: me.id, uploadedAt: new Date().toISOString() }
      })
      for (const [index, doc] of validated.entries()) {
        const result = await insertOnce(db.collection('files'), request, `${me.id}:${index}`, b.files, doc)
        saved.push({ id: result.doc.id, name: result.doc.name, type: result.doc.type, size: result.doc.size })
      }
      return json({ success: true, files: saved })
    }
    if (route.startsWith('files/') && method === 'GET') {
      const id = path[1]
      const f = await db.collection('files').findOne({ id })
      if (!f) return json({ error: 'Not found' }, 404)
      if (!isStaff(me) && f.userId !== me.id) {
        const linked = await db.collection('rfqs').findOne({ 'files.id': id, deletedAt: { $exists: false }, $or: [{ userId: me.id }, { 'customer.email': me.email }] })
        if (!linked) return json({ error: 'Not found' }, 404)
      }
      return json({ id: f.id, name: f.name, type: f.type, size: f.size, dataUrl: f.dataUrl })
    }

    // ==== ADMIN USER MANAGEMENT ====
    if (route === 'admin/users' && method === 'GET') {
      if (!isStaff(me)) return json({ error: 'Admin only' }, 403)
      const url = new URL(request.url)
      const q = literalSearch(url.searchParams.get('q'))
      const filter = { deletedAt: { $exists: false }, ...(isOwner(me) ? {} : { role: 'customer' }), ...(q ? { $or: ['firstName','lastName','email','phone','companyName'].map(k => ({ [k]: { $regex: q, $options: 'i' } })) } : {}) }
      const { rows, pagination } = await pageQuery(db.collection('users'), filter, request)
      const enriched = await Promise.all(rows.map(async u => ({ ...safeUser(u), rfqCount: await db.collection('rfqs').countDocuments({ $or: [{ userId: u.id }, { 'customer.email': u.email }] }, { maxTimeMS: 8000 }) })))
      return json({ users: enriched, pagination })
    }

    if (route.match(/^admin\/users\/[^/]+$/) && ['PATCH','DELETE'].includes(method)) {
      if (!isStaff(me)) throw new HttpError(403, 'Staff access required')
      const targetId = path[2]
      if (targetId === me.id) throw new HttpError(403, 'You cannot change your own account here')
      // Owners may edit/remove any account (including managers); managers may only touch customers.
      const target = { id: targetId, email: { $ne: ownerEmail() }, ...(isOwner(me) ? {} : { role: 'customer' }) }
      const update = method === 'DELETE'
        ? { $set: { isActive: false, deletedAt: new Date().toISOString(), deletedBy: me.id }, $inc: { sessionVersion: 1 } }
        : { $set: Object.fromEntries(['firstName','lastName','companyName','phone'].map(k => [k, ''])) }
      if (method === 'PATCH') {
        const body = await request.json()
        update.$set = Object.fromEntries(['firstName','lastName','companyName','phone'].filter(k => body[k] !== undefined).map(k => [k, text(body[k], 500)]))
        if (body.phone !== undefined) update.$set.phoneNorm = normalizePhone(body.phone)
      }
      const result = await db.collection('users').updateOne(target, update)
      if (!result.matchedCount) throw new HttpError(403, 'This account cannot be changed here')
      return json({ success: true })
    }

    if (route.match(/^admin\/users\/[^/]+\/toggle$/) && method === 'PATCH') {
      if (!isStaff(me)) return json({ error: 'Admin only' }, 403)
      const id = path[2]
      const u = await db.collection('users').findOne({ id })
      if (!u) return json({ error: 'Not found' }, 404)
      if (id === me.id || u.email === ownerEmail()) return json({ error: 'This account cannot be disabled here' }, 403)
      if (!isOwner(me) && u.role !== 'customer') return json({ error: 'Only customer accounts can be changed here' }, 403)
      const changed = await db.collection('users').updateOne({ id, email: { $ne: ownerEmail() }, ...(isOwner(me) ? {} : { role: 'customer' }) }, { $set: { isActive: !u.isActive }, $inc: { sessionVersion: 1 } })
      if (!changed.matchedCount) throw new HttpError(403, 'Account role changed; refresh and try again')
      return json({ success: true, isActive: !u.isActive })
    }

    if (route.match(/^admin\/users\/[^/]+\/reset-password$/) && method === 'POST') {
      if (!isStaff(me)) return json({ error: 'Admin only' }, 403)
      const id = path[2]
      const b = await request.json()
      if (!b.password || b.password.length < 8) return json({ error: 'Password must be at least 8 characters' }, 400)
      const u = await db.collection('users').findOne({ id })
      if (!u) return json({ error: 'Not found' }, 404)
      if (u.role !== 'customer' || u.email === ownerEmail()) return json({ error: 'Staff passwords must be reset by email' }, 403)
      const changed = await db.collection('users').updateOne({ id, role: 'customer', email: { $ne: ownerEmail() } }, {
        $set: { passwordHash: await hashPassword(password(b.password)) }, $inc: { sessionVersion: 1 },
        $unset: { passwordResetTokenHash: '', passwordResetExpiresAt: '', passwordResetSentAt: '' },
      })
      if (!changed.matchedCount) throw new HttpError(403, 'Account role changed; refresh and try again')
      mockSendEmail({ to: u.email, subject: 'VEW · Password reset by admin', body: `Your VEW account password has been reset by an administrator.` })
      return json({ success: true })
    }

    if (route.match(/^admin\/users\/[^/]+\/impersonate$/) && method === 'POST') {
      if (!isStaff(me)) return json({ error: 'Admin only' }, 403)
      const id = path[2]
      const u = await db.collection('users').findOne({ id })
      if (!u) return json({ error: 'Not found' }, 404)
      if (!isOwner(me) || me._impersonatedBy || u.role !== 'customer' || u.email === me.email || !u.emailVerifiedAt || !u.isActive) return json({ error: 'Only the owner may view verified customer accounts' }, 403)
      const token = signToken({ userId: u.id, role: u.role, sessionVersion: u.sessionVersion || 0, ownerSessionVersion: (await db.collection('users').findOne({ id: me.id })).sessionVersion || 0, impersonatedBy: me.id, impersonatedByEmail: me.email })
      const safe = safeUser(u)
      return setSession(setSession(json({ user: { ...safe, _impersonatedBy: me.email }, impersonating: true }), token), readCookie(request), ownerSessionName())
    }

    // Admin stats
    if (route === 'admin/stats' && method === 'GET') {
      if (!isStaff(me)) return json({ error: 'Admin only' }, 403)
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const aggregate = await db.collection('rfqs').aggregate([
        { $match: { deletedAt: { $exists: false } } },
        { $facet: {
          totals: [{ $group: { _id: null, total: { $sum: 1 },
            thisMonth: { $sum: { $cond: [{ $gte: ['$createdAt', startOfMonth] }, 1, 0] } },
            quotesSent: { $sum: { $cond: [{ $in: ['$status', ['Quote Sent','Customer Approved','Order Confirmed','In Production','Quality Inspection','Ready to Ship','Shipped','Completed']] }, 1, 0] } },
            inProduction: { $sum: { $cond: [{ $in: ['$status', ['Order Confirmed','In Production','Quality Inspection','Ready to Ship']] }, 1, 0] } },
            totalValue: { $sum: { $convert: { input: '$pricing.total', to: 'double', onError: 0, onNull: 0 } } }
          } }],
          stages: [{ $unwind: '$productionStages' }, { $match: { 'productionStages.status': 'IN_PROGRESS' } }, { $group: { _id: '$productionStages.name', count: { $sum: 1 } } }]
        } }
      ], { maxTimeMS: 8000 }).next()
      const { _id, ...totals } = aggregate.totals[0] || { total: 0, thisMonth: 0, quotesSent: 0, inProduction: 0, totalValue: 0 }
      const stageCounts = Object.fromEntries(PRODUCTION_STAGES.map(s => [s, 0]))
      for (const stage of aggregate.stages) stageCounts[stage._id] = stage.count
      return json({ ...totals, stageCounts })
    }

    return json({ error: 'Not found', route, method }, 404)
}

// Keep response/error translation separate from request validation and dispatch.
async function handler(request, ctx) {
  try {
    return await dispatchRequest(request, ctx)
  } catch (err) {
    const code = err.code
    if (err instanceof HttpError) return json({ error: err.message, code: err.code }, err.status)
    if (err instanceof SyntaxError) return json({ error: 'Invalid request body' }, 400)
    if (code === 11000) return json({ error: 'This record already exists. Refresh and try again.' }, 409)
    console.error('API request failed', { name: err.name, code })
    return json({ error: 'Service temporarily unavailable. Please try again later.', code: 'SERVICE_UNAVAILABLE' }, 503)
  }
}

export const runtime = 'nodejs'
export const GET = handler
export const POST = handler
export const PATCH = handler
export const PUT = handler
export const DELETE = handler
