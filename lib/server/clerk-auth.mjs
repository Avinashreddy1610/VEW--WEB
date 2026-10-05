// Clerk-backed identity resolution.
//
// Clerk owns identity (sign-in, sessions, email verification, OAuth).
// This module maps a Clerk-authenticated request to the local user record,
// which keeps owning roles, RFQ history, and business data. Local records
// gain `clerkId` on first Clerk sign-in, matched by verified email address.
//
// The resolver accepts injected Clerk accessors so tests can run without
// Clerk credentials: createUserResolver({ getAuthUserId, getClerkProfile }).
import { randomUUID } from 'node:crypto'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { HttpError, text, roleFor, safeUser, signToken, verifyToken } from './security.mjs'
import { readCookie, setSession } from './session.mjs'

export const impersonateCookieName = () =>
  process.env.NODE_ENV === 'production' ? '__Host-vew-impersonate' : 'vew-impersonate'

async function defaultGetAuthUserId() {
  const { userId } = await auth()
  return userId || null
}

async function defaultGetClerkProfile(clerkId) {
  const client = await clerkClient()
  const u = await client.users.getUser(clerkId)
  const primary = u.emailAddresses.find(e => e.id === u.primaryEmailAddressId) || u.emailAddresses[0]
  return {
    email: (primary?.emailAddress || '').toLowerCase(),
    emailVerified: primary?.verification?.status === 'verified',
    firstName: u.firstName || '',
    lastName: u.lastName || '',
  }
}

function publicUser(user) {
  const result = safeUser(user)
  if (user._impersonatedBy) result._impersonatedBy = user._impersonatedBy
  return result
}

export function createUserResolver({ getAuthUserId = defaultGetAuthUserId, getClerkProfile = defaultGetClerkProfile } = {}) {
  async function linkOrCreate(db, clerkId) {
    let user = await db.collection('users').findOne({ clerkId })
    if (user) return user
    const profile = await getClerkProfile(clerkId)
    if (!profile?.email?.includes('@')) return null
    const now = new Date().toISOString()
    user = await db.collection('users').findOne({ email: profile.email })
    if (user) {
      await db.collection('users').updateOne({ id: user.id }, {
        $set: {
          clerkId,
          emailVerifiedAt: user.emailVerifiedAt || (profile.emailVerified ? now : user.emailVerifiedAt),
          lastLoginAt: now,
          ...(user.firstName ? {} : { firstName: text(profile.firstName, 100) }),
          ...(user.lastName ? {} : { lastName: text(profile.lastName, 100) }),
        },
      })
      return { ...user, clerkId }
    }
    const created = {
      id: randomUUID(), clerkId, email: profile.email,
      firstName: text(profile.firstName, 100), lastName: text(profile.lastName, 100),
      phone: '', phoneNorm: '', companyName: '', passwordHash: '',
      role: 'customer', isActive: true,
      emailVerifiedAt: profile.emailVerified ? now : null,
      sessionVersion: 0, createdAt: now, lastLoginAt: now,
    }
    try {
      await db.collection('users').insertOne(created)
    } catch (error) {
      if (error?.code !== 11000) throw error
      const existing = await db.collection('users').findOne({ email: profile.email })
      if (!existing) throw error
      await db.collection('users').updateOne({ id: existing.id }, { $set: { clerkId } })
      return { ...existing, clerkId }
    }
    return created
  }

  // Resolve the request to a local user record (public shape). Returns null
  // when unauthenticated. Throws 403 when the account is disabled.
  async function resolveUser(request, db) {
    // Owner impersonation rides a dedicated HttpOnly cookie, independent of Clerk.
    const impersonation = verifyToken(readCookie(request, impersonateCookieName()))
    if (impersonation?.impersonatedBy && impersonation?.userId) {
      const [target, owner] = await Promise.all([
        db.collection('users').findOne({ id: impersonation.userId }),
        db.collection('users').findOne({ id: impersonation.impersonatedBy }),
      ])
      if (target?.isActive && roleFor(target) && roleFor(owner) === 'owner') {
        return { ...publicUser(target), _impersonatedBy: owner.email }
      }
    }
    let clerkId = null
    try { clerkId = await getAuthUserId(request) } catch { clerkId = null }
    if (!clerkId) return null
    const user = await linkOrCreate(db, clerkId)
    if (!user) return null
    if (!user.isActive || !roleFor(user)) throw new HttpError(403, 'This account has been disabled', 'ACCOUNT_DISABLED')
    await db.collection('users').updateOne({ id: user.id }, { $set: { lastLoginAt: new Date().toISOString() } })
    return publicUser(user)
  }

  function setImpersonation(response, targetUserId, owner) {
    const token = signToken({ userId: targetUserId, impersonatedBy: owner.id })
    return setSession(response, token, impersonateCookieName())
  }

  function clearImpersonation(response) {
    return setSession(response, '', impersonateCookieName())
  }

  return { resolveUser, setImpersonation, clearImpersonation, impersonateCookieName }
}

export const { resolveUser, setImpersonation, clearImpersonation } = createUserResolver()
