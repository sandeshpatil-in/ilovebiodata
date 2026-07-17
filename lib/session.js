import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

export const SESSION_COOKIE = 'ilb_session'
const SESSION_DAYS = 30

function sessionSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error('Missing AUTH_SECRET for session cookies')
  }
  return new TextEncoder().encode(secret)
}

export async function createSessionToken(user) {
  return new SignJWT({
    phone: user.phone,
    name: user.name || '',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user._id || user.id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(sessionSecret())
}

export async function readSessionToken(token) {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, sessionSecret())
    return {
      id: payload.sub,
      phone: payload.phone || null,
      name: payload.name || '',
    }
  } catch {
    return null
  }
}

export function sessionCookieOptions() {
  const secure = process.env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  }
}

export async function setSessionCookie(user) {
  const token = await createSessionToken(user)
  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, sessionCookieOptions())
  return token
}

export async function clearSessionCookie() {
  const jar = await cookies()
  jar.set(SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 })
}

export async function getSessionFromCookies() {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  return readSessionToken(token)
}
