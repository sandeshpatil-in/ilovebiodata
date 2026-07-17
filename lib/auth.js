import { findUserById } from './users'
import { clearSessionCookie, getSessionFromCookies, setSessionCookie } from './session'

export const SESSION_COOKIE = 'ilb_session'

export async function getCurrentUser() {
  try {
    const session = await getSessionFromCookies()
    if (!session?.id) return null
    return await findUserById(session.id)
  } catch (e) {
    console.error('getCurrentUser error', e)
    return null
  }
}

export async function createSession(user) {
  return setSessionCookie(user)
}

export async function destroySession() {
  return clearSessionCookie()
}
