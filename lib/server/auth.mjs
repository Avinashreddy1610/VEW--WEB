import { randomUUID } from 'node:crypto'
import { HttpError, text, email, password, hashPassword, verifyPassword, newToken, tokenHash, validToken, signToken, safeUser, roleFor, rateLimit, ownerEmail } from './security.mjs'

export function emailSettings() {
  const { APP_URL, RESEND_API_KEY, EMAIL_FROM } = process.env
  let origin
  try {
    const url = new URL(APP_URL)
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error()
    if (url.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && url.hostname === 'localhost')) throw new Error()
    origin = url.origin
  } catch { throw new HttpError(503, 'Email service is temporarily unavailable', 'EMAIL_CONFIGURATION') }
  if (!RESEND_API_KEY || !EMAIL_FROM || /[\r\n]/.test(EMAIL_FROM)) throw new HttpError(503, 'Email service is temporarily unavailable', 'EMAIL_CONFIGURATION')
  return { origin, key: RESEND_API_KEY, from: EMAIL_FROM }
}
export async function deliverAuthEmail(user, kind, token) {
  const settings = emailSettings()
  // Fragment tokens stay out of access logs and referrer headers.
  const link = `${settings.origin}/#${kind}=${encodeURIComponent(token)}`
  const verify = kind === 'verify'
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST', signal: AbortSignal.timeout(15_000),
    headers: { Authorization: `Bearer ${settings.key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: settings.from, to: [user.email],
      subject: verify ? 'Verify your VEW email address' : 'Reset your VEW password',
      text: `${verify ? 'Verify your email before signing in' : 'Choose a new password'}: ${link}\n\nThis link expires in ${verify ? '24 hours' : '1 hour'}. If you did not request it, ignore this email.`,
    }),
  })
  if (!response.ok) throw new HttpError(503, 'Email could not be sent. Please try again later.', 'EMAIL_DELIVERY')
}

export function createAuthHandler({ deliver = deliverAuthEmail, checkEmail = emailSettings } = {}) {
  async function issue(db, user, kind) {
    checkEmail()
    const prefix = kind === 'verify' ? 'emailVerification' : 'passwordReset'
    const token = newToken()
    const now = new Date()
    const claim = await db.collection('users').findOneAndUpdate({ id: user.id, isActive: true,
      $or: [{ [`${prefix}SentAt`]: { $exists: false } }, { [`${prefix}SentAt`]: { $lt: new Date(Date.now() - 60_000) } }],
    }, { $set: { [`${prefix}TokenHash`]: token.hash, [`${prefix}ExpiresAt`]: new Date(Date.now() + (kind === 'verify' ? 24 : 1) * 3600_000), [`${prefix}SentAt`]: now } }, { returnDocument: 'after' })
    if (!claim) return
    try { await deliver(user, kind, token.token) } catch (error) {
      await db.collection('users').updateOne({ id: user.id, [`${prefix}TokenHash`]: token.hash }, { $unset: { [`${prefix}TokenHash`]: '', [`${prefix}ExpiresAt`]: '', [`${prefix}SentAt`]: '' } })
      throw error
    }
  }
  return async function authHandler(route, request, db) {
    if (!['auth/signup','auth/login','auth/forgot','auth/resend-verification','auth/verify-email','auth/reset-password'].includes(route)) return null
    if (request.method !== 'POST') throw new HttpError(405, 'Method not allowed')
    let body
    try { body = await request.json() } catch { throw new HttpError(400, 'Invalid JSON request') }
    if (!body || Array.isArray(body) || typeof body !== 'object') throw new HttpError(400, 'Invalid request')
    const ip = text(request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for') || 'local', 200).split(',')[0]
    await rateLimit(db, `auth:${ip}`, 60, 15 * 60_000)
    if (route === 'auth/signup') {
      checkEmail()
      const address = email(body.email)
      password(body.password)
      const firstName = text(body.firstName, 100), lastName = text(body.lastName, 100)
      const phone = text(body.phone, 40), phoneNorm = phone.replace(/\D/g, '')
      if (!firstName || !lastName || phoneNorm.length < 6) throw new HttpError(400, 'First name, last name and phone number are required')
      await rateLimit(db, `signup:${address}`, 5, 3600_000)
      const existing = await db.collection('users').findOne({ $or: [{ email: address }, { phoneNorm }] })
      if (existing) {
        if (existing.email === address && existing.isActive && !existing.emailVerifiedAt) {
          await issue(db, existing, 'verify')
          return { status: 200, data: { success: true, message: 'Check your inbox, or use Resend verification after one minute. Your existing password is unchanged.' } }
        }
        throw new HttpError(409, 'An account already uses this email or phone. Sign in or reset your password.')
      }
      const user = { id: randomUUID(), email: address, firstName, lastName, phone, phoneNorm, companyName: text(body.companyName),
        passwordHash: await hashPassword(body.password), role: 'customer', isActive: true, emailVerifiedAt: null, sessionVersion: 0, createdAt: new Date().toISOString() }
      await db.collection('users').insertOne(user)
      await issue(db, user, 'verify')
      return { status: 201, data: { success: true, message: 'Check your email to verify your account before signing in.' } }
    }
    if (route === 'auth/login') {
      const identifier = text(body.identifier || body.email, 254).toLowerCase()
      if (!identifier || typeof body.password !== 'string' || body.password.length > 128) throw new HttpError(400, 'Enter your email or phone and password')
      await rateLimit(db, `login:${identifier}`, 12, 15 * 60_000)
      const user = await db.collection('users').findOne(identifier.includes('@') ? { email: identifier } : { phoneNorm: identifier.replace(/\D/g, '') })
      if (!user?.isActive || !(await verifyPassword(body.password, user.passwordHash))) throw new HttpError(401, 'Invalid credentials or account disabled')
      // Block legacy demo admins even with previously issued passwords.
      const owner = ownerEmail()
      if (['admin','owner'].includes(user.role) && user.email !== owner) throw new HttpError(403, 'This administrator account is no longer enabled')
      if (!user.emailVerifiedAt) throw new HttpError(403, 'Verify your email address before signing in', 'EMAIL_NOT_VERIFIED')
      const role = roleFor(user)
      if (!role) throw new HttpError(403, 'Account access is disabled')
      const lastLoginAt = new Date().toISOString()
      await db.collection('users').updateOne({ id: user.id }, { $set: { lastLoginAt } })
      return { data: { token: signToken({ userId: user.id, sessionVersion: user.sessionVersion || 0 }), user: safeUser({ ...user, lastLoginAt }) } }
    }
    if (['auth/forgot','auth/resend-verification'].includes(route)) {
      checkEmail()
      const identifier = email(body.email || body.identifier)
      await rateLimit(db, `email:${identifier}`, 5, 3600_000)
      const user = await db.collection('users').findOne({ email: identifier, isActive: true })
      const kind = route === 'auth/forgot' ? 'reset' : 'verify'
      if (user && (kind === 'reset' || !user.emailVerifiedAt)) {
        try { await issue(db, user, kind) } catch (error) {
          // Do not reveal account existence through provider failures.
          console.error('Authentication email delivery failed', { code: error.code || 'EMAIL_DELIVERY' })
        }
      }
      return { data: { success: true, message: kind === 'reset' ? 'If an eligible account exists, reset instructions will arrive by email. Please wait one minute before requesting again.' : 'If the account needs verification, instructions will arrive by email. Please wait one minute before requesting again.' } }
    }
    const verify = route === 'auth/verify-email'
    if (!validToken(body.token)) throw new HttpError(400, 'This link is invalid or has expired')
    if (!verify) password(body.password)
    const prefix = verify ? 'emailVerification' : 'passwordReset'
    const update = { $unset: { [`${prefix}TokenHash`]: '', [`${prefix}ExpiresAt`]: '', [`${prefix}SentAt`]: '' } }
    if (verify) update.$set = { emailVerifiedAt: new Date().toISOString() }
    else {
      update.$set = { passwordHash: await hashPassword(body.password), passwordChangedAt: new Date().toISOString() }
      update.$inc = { sessionVersion: 1 }
    }
    // Consumption and account update must be one atomic operation.
    const user = await db.collection('users').findOneAndUpdate({ [`${prefix}TokenHash`]: tokenHash(body.token), [`${prefix}ExpiresAt`]: { $gt: new Date() }, isActive: true }, update, { returnDocument: 'after' })
    if (!user) throw new HttpError(400, 'This link is invalid, already used, or has expired')
    return { data: { success: true, message: verify ? 'Email verified. You can now sign in.' : 'Password updated. Sign in using your new password.' } }
  }
}
export const handleAuth = createAuthHandler()
