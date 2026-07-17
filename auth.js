import NextAuth from "next-auth"
import authConfig from "./auth.config"
import { findUserByEmail, upsertGoogleUser } from "./lib/users"
import { v4 as uuidv4 } from "uuid"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const email = user.email
          if (!email) return false

          await upsertGoogleUser({
            id: uuidv4(),
            email,
            name: user.name || "",
            picture: user.image || "",
          })
          return true
        } catch (e) {
          console.error("Error saving user to DB during sign in", e)
          return false
        }
      }
      return true
    },
    async jwt({ token }) {
      if (token.email) {
        try {
          const dbUser = await findUserByEmail(token.email)
          if (dbUser) {
            token.id = dbUser._id
            token.isPremium = dbUser.isPremium
            token.picture = dbUser.picture
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
