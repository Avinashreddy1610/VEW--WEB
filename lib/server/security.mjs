import crypto from 'node:crypto'
import { promisify } from 'node:util'
import { readCookie } from './session.mjs'

const scrypt = promisify(crypto.scrypt)
export class HttpError extends Error {
  constructor(status, message, code) { super(message); this.status = status; this.code = code }
}
export const ownerEmail = () => text(process.env.OWNER_EMAIL || 'avinashreddk@gmail.com', 254).toLowerCase()
export function text(value, max = 500) { return typeof value === 'string' ? value.trim().slice(0, max) : '' }
export function email(value) {
  const result = text(value, 254).toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw new HttpError(400, 'Enter a valid email address')
  return result
}
export function password(value) {
  if (typeof value !== 'string' || value.length < 8 || value.length > 128) throw new HttpError(400, 'Password must be between 8 and 128 characters')
  if (/^(password|admin|qwerty|letmein|welcome|123456|111111)/i.test(value) || new Set(value).size < 4) throw new HttpError(400, 'Choose a less predictable password or a long passphrase')
  return value
}
export async function hashPassword(value) {
  const salt = crypto.randomBytes(16).toString('hex')
  return `${salt}:${(await scrypt(value, salt, 64)).toString('hex')}`
}
export async function verifyPassword(value, stored) {
  if (typeof value !== 'string' || value.length > 128 || typeof stored !== 'string') return false
  const [salt, hash] = stored.split(':')
  if (!salt || !/^[a-f0-9]{128}$/.test(hash || '')) return false
  return crypto.timingSafeEqual(await scrypt(value, salt, 64), Buffer.from(hash, 'hex'))
}
export const tokenHash = value => crypto.createHash('sha256').update(value).digest('hex')
export function newToken() { const token = crypto.randomBytes(32).toString('base64url'); return { token, hash: tokenHash(token) } }
export function validToken(value) { return typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value) }
function secret() {
  const result = process.env.AUTH_SECRET
  if (!result || result.length < 32) throw new HttpError(503, 'Sign-in is temporarily unavailable', 'AUTH_CONFIGURATION')
  return result
}
export function signToken(payload) {
  const data = Buffer.from(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 12 * 3600_000 })).toString('base64url')
  return `${data}.${crypto.createHmac('sha256', secret()).update(data).digest('base64url')}`
}
export function verifyToken(token) {
  if (typeof token !== 'string' || token.length > 4096) return null
  const [data, sig, extra] = token.split('.')
  if (!data || !sig || extra || !/^[A-Za-z0-9_-]{43}$/.test(sig)) return null
  const expected = crypto.createHmac('sha256', secret()).update(data).digest('base64url')
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  try { const p = JSON.parse(Buffer.from(data, 'base64url').toString()); return Number.isFinite(p.exp) && p.exp > Date.now() ? p : null } catch { return null }
}
export function roleFor(user) {
  const owner = ownerEmail()
  if (!user?.isActive || !user.emailVerifiedAt) return null
  if (owner && user.email?.toLowerCase() === owner) return 'owner'
  // Legacy demo administrators never inherit owner or manager authority.
  return user.role === 'manager' ? 'manager' : user.role === 'customer' ? 'customer' : null
}
export const isStaff = user => ['owner', 'manager'].includes(user?.role)
export const isOwner = user => user?.role === 'owner'
export function safeUser(user) {
  const keys = ['id','firstName','lastName','fullName','companyName','email','phone','isActive','emailVerifiedAt','createdAt','lastLoginAt']
  return { ...Object.fromEntries(keys.map(key => [key, user[key]])), role: roleFor(user) || (user.email === ownerEmail() ? 'owner' : user.role === 'manager' ? 'manager' : ['admin','owner'].includes(user.role) ? 'disabled' : 'customer') }
}
export function canReadRfq(user, rfq) {
  return !!user && !!rfq && !rfq.deletedAt && (isStaff(user) || rfq.userId === user.id || rfq.customer?.email === user.email)
}
export function safeRfq(rfq, user) {
  const { _id, _requestHash, internalNotes, ...result } = rfq
  if (isStaff(user)) return { ...result, internalNotes }
  return { ...result, productionStages: (result.productionStages || []).map(({ notes, ...stage }) => stage) }
}
export async function getAuthUser(request, db) {
  const payload = verifyToken(readCookie(request))
  if (!payload?.userId) return null
  const user = await db.collection('users').findOne({ id: payload.userId })
  if (!roleFor(user) || payload.sessionVersion !== (user.sessionVersion || 0)) return null
  const result = safeUser(user)
  if (payload.impersonatedBy) {
    const owner = await db.collection('users').findOne({ id: payload.impersonatedBy })
    if (roleFor(owner) !== 'owner' || payload.ownerSessionVersion !== (owner.sessionVersion || 0)) return null
    result._impersonatedBy = owner.email
  }
  return result
}
export async function rateLimit(db, key, limit, windowMs) {
  const slot = Math.floor(Date.now() / windowMs)
  const _id = tokenHash(`${key}:${slot}`)
  let result
  try {
    result = await db.collection('rateLimits').findOneAndUpdate({ _id }, {
      $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((slot + 1) * windowMs) },
    }, { upsert: true, returnDocument: 'after' })
  } catch (error) {
    if (error.code !== 11000) throw error
    result = await db.collection('rateLimits').findOneAndUpdate({ _id }, { $inc: { count: 1 } }, { returnDocument: 'after' })
  }
  if (result.count > limit) throw new HttpError(429, 'Too many attempts. Please try again later.')
}
