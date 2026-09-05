import { randomUUID } from 'node:crypto'
import { HttpError, text, email, isOwner, isStaff, safeUser } from './security.mjs'

async function bodyOf(request) {
  try { const value = await request.json(); if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error(); return value } catch { throw new HttpError(400, 'Invalid request') }
}
export async function handleManagement(route, request, db, me) {
  const method = request.method
  if (route === 'admin/managers' || route.startsWith('admin/managers/')) {
    if (!isOwner(me) || me._impersonatedBy) throw new HttpError(403, 'Only the owner can manage managers')
    if (method === 'GET' && route === 'admin/managers') {
      const users = await db.collection('users').find({ role: 'manager', isActive: true }).toArray()
      return { managers: users.map(safeUser) }
    }
    if (method === 'POST' && route === 'admin/managers') {
      const address = email((await bodyOf(request)).email)
      if (address === me.email) throw new HttpError(400, 'The owner cannot become a manager')
      const user = await db.collection('users').findOne({ email: address })
      if (!user?.isActive || !user.emailVerifiedAt || !['customer','manager'].includes(user.role)) throw new HttpError(400, 'The manager must first create an account and verify their email')
      await db.collection('users').updateOne({ id: user.id, role: { $in: ['customer','manager'] } }, { $set: { role: 'manager', managerAddedBy: me.id, managerAddedAt: new Date().toISOString() }, $inc: { sessionVersion: 1 } })
      return { success: true }
    }
    if (method === 'DELETE' && route.split('/').length === 3) {
      const result = await db.collection('users').updateOne({ id: route.split('/')[2], role: 'manager', email: { $ne: me.email } }, {
        $set: { role: 'customer', managerRemovedAt: new Date().toISOString() }, $inc: { sessionVersion: 1 },
      })
      if (!result.matchedCount) throw new HttpError(404, 'Manager not found')
      return { success: true }
    }
    throw new HttpError(405, 'Method not allowed')
  }
  if (route === 'admin/companies' || route.startsWith('admin/companies/')) {
    if (!isStaff(me)) throw new HttpError(403, 'Staff access required')
    if (method === 'GET' && route === 'admin/companies') return { companies: await db.collection('companies').find({ deletedAt: { $exists: false } }, { projection: { _id: 0 } }).sort({ name: 1 }).toArray() }
    const id = route.split('/')[2]
    if (method === 'DELETE' && id) {
      const result = await db.collection('companies').updateOne({ id, deletedAt: { $exists: false } }, { $set: { deletedAt: new Date().toISOString(), deletedBy: me.id } })
      if (!result.matchedCount) throw new HttpError(404, 'Company not found')
      return { success: true }
    }
    if ((method === 'POST' && !id) || (method === 'PATCH' && id)) {
      const body = await bodyOf(request)
      const data = Object.fromEntries(['name','contactName','email','phone','address','notes'].map(key => [key, text(body[key], key === 'notes' ? 5000 : 500)]))
      if (!data.name) throw new HttpError(400, 'Company name is required')
      if (data.email) data.email = email(data.email)
      data.updatedAt = new Date().toISOString(); data.updatedBy = me.id
      if (id) {
        const result = await db.collection('companies').updateOne({ id, deletedAt: { $exists: false } }, { $set: data })
        if (!result.matchedCount) throw new HttpError(404, 'Company not found')
      } else await db.collection('companies').insertOne({ ...data, id: randomUUID(), createdAt: data.updatedAt })
      return { success: true }
    }
    throw new HttpError(405, 'Method not allowed')
  }
  return null
}
