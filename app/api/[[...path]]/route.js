import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

const MONGO_URL = process.env.MONGO_URL
const DB_NAME = process.env.DB_NAME || 'vew_gears'
const SECRET = process.env.AUTH_SECRET || 'vew-gears-secret-2026'

let client, db
async function getDb() {
  if (db) return db
  client = new MongoClient(MONGO_URL)
  await client.connect()
  db = client.db(DB_NAME)
  await ensureSeed(db)
  return db
}
function json(data, s = 200) { return NextResponse.json(data, { status: s }) }

// === Auth utilities ===
function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(pw, salt, 64).toString('hex')
  return `${salt}:${hash}`
}
function verifyPassword(pw, stored) {
  if (!stored) return false
  const [salt, hash] = stored.split(':')
  const test = crypto.scryptSync(pw, salt, 64).toString('hex')
  return crypto.timingSafeEqual(Buffer.from(test), Buffer.from(hash))
}
function signToken(payload) {
  const data = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString('base64url')
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url')
  return `${data}.${sig}`
}
function verifyToken(token) {
  if (!token) return null
  const [data, sig] = token.split('.')
  if (!data || !sig) return null
  const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url')
  if (sig !== expected) return null
  try { return JSON.parse(Buffer.from(data, 'base64url').toString()) } catch { return null }
}
async function getAuthUser(request, db) {
  const auth = request.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  const p = verifyToken(token)
  if (!p?.userId) return null
  const u = await db.collection('users').findOne({ id: p.userId })
  if (!u) return null
  const { passwordHash, _id, ...safe } = u
  return safe
}

// === Constants ===
const PRODUCTION_STAGES = ['Raw Material','Drawing','Turning','Gear Cutting','Heat Treatment','Jig Boring','Lapping','Sand Blasting','Grinding','Dispatched']
const RFQ_STATUSES = ['Submitted','Under Review','Engineering Review','Need More Information','Quote Prepared','Quote Sent','Customer Approved','Order Confirmed','In Production','Quality Inspection','Ready to Ship','Shipped','Completed','Cancelled']

// === Mock email ===
function mockSendEmail({ to, subject, body }) {
  const line = `\n📧 MOCKED EMAIL → to: ${to} | subject: "${subject}"\n   ${body}\n`
  console.log(line)
  return { mocked: true, to, subject }
}

// === Seed ===
async function ensureSeed(db) {
  const s = await db.collection('_meta').findOne({ key: 'seeded_v2' })
  if (s) return
  const now = new Date().toISOString()

  // Admin user
  const existing = await db.collection('users').findOne({ email: 'admin@vew.com' })
  if (!existing) {
    await db.collection('users').insertOne({
      id: uuidv4(), fullName: 'VEW Admin', companyName: 'Vijaya Engineering Works',
      email: 'admin@vew.com', passwordHash: hashPassword('admin123'), role: 'admin',
      isActive: true, createdAt: now,
    })
  }

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
  await db.collection('_meta').insertOne({ key: 'seeded_v2', at: now })
}

async function generateRfqNumber(db) {
  const year = new Date().getFullYear()
  const count = await db.collection('rfqs').countDocuments({ year })
  return `RFQ-${year}-${String(count + 1).padStart(6, '0')}`
}

function newProductionStages() {
  return PRODUCTION_STAGES.map((name, i) => ({
    id: uuidv4(), name, sequence: i + 1, status: 'NOT_STARTED',
    startedAt: null, completedAt: null, notes: '',
  }))
}

