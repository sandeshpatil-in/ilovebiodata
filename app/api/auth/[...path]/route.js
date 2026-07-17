import { NextResponse } from 'next/server'
import { createSession, destroySession, getCurrentUser } from '@/lib/auth'
import { createOtpChallenge, deliverOtp, verifyOtpChallenge } from '@/lib/otp'
import { normalizeIndianPhone } from '@/lib/phone'
import { upsertPhoneUser } from '@/lib/users'

export const runtime = 'nodejs'

function json(data, init) {
  return NextResponse.json(data, init)
}

async function readBody(req) {
  try {
    return await req.json()
  } catch {
    return {}
  }
}

export async function POST(request, { params }) {
  const { path = [] } = (await params) || {}
  const route = path.join('/')
  const body = await readBody(request)

  if (route === 'otp/send') {
    try {
      const phone = normalizeIndianPhone(body.phone)
      if (!phone) {
        return json({ error: 'Enter a valid 10-digit Indian mobile number' }, { status: 400 })
      }

      const { code } = await createOtpChallenge(phone)
      const delivery = await deliverOtp(phone, code)

      return json({
        ok: true,
        phone,
        message: 'OTP sent successfully',
        // Only expose OTP in explicit local/dev mode for testing.
        ...(process.env.OTP_DEV_MODE === 'true' ? { devCode: code, delivery } : {}),
      })
    } catch (error) {
      console.error('otp/send failed', error)
      const status = error.code === 'RATE_LIMIT' ? 429 : 500
      return json({ error: error.message || 'Failed to send OTP' }, { status })
    }
  }

  if (route === 'otp/verify') {
    try {
      const phone = normalizeIndianPhone(body.phone)
      const code = String(body.code || '').trim()
      if (!phone) {
        return json({ error: 'Enter a valid mobile number' }, { status: 400 })
      }
      if (!/^\d{6}$/.test(code)) {
        return json({ error: 'Enter the 6-digit OTP' }, { status: 400 })
      }

      await verifyOtpChallenge(phone, code)
      const user = await upsertPhoneUser({
        phone,
        name: body.name || '',
      })
      await createSession(user)

      return json({
        ok: true,
        user: {
          id: user._id,
          phone: user.phone,
          name: user.name,
          isPremium: user.isPremium,
        },
      })
    } catch (error) {
      console.error('otp/verify failed', error)
      const status = ['OTP_INVALID', 'OTP_EXPIRED', 'OTP_MISSING', 'OTP_LOCKED'].includes(error.code)
        ? 400
        : 500
      return json({ error: error.message || 'OTP verification failed' }, { status })
    }
  }

  if (route === 'logout') {
    await destroySession()
    return json({ ok: true })
  }

  return json({ error: 'Not found' }, { status: 404 })
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return json({ user: null })
  return json({
    user: {
      id: user._id,
      phone: user.phone,
      name: user.name,
      isPremium: user.isPremium,
    },
  })
}
