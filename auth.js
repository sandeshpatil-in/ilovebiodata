import NextAuth from "next-auth"
import authConfig from "./auth.config"
import { getDb } from "./lib/mongodb"
import { v4 as uuidv4 } from "uuid"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const db = await getDb()
          const now = new Date()
          const email = user.email
          if (!email) return false

          const userDoc = {
            email: email,
            name: user.name || "",
            picture: user.image || "",
            updatedAt: now,
          }

          await db.collection("users").updateOne(
            { email: email },
            {
              $set: userDoc,
              $setOnInsert: {
                _id: uuidv4(),
                isPremium: false,
                createdAt: now,
              },
            },
            { upsert: true }
          )
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
          const db = await getDb()
          const dbUser = await db.collection("users").findOne({ email: token.email })
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
