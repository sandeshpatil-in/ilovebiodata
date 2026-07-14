import NextAuth from "next-auth"
import authConfig from "./auth.config"
import { query } from "./lib/db"
import { v4 as uuidv4 } from "uuid"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const email = user.email
          if (!email) return false

          const name = user.name || ""
          const image = user.image || ""
          const googleId = user.id || null

          // Check if user exists
          const existing = await query("SELECT * FROM users WHERE email = ?", [email])
          if (existing && existing.length > 0) {
            // Update existing user
            await query(
              "UPDATE users SET name = ?, image = ?, google_id = ?, updated_at = NOW() WHERE email = ?",
              [name, image, googleId, email]
            )
          } else {
            // Create new user
            const userId = uuidv4()
            await query(
              "INSERT INTO users (id, google_id, name, email, image, is_premium, premium_expiry, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, NULL, NOW(), NOW())",
              [userId, googleId, name, email, image]
            )
          }
          return true
        } catch (e) {
          console.error("Error saving user to DB during sign in", e)
          return true
        }
      }
      return true
    },
    async jwt({ token }) {
      if (token.email) {
        try {
          const rows = await query("SELECT * FROM users WHERE email = ?", [token.email])
          if (rows && rows.length > 0) {
            const dbUser = rows[0]
            token.id = dbUser.id
            token.isPremium = Boolean(dbUser.is_premium)
            token.picture = dbUser.image
          }
        } catch (e) {
          console.error("Error fetching user in jwt callback", e)
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id
        session.user.isPremium = token.isPremium
        session.user.image = token.picture
      }
      return session
    },
  },
})
