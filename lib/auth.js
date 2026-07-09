import { cookies } from 'next/headers'
import { getDb } from './mongodb'
import { v4 as uuidv4 } from 'uuid'

const COOKIE = 'ilb_session'
const TTL_DAYS = 7

export async function createSession(user) {
  const db = await getDb()
  const token = uuidv4()
  const expiresAt = new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000)

  // upsert user by email (Emergent uses email as stable ID)
  const now = new Date()
  const userDoc = {
    email: user.email,
    name: user.name || '',
    picture: user.picture || '',
    emergentId: user.id || user.email,
    updatedAt: now,
  }
  await db.collection('users').updateOne(
    { email: user.email },
    { $set: userDoc, $setOnInsert: { _id: uuidv4(), createdAt: now, isPremium: false } },
    { upsert: true }
  )
  const dbUser = await db.collection('users').findOne({ email: user.email })

  await db.collection('sessions').insertOne({
    _id: uuidv4(),
    token,
    userId: dbUser._id,
    createdAt: now,
    expiresAt,
  })

  return { token, expiresAt, user: dbUser }
}

export function sessionCookieOptions(expiresAt) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  }
}

export const SESSION_COOKIE = COOKIE

export async function getCurrentUser() {
  try {
    const c = await cookies()
    const token = c.get(COOKIE)?.value
    if (!token) return null
    const db = await getDb()
    const s = await db.collection('sessions').findOne({ token })
    if (!s) return null
    if (s.expiresAt && new Date(s.expiresAt) < new Date()) return null
    const user = await db.collection('users').findOne({ _id: s.userId })
    return user
  } catch (e) {
    console.error('getCurrentUser error', e)
    return null
  }
}

export async function destroySession(token) {
  if (!token) return
  const db = await getDb()
  await db.collection('sessions').deleteOne({ token })
}
