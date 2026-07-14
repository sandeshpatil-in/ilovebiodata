import { auth } from "@/auth"
import { query } from "./db"

export const SESSION_COOKIE = "authjs.session-token"

export function sessionCookieOptions() {
  return {}
}

export async function getCurrentUser() {
  try {
    const session = await auth()
    if (!session?.user?.email) return null

    const rows = await query("SELECT * FROM users WHERE email = ?", [session.user.email])
    if (!rows || rows.length === 0) return null

    const row = rows[0]
    return {
      _id: row.id,
      id: row.id,
      google_id: row.google_id,
      name: row.name,
      email: row.email,
      picture: row.image,
      image: row.image,
      isPremium: Boolean(row.is_premium),
      premiumExpiresAt: row.premium_expiry ? new Date(row.premium_expiry) : null,
      createdAt: row.created_at ? new Date(row.created_at) : null,
      updatedAt: row.updated_at ? new Date(row.updated_at) : null,
    }
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
