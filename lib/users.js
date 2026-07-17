import { assertNoError, getSupabaseAdmin } from './supabase'

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
  const { data, error } = await getSupabaseAdmin()
    .from('users')
    .select('id, email, name, picture, is_premium, premium_expires_at, premium_unlocked_at, premium_source, razorpay_payment_id, created_at, updated_at')
    .eq('email', email)
    .maybeSingle()

  assertNoError(error)
  return toUser(data)
}

export async function upsertGoogleUser({ id, email, name, picture }) {
  const supabase = getSupabaseAdmin()
  const now = new Date().toISOString()
  const existing = await findUserByEmail(email)

  if (existing) {
    const { error } = await supabase
      .from('users')
      .update({
        name,
        picture,
        updated_at: now,
      })
      .eq('email', email)

    assertNoError(error)
    return
  }

  const { error } = await supabase
    .from('users')
    .insert({
      id,
      email,
      name,
      picture,
      is_premium: false,
      created_at: now,
      updated_at: now,
    })

  // Concurrent first-time sign-ins can race on the unique email constraint.
  if (error?.code === '23505') {
    const { error: updateError } = await supabase
      .from('users')
      .update({
        name,
        picture,
        updated_at: now,
      })
      .eq('email', email)

    assertNoError(updateError)
    return
  }

  assertNoError(error)
}
