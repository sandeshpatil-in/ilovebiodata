import { auth } from "@/auth"
import { getDb } from "./mongodb"

export const SESSION_COOKIE = "authjs.session-token"

export function sessionCookieOptions() {
  return {}
}

export async function getCurrentUser() {
  try {
    const session = await auth()
    if (!session?.user?.email) return null

    const db = await getDb()
    const user = await db.collection("users").findOne({ email: session.user.email })
    return user
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
