import { assertNoError, getSupabaseAdmin } from './supabase'
import { v4 as uuidv4 } from 'uuid'

export function toUser(row) {
  if (!row) return null

  return {
    _id: row.id,
    phone: row.phone,
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

const USER_SELECT =
  'id, phone, email, name, picture, is_premium, premium_expires_at, premium_unlocked_at, premium_source, razorpay_payment_id, created_at, updated_at'

export async function findUserById(id) {
  const { data, error } = await getSupabaseAdmin()
    .from('users')
    .select(USER_SELECT)
    .eq('id', id)
    .maybeSingle()
  assertNoError(error)
  return toUser(data)
}

export async function findUserByPhone(phone) {
  const { data, error } = await getSupabaseAdmin()
    .from('users')
    .select(USER_SELECT)
    .eq('phone', phone)
    .maybeSingle()
  assertNoError(error)
  return toUser(data)
}

export async function upsertPhoneUser({ phone, name = '' }) {
  const existing = await findUserByPhone(phone)
  const now = new Date().toISOString()

  if (existing) {
    const { error } = await getSupabaseAdmin()
      .from('users')
      .update({
        name: name || existing.name || '',
        updated_at: now,
      })
      .eq('id', existing._id)
    assertNoError(error)
    return findUserById(existing._id)
  }

  const id = uuidv4()
  const { error } = await getSupabaseAdmin()
    .from('users')
    .insert({
      id,
      phone,
      email: null,
      name: name || '',
      picture: null,
      is_premium: false,
      created_at: now,
      updated_at: now,
    })
  assertNoError(error)
  return findUserById(id)
}
