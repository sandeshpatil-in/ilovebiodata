import { assertNoError, getSupabaseAdmin } from './supabase'
import { generateOtpCode, hashOtp } from './phone'

const OTP_TTL_MS = 10 * 60 * 1000
const MAX_SENDS_PER_HOUR = 5
const MAX_VERIFY_ATTEMPTS = 5

export async function createOtpChallenge(phone) {
  const supabase = getSupabaseAdmin()
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  const { count, error: countError } = await supabase
    .from('otp_challenges')
    .select('id', { count: 'exact', head: true })
    .eq('phone', phone)
    .gte('created_at', since)
  assertNoError(countError)

  if ((count || 0) >= MAX_SENDS_PER_HOUR) {
    const err = new Error('Too many OTP requests. Try again after some time.')
    err.code = 'RATE_LIMIT'
    throw err
  }

  const code = process.env.OTP_DEV_CODE || generateOtpCode()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS).toISOString()

  const { error } = await supabase.from('otp_challenges').insert({
    phone,
    code_hash: hashOtp(code),
    expires_at: expiresAt,
    attempts: 0,
    consumed_at: null,
    created_at: now.toISOString(),
  })
  assertNoError(error)

  return { code, expiresAt }
}

export async function verifyOtpChallenge(phone, code) {
  const supabase = getSupabaseAdmin()
  const { data: rows, error } = await supabase
    .from('otp_challenges')
    .select('id, code_hash, expires_at, attempts, consumed_at')
    .eq('phone', phone)
    .is('consumed_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
  assertNoError(error)

  const challenge = rows?.[0]
  if (!challenge) {
    const err = new Error('OTP not found. Please request a new code.')
    err.code = 'OTP_MISSING'
    throw err
  }

  if (new Date(challenge.expires_at).getTime() < Date.now()) {
    const err = new Error('OTP expired. Please request a new code.')
    err.code = 'OTP_EXPIRED'
    throw err
  }

  if ((challenge.attempts || 0) >= MAX_VERIFY_ATTEMPTS) {
    const err = new Error('Too many wrong attempts. Request a new OTP.')
    err.code = 'OTP_LOCKED'
    throw err
  }

  const ok = challenge.code_hash === hashOtp(code)
  if (!ok) {
    await supabase
      .from('otp_challenges')
      .update({ attempts: (challenge.attempts || 0) + 1 })
      .eq('id', challenge.id)
    const err = new Error('Invalid OTP code.')
    err.code = 'OTP_INVALID'
    throw err
  }

  const { error: consumeError } = await supabase
    .from('otp_challenges')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', challenge.id)
  assertNoError(consumeError)

  return true
}

export async function deliverOtp(phone, code) {
  // Production: plug MSG91/Twilio here later.
  // Local/dev: log OTP so you can test without SMS.
  if (process.env.OTP_DEV_MODE === 'true' || process.env.NODE_ENV !== 'production') {
    console.info(`[otp] DEV code for ${phone}: ${code}`)
    return { delivered: true, mode: 'dev' }
  }

  if (process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) {
    const mobile = phone.replace(/^\+/, '')
    const response = await fetch('https://control.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authkey: process.env.MSG91_AUTH_KEY,
      },
      body: JSON.stringify({
        template_id: process.env.MSG91_TEMPLATE_ID,
        short_url: '0',
        recipients: [{ mobiles: mobile, otp: code }],
      }),
    })
    if (!response.ok) {
      const text = await response.text()
      throw new Error(`MSG91 SMS failed: ${text || response.status}`)
    }
    return { delivered: true, mode: 'msg91' }
  }

  console.info(`[otp] No SMS provider configured. Code for ${phone}: ${code}`)
  return { delivered: true, mode: 'log' }
}
