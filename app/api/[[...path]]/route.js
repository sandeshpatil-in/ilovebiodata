import { NextResponse } from 'next/server'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import { v4 as uuidv4 } from 'uuid'
import { assertNoError, getSupabaseAdmin, getSupabaseEnvStatus, pingDatabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'

const PREMIUM_AMOUNT = 4900 // ₹49 in paise
const PREMIUM_DURATION_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
const BIODATA_TEMPLATES = new Set(['t1', 't2', 't3'])
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_BIODATA_JSON_BYTES = 8 * 1024 * 1024

function rz() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

function json(data, init) { return NextResponse.json(data, init) }

async function readBody(req) { try { return await req.json() } catch { return {} } }

function toBiodata(row) {
  if (!row) return null
  return {
    _id: row.id,
    userId: row.user_id,
    title: row.title,
    template: row.template,
    data: row.data || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// GET handler
export async function GET(request, { params }) {
  const { path = [] } = (await params) || {}
  const route = path.join('/')

  if (route === 'health' || route === '') {
    return json({ ok: true, service: 'ilovebiodata', ts: Date.now() })
  }

  if (route === 'health/database') {
    const env = getSupabaseEnvStatus()
    try {
      await pingDatabase()
      return json({ ok: true, database: 'connected', ...env, ts: Date.now() })
    } catch (error) {
      console.error('Database health check failed:', error)
      return json(
        {
          ok: false,
          database: 'disconnected',
          ...env,
          error: error.message || 'Database request failed',
          hint: !env.hasUrl
            ? 'Set SUPABASE_URL in Hostinger environment variables.'
            : !env.hasServiceRoleKey && !env.hasAnonKey
              ? 'Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY.'
              : 'Run migrations/001_supabase_schema.sql and migrations/002_hostinger_signin_access.sql in the Supabase SQL Editor.',
          ts: Date.now(),
        },
        { status: 503 },
      )
    }
  }

  if (route === 'auth/me' || route === 'me') {
    const user = await getCurrentUser()
    if (!user) return json({ user: null }, { status: 200 })
    return json({ user: publicUser(user) })
  }

  if (route === 'biodatas') {
    const user = await getCurrentUser()
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 })
    const { data, error } = await getSupabaseAdmin()
      .from('biodatas')
      .select('id, user_id, title, template, data, created_at, updated_at')
      .eq('user_id', user._id)
      .order('updated_at', { ascending: false })
    assertNoError(error)
    return json({ items: (data || []).map(toBiodata) })
  }

  if (route.startsWith('biodatas/')) {
    const id = route.split('/')[1]
    const user = await getCurrentUser()
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 })
    const { data, error } = await getSupabaseAdmin()
      .from('biodatas')
      .select('id, user_id, title, template, data, created_at, updated_at')
      .eq('id', id)
      .eq('user_id', user._id)
      .maybeSingle()
    assertNoError(error)
    const doc = toBiodata(data)
    if (!doc) return json({ error: 'Not found' }, { status: 404 })
    return json({ item: doc })
  }

  // Public share view (no auth) — read-only
  if (route.startsWith('share/')) {
    const id = route.split('/')[1]
    const { data, error } = await getSupabaseAdmin()
      .from('biodatas')
      .select('id, user_id, title, template, data, created_at, updated_at')
      .eq('id', id)
      .maybeSingle()
    assertNoError(error)
    const doc = toBiodata(data)
    if (!doc) return json({ error: 'Not found' }, { status: 404 })
    return json({ item: doc })
  }

  return json({ error: 'Not found' }, { status: 404 })
}

function publicUser(u) {
  if (!u) return null
  const now = Date.now()
  const exp = u.premiumExpiresAt ? new Date(u.premiumExpiresAt).getTime() : 0
  const active = !!u.isPremium && (exp === 0 || exp > now) // exp=0 → lifetime grandfathered
  return {
    id: u._id, email: u.email, name: u.name, picture: u.picture,
    isPremium: active,
    premiumUnlockedAt: u.premiumUnlockedAt,
    premiumExpiresAt: u.premiumExpiresAt || null,
    premiumDaysLeft: exp > now ? Math.ceil((exp - now) / (24 * 60 * 60 * 1000)) : (u.isPremium && exp === 0 ? 9999 : 0),
  }
}

