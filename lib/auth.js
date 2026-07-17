import { auth } from "@/auth"
import { findUserByEmail } from "./users"

export const SESSION_COOKIE = "authjs.session-token"

export function sessionCookieOptions() {
  return {}
}

export async function getCurrentUser() {
  try {
    const session = await auth()
    if (!session?.user?.email) return null

    return await findUserByEmail(session.user.email)
  } catch (e) {
    console.error("getCurrentUser error", e)
    return null
  }
}

export async function createSession() {
  return {}
}

export async function destroySession() {
  return {}
}