// === HANDLER ===
async function handler(request, ctx) {
  try {
    const db = await getDb()
    const method = request.method
    const p = await ctx.params
    const path = p?.path || []
    const route = path.join('/')

    if (route === '' || route === 'health') return json({ status: 'ok', service: 'VEW API' })

    // ==== AUTH ====
    if (route === 'auth/signup' && method === 'POST') {
      const b = await request.json()
      if (!b.email || !b.password || !b.firstName || !b.lastName) return json({ error: 'Missing fields' }, 400)
      const email = b.email.toLowerCase()
      const exists = await db.collection('users').findOne({ email })
      if (exists) return json({ error: 'Email already registered' }, 400)
      const u = {
        id: uuidv4(), email, passwordHash: hashPassword(b.password),
        firstName: b.firstName, lastName: b.lastName, companyName: b.companyName || '',
        phone: b.phone || '', role: 'customer', isActive: true, createdAt: new Date().toISOString(),
      }
      await db.collection('users').insertOne(u)
      mockSendEmail({ to: email, subject: 'Welcome to Vijaya Engineering Works', body: `Hello ${b.firstName}, your VEW customer account has been created.` })
      const token = signToken({ userId: u.id, role: u.role })
      const { passwordHash, ...safe } = u
      return json({ token, user: safe })
    }

    if (route === 'auth/login' && method === 'POST') {
      const b = await request.json()
      const email = (b.email || '').toLowerCase()
      const u = await db.collection('users').findOne({ email, isActive: true })
      if (!u || !verifyPassword(b.password, u.passwordHash)) return json({ error: 'Invalid email or password' }, 401)
      const token = signToken({ userId: u.id, role: u.role })
      const { passwordHash, _id, ...safe } = u
      return json({ token, user: safe })
    }

    const me = await getAuthUser(request, db)

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
      if (!me || me.role !== 'admin') return json({ error: 'Admin only' }, 403)
      const b = await request.json()
      b.updatedAt = new Date().toISOString()
      await db.collection('cms').updateOne({ key: 'site' }, { $set: b })
      return json({ success: true })
    }

    // ==== RFQ ====
    if (route === 'rfq' && method === 'POST') {
      const b = await request.json()
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
      customer.email = (customer.email || '').toLowerCase()

      const doc = {
        id: uuidv4(), rfqNumber, year: new Date().getFullYear(),
        userId: me?.id || null,
        gearType: b.gearType || '', specifications: b.specifications || {},
        general: b.general || {}, files: b.files || [],
        customer, notes: b.notes || '',
        status: 'Submitted', internalNotes: '', pricing: null, leadTime: '',
        productionStages: newProductionStages(),
        statusHistory: [{ status: 'Submitted', at: now, note: 'RFQ submitted' }],
        messages: [], createdAt: now, updatedAt: now,
      }
      await db.collection('rfqs').insertOne(doc)
      mockSendEmail({
        to: customer.email,
        subject: `RFQ ${rfqNumber} received — Vijaya Engineering Works`,
        body: `Thank you ${customer.firstName || ''}, we have received your RFQ ${rfqNumber} for ${b.gearType}. Our engineering team will review it shortly.`
      })
      const { _id, ...rest } = doc
      return json({ success: true, rfq: rest })
    }

    if (route === 'rfq' && method === 'GET') {
      const url = new URL(request.url)
      const email = url.searchParams.get('email')
      let query = {}
      if (me && me.role === 'customer') {
        // Customer can only see their own (by userId or matching email)
        query = { $or: [{ userId: me.id }, { 'customer.email': me.email }] }
      } else if (me && me.role === 'admin') {
        query = {}
      } else if (email) {
        query = { 'customer.email': email.toLowerCase() }
      } else {
        return json({ error: 'Unauthorized' }, 401)
      }
      const rfqs = await db.collection('rfqs').find(query, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray()
      return json({ rfqs })
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
      return json({ rfq })
    }

    if (route.startsWith('rfq/') && path.length === 2 && method === 'PATCH') {
      if (!me || me.role !== 'admin') return json({ error: 'Admin only' }, 403)
      const id = path[1]
      const body = await request.json()
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
      if (body.internalNotes !== undefined) updates.internalNotes = body.internalNotes
      if (body.pricing !== undefined) updates.pricing = body.pricing
      if (body.leadTime !== undefined) updates.leadTime = body.leadTime
      const op = { $set: updates }
      if (historyAdd.length) op.$push = { statusHistory: { $each: historyAdd } }
      await db.collection('rfqs').updateOne({ id }, op)
      const updated = await db.collection('rfqs').findOne({ id }, { projection: { _id: 0 } })
      return json({ success: true, rfq: updated })
    }

    // Production stage update (admin only)
    if (route.match(/^rfq\/[^/]+\/stage$/) && method === 'PATCH') {
      if (!me || me.role !== 'admin') return json({ error: 'Admin only' }, 403)
      const id = path[1]
      const b = await request.json()
      const rfq = await db.collection('rfqs').findOne({ id })
      if (!rfq) return json({ error: 'Not found' }, 404)
      const stages = rfq.productionStages || newProductionStages()
      const idx = stages.findIndex(s => s.id === b.stageId)
      if (idx < 0) return json({ error: 'Stage not found' }, 404)
      const now = new Date().toISOString()
      const s = stages[idx]
      s.status = b.status
      if (b.status === 'IN_PROGRESS' && !s.startedAt) s.startedAt = now
      if (b.status === 'COMPLETED') s.completedAt = now
      if (b.notes !== undefined) s.notes = b.notes
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
      const msg = { id: uuidv4(), from: b.from || (me?.role === 'admin' ? 'admin' : 'customer'), author: b.author || me?.firstName || 'Customer', text: b.text || '', at: new Date().toISOString() }
      await db.collection('rfqs').updateOne({ id }, { $push: { messages: msg }, $set: { updatedAt: msg.at } })
      return json({ success: true, message: msg })
    }

    // Files
    if (route === 'upload' && method === 'POST') {
      const b = await request.json()
      const saved = []
      for (const f of b.files || []) {
        const doc = { id: uuidv4(), name: f.name, type: f.type, size: f.size, dataUrl: f.dataUrl, uploadedAt: new Date().toISOString() }
        await db.collection('files').insertOne(doc)
        saved.push({ id: doc.id, name: doc.name, type: doc.type, size: doc.size })
      }
      return json({ success: true, files: saved })
    }
    if (route.startsWith('files/') && method === 'GET') {
      const id = path[1]
      const f = await db.collection('files').findOne({ id })
      if (!f) return json({ error: 'Not found' }, 404)
      return json({ id: f.id, name: f.name, type: f.type, size: f.size, dataUrl: f.dataUrl })
    }

    // Admin stats
    if (route === 'admin/stats' && method === 'GET') {
      if (!me || me.role !== 'admin') return json({ error: 'Admin only' }, 403)
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const rfqs = await db.collection('rfqs').find({}).toArray()
      const thisMonth = rfqs.filter(r => r.createdAt >= startOfMonth).length
      const quotesSent = rfqs.filter(r => ['Quote Sent','Customer Approved','Order Confirmed','In Production','Quality Inspection','Ready to Ship','Shipped','Completed'].includes(r.status)).length
      const inProduction = rfqs.filter(r => ['Order Confirmed','In Production','Quality Inspection','Ready to Ship'].includes(r.status)).length
      const totalValue = rfqs.reduce((sum, r) => sum + (r.pricing?.total || 0), 0)
      const stageCounts = {}
      for (const s of PRODUCTION_STAGES) stageCounts[s] = 0
      for (const r of rfqs) {
        for (const st of (r.productionStages || [])) {
          if (st.status === 'IN_PROGRESS') stageCounts[st.name] = (stageCounts[st.name] || 0) + 1
        }
      }
      return json({ total: rfqs.length, thisMonth, quotesSent, inProduction, totalValue, stageCounts })
    }

    return json({ error: 'Not found', route, method }, 404)
  } catch (err) {
    console.error('API error:', err)
    return json({ error: err.message }, 500)
  }
}

export const GET = handler
export const POST = handler
export const PATCH = handler
export const PUT = handler
export const DELETE = handler
