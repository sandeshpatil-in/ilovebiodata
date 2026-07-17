import { getPool } from './mysql'

const USER_COLUMNS = `
  id, email, name, picture, is_premium, premium_expires_at,
  premium_unlocked_at, premium_source, razorpay_payment_id,
  created_at, updated_at
`

export function toUser(row) {
  if (!row) return null

  return {
    _id: row.id,
    email: row.email,
    name: row.name,
    picture: row.picture,
    isPremium: Boolean(row.is_premium),
    premiumExpiresAt: row.premium_expires_at,
    premiumUnlockedAt: row.premium_unlocked_at,
    premiumSource: row.premium_source,
    razorpayPaymentId: row.razorpay_payment_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function findUserByEmail(email) {
  const [rows] = await getPool().execute(
    `SELECT ${USER_COLUMNS} FROM users WHERE email = ? LIMIT 1`,
    [email],
  )
  return toUser(rows[0])
}

export async function upsertGoogleUser({ id, email, name, picture }) {
  await getPool().execute(
    `INSERT INTO users (id, email, name, picture, is_premium, created_at, updated_at)
     VALUES (?, ?, ?, ?, FALSE, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       picture = VALUES(picture),
       updated_at = CURRENT_TIMESTAMP(3)`,
    [id, email, name, picture],
  )
}
