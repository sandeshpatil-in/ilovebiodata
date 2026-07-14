import { NextResponse } from 'next/server'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import { v4 as uuidv4 } from 'uuid'
import { query } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'

const PREMIUM_AMOUNT = 4900 // ₹49 in paise
const PREMIUM_DURATION_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

function rz() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

function json(data, init) { return NextResponse.json(data, init) }

async function readBody(req) { try { return await req.json() } catch { return {} } }

// GET handler
export async function GET(request, { params }) {
  const { path = [] } = (await params) || {}
  const route = path.join('/')

  if (route === 'health' || route === '') {
    return json({ ok: true, service: 'ilovebiodata', ts: Date.now() })
  }

  if (route === 'auth/me' || route === 'me') {
    const user = await getCurrentUser()
    if (!user) return json({ user: null }, { status: 200 })
    return json({ user: publicUser(user) })
  }

  if (route === 'biodatas') {
    const user = await getCurrentUser()
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 })
    const rows = await query(
      "SELECT * FROM biodatas WHERE user_id = ? ORDER BY updated_at DESC",
      [user.id]
    )
    const items = rows.map(row => ({
      _id: row.id,
      id: row.id,
      userId: row.user_id,
      title: row.title,
      template: row.template,
      data: typeof row.json_data === 'string' ? JSON.parse(row.json_data) : row.json_data,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
    return json({ items })
  }

  if (route.startsWith('biodatas/')) {
    const id = route.split('/')[1]
    const user = await getCurrentUser()
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 })
    const rows = await query(
      "SELECT * FROM biodatas WHERE id = ? AND user_id = ?",
      [id, user.id]
    )
    if (!rows || rows.length === 0) return json({ error: 'Not found' }, { status: 404 })
    const doc = {
      _id: rows[0].id,
      id: rows[0].id,
      userId: rows[0].user_id,
      title: rows[0].title,
      template: rows[0].template,
      data: typeof rows[0].json_data === 'string' ? JSON.parse(rows[0].json_data) : rows[0].json_data,
      createdAt: rows[0].created_at,
      updatedAt: rows[0].updated_at,
    }
    return json({ item: doc })
  }

  // Public share view (no auth) — read-only
  if (route.startsWith('share/')) {
    const id = route.split('/')[1]
    const rows = await query("SELECT * FROM biodatas WHERE id = ?", [id])
    if (!rows || rows.length === 0) return json({ error: 'Not found' }, { status: 404 })
    const doc = {
      _id: rows[0].id,
      id: rows[0].id,
      userId: rows[0].user_id,
      title: rows[0].title,
      template: rows[0].template,
      data: typeof rows[0].json_data === 'string' ? JSON.parse(rows[0].json_data) : rows[0].json_data,
      createdAt: rows[0].created_at,
      updatedAt: rows[0].updated_at,
    }
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
    const id = body.id || uuidv4()
    const title = (body.data?.firstName || body.data?.lastName) ? `${body.data?.firstName || ''} ${body.data?.lastName || ''}`.trim() : 'नवीन बायोडाटा'
    const template = body.template || 't1'
    const jsonData = JSON.stringify(body.data || {})

    // Check if it exists
    const existing = await query("SELECT id FROM biodatas WHERE id = ? AND user_id = ?", [id, user.id])
    if (existing && existing.length > 0) {
      await query(
        "UPDATE biodatas SET title = ?, template = ?, json_data = ?, updated_at = NOW() WHERE id = ? AND user_id = ?",
        [title, template, jsonData, id, user.id]
      )
    } else {
      await query(
        "INSERT INTO biodatas (id, user_id, title, template, json_data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())",
        [id, user.id, title, template, jsonData]
      )
    }

    const doc = {
      _id: id,
      id,
      userId: user.id,
      title,
      template,
      data: body.data || {},
      updatedAt: new Date(),
    }
    return json({ ok: true, id, item: doc })
  }

  if (route.startsWith('biodatas/') && route.endsWith('/delete')) {
    const id = route.split('/')[1]
    const user = await getCurrentUser()
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 })
    await query("DELETE FROM biodatas WHERE id = ? AND user_id = ?", [id, user.id])
    return json({ ok: true })
  }

  // ---------- RAZORPAY ----------
  if (route === 'razorpay/create-order') {
    const user = await getCurrentUser()
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 })
    try {
      const shortUid = String(user.id).replace(/-/g, '').slice(0, 12)
      const order = await rz().orders.create({
        amount: PREMIUM_AMOUNT,
        currency: 'INR',
        receipt: `p_${shortUid}_${Date.now()}`.slice(0, 40),
        notes: { userId: String(user.id), plan: 'lifetime_premium_templates' },
      })
      await query(
        "INSERT INTO payments (id, user_id, razorpay_order_id, razorpay_payment_id, amount, status, created_at) VALUES (?, ?, ?, NULL, ?, 'created', NOW())",
        [uuidv4(), user.id, order.id, PREMIUM_AMOUNT]
      )
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
    
    const payments = await query(
      "SELECT * FROM payments WHERE user_id = ? AND razorpay_order_id = ?",
      [user.id, orderId]
    )
    if (!payments || payments.length === 0) return json({ error: 'Order not found' }, { status: 404 })
    const payment = payments[0]

    const expiryDate = new Date(Date.now() + PREMIUM_DURATION_MS)

    if (payment.status === 'paid') {
      // already applied - extend expiry
      await query(
        "UPDATE users SET is_premium = 1, premium_expiry = ?, updated_at = NOW() WHERE id = ?",
        [expiryDate, user.id]
      )
      return json({ ok: true, alreadyProcessed: true })
    }
    if (razorpay_order_id !== orderId) return json({ error: 'Order mismatch' }, { status: 400 })

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${razorpay_payment_id}`)
      .digest('hex')
    if (expected !== razorpay_signature) {
      return json({ error: 'Invalid signature' }, { status: 400 })
    }

    await query(
      "UPDATE payments SET status = 'paid', razorpay_payment_id = ? WHERE razorpay_order_id = ?",
      [razorpay_payment_id, orderId]
    )
    await query(
      "UPDATE users SET is_premium = 1, premium_expiry = ?, updated_at = NOW() WHERE id = ?",
      [expiryDate, user.id]
    )
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
    await query("DELETE FROM biodatas WHERE id = ? AND user_id = ?", [id, user.id])
    return json({ ok: true })
  }
  return json({ error: 'Not found' }, { status: 404 })
}
