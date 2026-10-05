import { randomUUID, randomBytes } from 'node:crypto'
import { HttpError, text, hashPassword, signToken, verifyToken, rateLimit } from './security.mjs'

function googleSettings() {
  const { APP_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env
  let origin
  try {
    const url = new URL(APP_URL)
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error()
    if (url.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && url.hostname === 'localhost')) throw new Error()
    origin = url.origin
  } catch { throw new HttpError(503, 'Google sign-in is not configured yet', 'OAUTH_CONFIGURATION') }
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || /[\r\n]/.test(GOOGLE_CLIENT_ID)) {
    throw new HttpError(503, 'Google sign-in is not configured yet', 'OAUTH_CONFIGURATION')
  }
  return { origin, clientId: GOOGLE_CLIENT_ID, clientSecret: GOOGLE_CLIENT_SECRET, redirectUri: `${origin}/api/auth/google/callback` }
}

export function googleAuthUrl() {
  const settings = googleSettings()
  const state = signToken({ nonce: randomUUID(), provider: 'google' })
  const params = new URLSearchParams({
    client_id: settings.clientId,
    redirect_uri: settings.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

async function exchangeCode(code, settings) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', signal: AbortSignal.timeout(15_000),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: settings.clientId, client_secret: settings.clientSecret,
      redirect_uri: settings.redirectUri, grant_type: 'authorization_code',
    }).toString(),
  })
  if (!response.ok) throw new HttpError(400, 'Google sign-in failed. Please try again.', 'OAUTH_EXCHANGE')
  const data = await response.json()
  if (!data.access_token) throw new HttpError(400, 'Google sign-in failed. Please try again.', 'OAUTH_EXCHANGE')
  return data.access_token
}

async function fetchGoogleProfile(accessToken) {
  const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    signal: AbortSignal.timeout(15_000),
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) throw new HttpError(400, 'Google sign-in failed. Please try again.', 'OAUTH_PROFILE')
  const profile = await response.json()
  const address = typeof profile.email === 'string' ? profile.email.trim().toLowerCase() : ''
  if (!address || !address.includes('@') || profile.verified_email !== true) {
    throw new HttpError(400, 'Google could not verify an email address for this account.', 'OAUTH_EMAIL')
  }
  return { email: address, firstName: text(profile.given_name, 100), lastName: text(profile.family_name, 100) }
}

export async function handleGoogleCallback(request, db) {
  const settings = googleSettings()
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = verifyToken(url.searchParams.get('state'))
  if (!code || !state || state.provider !== 'google' || !state.nonce) {
    throw new HttpError(400, 'Google sign-in was interrupted. Please try again.', 'OAUTH_STATE')
  }
  const ip = text(request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for') || 'local', 200).split(',')[0]
  await rateLimit(db, `oauth:${ip}`, 20, 15 * 60_000)
  const accessToken = await exchangeCode(code, settings)
  const profile = await fetchGoogleProfile(accessToken)

  const now = new Date().toISOString()
  let user = await db.collection('users').findOne({ email: profile.email })
  if (user) {
    if (!user.isActive) throw new HttpError(403, 'This account has been disabled', 'ACCOUNT_DISABLED')
    const update = { $set: { lastLoginAt: now } }
    if (!user.emailVerifiedAt) update.$set.emailVerifiedAt = now
    if (!user.firstName && profile.firstName) update.$set.firstName = profile.firstName
    if (!user.lastName && profile.lastName) update.$set.lastName = profile.lastName
    await db.collection('users').updateOne({ id: user.id }, update)
    user = { ...user, ...update.$set }
  } else {
    user = {
      id: randomUUID(), email: profile.email,
      firstName: profile.firstName, lastName: profile.lastName,
      phone: '', phoneNorm: '', companyName: '',
      // Random unusable password: Google users sign in with Google, never this.
      passwordHash: await hashPassword(randomBytes(48).toString('hex')),
      role: 'customer', isActive: true, emailVerifiedAt: now,
      sessionVersion: 0, createdAt: now, lastLoginAt: now, oauthProvider: 'google',
    }
    try {
      await db.collection('users').insertOne(user)
    } catch (error) {
      if (error?.code === 11000) {
        // Another request created this account concurrently; fall back to it.
        user = await db.collection('users').findOne({ email: profile.email })
        if (!user || !user.isActive) throw new HttpError(403, 'This account has been disabled', 'ACCOUNT_DISABLED')
      } else throw error
    }
  }
  return { token: signToken({ userId: user.id, sessionVersion: user.sessionVersion || 0 }), user }
}