// POST handler
export async function POST(request, { params }) {
  const { path = [] } = (await params) || {}
  const route = path.join('/')
  const body = await readBody(request)

  // ---------- BIODATAS ----------
  if (route === 'biodatas') {
    const user = await getCurrentUser()
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 })
    const now = new Date().toISOString()
    const id = body.id || uuidv4()
    if (!UUID_PATTERN.test(id)) {
      return json({ error: 'Invalid biodata ID' }, { status: 400 })
    }
    const template = body.template || 't1'
    if (!BIODATA_TEMPLATES.has(template)) {
      return json({ error: 'Invalid template' }, { status: 400 })
    }
    const data = body.data || {}
    const serializedData = JSON.stringify(data)
    if (Buffer.byteLength(serializedData, 'utf8') > MAX_BIODATA_JSON_BYTES) {
      return json({ error: 'Biodata is too large' }, { status: 413 })
    }
    const title = ((body.data?.firstName || body.data?.lastName)
      ? `${body.data?.firstName || ''} ${body.data?.lastName || ''}`.trim()
      : 'नवीन बायोडाटा').slice(0, 255)
    const doc = {
      _id: id,
      userId: user._id,
      title,
      template,
      data,
      updatedAt: now,
    }

    const supabase = getSupabaseAdmin()
    const { data: existing, error: existingError } = await supabase
      .from('biodatas')
      .select('id')
      .eq('id', id)
      .eq('user_id', user._id)
      .maybeSingle()
    assertNoError(existingError)

    if (existing) {
      const { error } = await supabase
        .from('biodatas')
        .update({
          title,
          template,
          data,
          updated_at: now,
        })
        .eq('id', id)
        .eq('user_id', user._id)
      assertNoError(error)
    } else {
      const { error } = await supabase
        .from('biodatas')
        .insert({
          id,
          user_id: user._id,
          title,
          template,
          data,
          created_at: now,
          updated_at: now,
        })
      if (error?.code === '23505') {
        return json({ error: 'Biodata ID already exists' }, { status: 409 })
      }
      assertNoError(error)
    }

    return json({ ok: true, id, item: doc })
  }

  if (route.startsWith('biodatas/') && route.endsWith('/delete')) {
    const id = route.split('/')[1]
    const user = await getCurrentUser()
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 })
    const { error } = await getSupabaseAdmin()
      .from('biodatas')
      .delete()
      .eq('id', id)
      .eq('user_id', user._id)
    assertNoError(error)
    return json({ ok: true })
  }

  // ---------- RAZORPAY ----------
  if (route === 'razorpay/create-order') {
    const user = await getCurrentUser()
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 })
    try {
      const shortUid = String(user._id).replace(/-/g, '').slice(0, 12)
      const order = await rz().orders.create({
        amount: PREMIUM_AMOUNT,
        currency: 'INR',
        receipt: `p_${shortUid}_${Date.now()}`.slice(0, 40),
        notes: { userId: String(user._id), plan: 'lifetime_premium_templates' },
      })
      const { error } = await getSupabaseAdmin()
        .from('payments')
        .insert({
          id: uuidv4(),
          user_id: user._id,
          razorpay_order_id: order.id,
          amount: PREMIUM_AMOUNT,
          currency: 'INR',
          status: 'created',
          created_at: new Date().toISOString(),
        })
      assertNoError(error)
      return json({
        orderId: order.id,
        amount: PREMIUM_AMOUNT,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
        userName: user.name,
        userEmail: user.email,
      })
    } catch (e) {
      console.error('razorpay create-order error', e)
      return json({ error: e.message || 'Razorpay error' }, { status: 500 })
    }
  }

  if (route === 'razorpay/verify') {
    const user = await getCurrentUser()
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 })
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body
    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return json({ error: 'Missing fields' }, { status: 400 })
    }
    if (razorpay_order_id !== orderId) return json({ error: 'Order mismatch' }, { status: 400 })

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${razorpay_payment_id}`)
      .digest('hex')
    const expectedBuffer = Buffer.from(expected, 'hex')
    const suppliedBuffer = Buffer.from(razorpay_signature, 'hex')
    if (
      expectedBuffer.length !== suppliedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, suppliedBuffer)
    ) {
      return json({ error: 'Invalid signature' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const now = new Date().toISOString()
    const premiumExpiresAt = new Date(Date.now() + PREMIUM_DURATION_MS).toISOString()

    const { data: claimed, error: claimError } = await supabase
      .from('payments')
      .update({
        status: 'paid',
        razorpay_payment_id,
        razorpay_signature,
        paid_at: now,
      })
      .eq('user_id', user._id)
      .eq('razorpay_order_id', orderId)
      .eq('status', 'created')
      .select('id')
      .maybeSingle()
    assertNoError(claimError)

    if (!claimed) {
      const { data: existing, error: existingError } = await supabase
        .from('payments')
        .select('id, status')
        .eq('user_id', user._id)
        .eq('razorpay_order_id', orderId)
        .maybeSingle()
      assertNoError(existingError)
      if (!existing) return json({ error: 'Order not found' }, { status: 404 })
      if (existing.status === 'paid') {
        const { error: ensurePremiumError } = await supabase
          .from('users')
          .update({
            is_premium: true,
            premium_unlocked_at: now,
            premium_expires_at: premiumExpiresAt,
            premium_source: 'razorpay',
            razorpay_payment_id,
            updated_at: now,
          })
          .eq('id', user._id)
        assertNoError(ensurePremiumError)
        return json({ ok: true, alreadyProcessed: true })
      }
      return json({ error: 'Payment could not be verified' }, { status: 409 })
    }

    const { error: userError } = await supabase
      .from('users')
      .update({
        is_premium: true,
        premium_unlocked_at: now,
        premium_expires_at: premiumExpiresAt,
        premium_source: 'razorpay',
        razorpay_payment_id,
        updated_at: now,
      })
      .eq('id', user._id)
    assertNoError(userError)

    return json({ ok: true })
  }

  return json({ error: 'Not found' }, { status: 404 })
}

export async function DELETE(request, { params }) {
  const { path = [] } = (await params) || {}
  const route = path.join('/')
  if (route.startsWith('biodatas/')) {
    const id = route.split('/')[1]
    const user = await getCurrentUser()
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 })
    const { error } = await getSupabaseAdmin()
      .from('biodatas')
      .delete()
      .eq('id', id)
      .eq('user_id', user._id)
    assertNoError(error)
    return json({ ok: true })
  }
  return json({ error: 'Not found' }, { status: 404 })
}
