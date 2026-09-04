import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'

const MONGO_URL = process.env.MONGO_URL
const DB_NAME = process.env.DB_NAME || 'gear_manufacturing'

let client
let db

async function getDb() {
  if (db) return db
  client = new MongoClient(MONGO_URL)
  await client.connect()
  db = client.db(DB_NAME)
  return db
}

function json(data, status = 200) {
  return NextResponse.json(data, { status })
}

async function generateRfqNumber(db) {
  const year = new Date().getFullYear()
  const count = await db.collection('rfqs').countDocuments({ year })
  const seq = String(count + 1).padStart(6, '0')
  return `RFQ-${year}-${seq}`
}

async function generateOrderNumber(db) {
  const year = new Date().getFullYear()
  const count = await db.collection('orders').countDocuments({ year })
  const seq = String(count + 1).padStart(6, '0')
  return `ORD-${year}-${seq}`
}

const STATUSES = [
  'Submitted','Under Review','Engineering Review','Need More Information',
  'Quote Prepared','Quote Sent','Customer Approved','Order Confirmed',
  'In Production','Quality Inspection','Ready to Ship','Shipped','Completed','Cancelled'
]

async function handler(request, { params }) {
  try {
    const db = await getDb()
    const method = request.method
    const path = params?.path || []
    const route = path.join('/')

    // Health check
    if (route === '' || route === 'health') {
      return json({ status: 'ok', service: 'PrecisionGear API' })
    }

    // === RFQs ===
    if (route === 'rfq' && method === 'POST') {
      const body = await request.json()
      const rfqNumber = await generateRfqNumber(db)
      const now = new Date().toISOString()
      const doc = {
        id: uuidv4(),
        rfqNumber,
        year: new Date().getFullYear(),
        gearType: body.gearType || '',
        specifications: body.specifications || {},
        general: body.general || {},
        files: body.files || [],
        customer: body.customer || {},
        notes: body.notes || '',
        status: 'Submitted',
        internalNotes: '',
        pricing: null,
        leadTime: '',
        statusHistory: [{ status: 'Submitted', at: now, note: 'RFQ submitted by customer' }],
        messages: [],
        createdAt: now,
        updatedAt: now,
      }
      await db.collection('rfqs').insertOne(doc)
      const { _id, ...rest } = doc
      return json({ success: true, rfq: rest })
    }

    if (route === 'rfq' && method === 'GET') {
      const url = new URL(request.url)
      const email = url.searchParams.get('email')
      const query = email ? { 'customer.email': email.toLowerCase() } : {}
      const rfqs = await db.collection('rfqs').find(query, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray()
      return json({ rfqs })
    }

    if (route.startsWith('rfq/') && method === 'GET') {
      const id = path[1]
      const rfq = await db.collection('rfqs').findOne({ $or: [{ id }, { rfqNumber: id }] }, { projection: { _id: 0 } })
      if (!rfq) return json({ error: 'Not found' }, 404)
      return json({ rfq })
    }

    if (route.startsWith('rfq/') && method === 'PATCH') {
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
      }
      if (body.internalNotes !== undefined) updates.internalNotes = body.internalNotes
      if (body.pricing !== undefined) updates.pricing = body.pricing
      if (body.leadTime !== undefined) updates.leadTime = body.leadTime
      const updateOp = { $set: updates }
      if (historyAdd.length) updateOp.$push = { statusHistory: { $each: historyAdd } }
      await db.collection('rfqs').updateOne({ id }, updateOp)
      const updated = await db.collection('rfqs').findOne({ id }, { projection: { _id: 0 } })
      return json({ success: true, rfq: updated })
    }

    // Messages on an RFQ
    if (route.match(/^rfq\/[^/]+\/messages$/) && method === 'POST') {
      const id = path[1]
      const body = await request.json()
      const msg = {
        id: uuidv4(),
        from: body.from || 'customer',
        author: body.author || 'Customer',
        text: body.text || '',
        at: new Date().toISOString(),
      }
      await db.collection('rfqs').updateOne({ id }, { $push: { messages: msg }, $set: { updatedAt: msg.at } })
      return json({ success: true, message: msg })
    }

    // === File upload (base64 stored in Mongo) ===
    if (route === 'upload' && method === 'POST') {
      const body = await request.json()
      const files = body.files || []
      const saved = []
      for (const f of files) {
        const doc = {
          id: uuidv4(),
          name: f.name,
          type: f.type,
          size: f.size,
          dataUrl: f.dataUrl,
          uploadedAt: new Date().toISOString(),
        }
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

    // === Admin stats ===
    if (route === 'admin/stats' && method === 'GET') {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const rfqs = await db.collection('rfqs').find({}).toArray()
      const thisMonth = rfqs.filter(r => r.createdAt >= startOfMonth).length
      const byStatus = {}
      for (const s of STATUSES) byStatus[s] = 0
      for (const r of rfqs) byStatus[r.status] = (byStatus[r.status] || 0) + 1
      const quotesSent = rfqs.filter(r => ['Quote Sent','Customer Approved','Order Confirmed','In Production','Quality Inspection','Ready to Ship','Shipped','Completed'].includes(r.status)).length
      const activeOrders = rfqs.filter(r => ['Order Confirmed','In Production','Quality Inspection','Ready to Ship'].includes(r.status)).length
      const totalValue = rfqs.reduce((sum, r) => sum + (r.pricing?.total || 0), 0)
      return json({
        total: rfqs.length,
        thisMonth,
        quotesSent,
        activeOrders,
        totalValue,
        byStatus,
      })
    }

    // Search
    if (route === 'admin/search' && method === 'GET') {
      const url = new URL(request.url)
      const q = (url.searchParams.get('q') || '').toLowerCase()
      if (!q) return json({ rfqs: [] })
      const all = await db.collection('rfqs').find({}, { projection: { _id: 0 } }).toArray()
      const results = all.filter(r => {
        const hay = [
          r.rfqNumber, r.gearType,
          r.customer?.companyName, r.customer?.email, r.customer?.firstName, r.customer?.lastName,
          r.general?.partName, r.general?.partNumber, r.general?.drawingNumber, r.general?.material,
          r.specifications?.numberOfTeeth, r.specifications?.module
        ].filter(Boolean).join(' ').toLowerCase()
        return hay.includes(q)
      })
      return json({ rfqs: results })
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
