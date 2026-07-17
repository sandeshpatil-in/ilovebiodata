import { NextResponse } from 'next/server'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import { v4 as uuidv4 } from 'uuid'
import { getPool, pingDatabase } from '@/lib/mysql'
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

function parseJson(value) {
  if (typeof value !== 'string') return value || {}
  try { return JSON.parse(value) } catch { return {} }
}

function toBiodata(row) {
  if (!row) return null
  return {
    _id: row.id,
    userId: row.user_id,
    title: row.title,
    template: row.template,
    data: parseJson(row.data),
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
    try {
      await pingDatabase()
      return json({ ok: true, database: 'connected', ts: Date.now() })
    } catch (error) {
      console.error('Database health check failed:', error)
      return json(
        { ok: false, database: 'disconnected', ts: Date.now() },
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
    const [rows] = await getPool().execute(
      `SELECT id, user_id, title, template, data, created_at, updated_at
       FROM biodatas WHERE user_id = ? ORDER BY updated_at DESC`,
      [user._id],
    )
    return json({ items: rows.map(toBiodata) })
  }

  if (route.startsWith('biodatas/')) {
    const id = route.split('/')[1]
    const user = await getCurrentUser()
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 })
    const [rows] = await getPool().execute(
      `SELECT id, user_id, title, template, data, created_at, updated_at
       FROM biodatas WHERE id = ? AND user_id = ? LIMIT 1`,
      [id, user._id],
    )
    const doc = toBiodata(rows[0])
    if (!doc) return json({ error: 'Not found' }, { status: 404 })
    return json({ item: doc })
  }

  // Public share view (no auth) — read-only
  if (route.startsWith('share/')) {
    const id = route.split('/')[1]
    const [rows] = await getPool().execute(
      `SELECT id, user_id, title, template, data, created_at, updated_at
       FROM biodatas WHERE id = ? LIMIT 1`,
      [id],
    )
    const doc = toBiodata(rows[0])
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
    const now = new Date()
    const id = body.id || uuidv4()
    const title = (body.data?.firstName || body.data?.lastName) ? `${body.data?.firstName || ''} ${body.data?.lastName || ''}`.trim() : 'नवीन बायोडाटा'
    const doc = {
      _id: id,
      userId: user._id,
      title,
      template: body.template || 't1',
      data: body.data || {},
      updatedAt: now,
    }
    const pool = getPool()
    const [updated] = await pool.execute(
      `UPDATE biodatas
       SET title = ?, template = ?, data = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
      [title, doc.template, JSON.stringify(doc.data), now, id, user._id],
    )

    if (updated.affectedRows === 0) {
      try {
        await pool.execute(
          `INSERT INTO biodatas
             (id, user_id, title, template, data, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, user._id, title, doc.template, JSON.stringify(doc.data), now, now],
        )
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          return json({ error: 'Biodata ID already exists' }, { status: 409 })
        }
        throw error
      }
    }
    return json({ ok: true, id, item: doc })
  }

  if (route.startsWith('biodatas/') && route.endsWith('/delete')) {
    const id = route.split('/')[1]
    const user = await getCurrentUser()
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 })
    await getPool().execute(
      'DELETE FROM biodatas WHERE id = ? AND user_id = ?',
      [id, user._id],
    )
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
      await getPool().execute(
        `INSERT INTO payments
           (id, user_id, razorpay_order_id, amount, currency, status, created_at)
         VALUES (?, ?, ?, ?, ?, 'created', CURRENT_TIMESTAMP(3))`,
        [uuidv4(), user._id, order.id, PREMIUM_AMOUNT, 'INR'],
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

    const connection = await getPool().getConnection()
    try {
      await connection.beginTransaction()
      const [payments] = await connection.execute(
        `SELECT id, status FROM payments
         WHERE user_id = ? AND razorpay_order_id = ? FOR UPDATE`,
        [user._id, orderId],
      )
      const payment = payments[0]
      if (!payment) {
        await connection.rollback()
        return json({ error: 'Order not found' }, { status: 404 })
      }
      if (payment.status === 'paid') {
        await connection.commit()
        return json({ ok: true, alreadyProcessed: true })
      }

      const now = new Date()
      const premiumExpiresAt = new Date(Date.now() + PREMIUM_DURATION_MS)
      await connection.execute(
        `UPDATE payments
         SET status = 'paid', razorpay_payment_id = ?,
             razorpay_signature = ?, paid_at = ?
         WHERE id = ?`,
        [razorpay_payment_id, razorpay_signature, now, payment.id],
      )
      await connection.execute(
        `UPDATE users
         SET is_premium = TRUE, premium_unlocked_at = ?,
             premium_expires_at = ?, premium_source = 'razorpay',
             razorpay_payment_id = ?, updated_at = ?
         WHERE id = ?`,
        [now, premiumExpiresAt, razorpay_payment_id, now, user._id],
      )
      await connection.commit()
      return json({ ok: true })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
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
    await getPool().execute(
      'DELETE FROM biodatas WHERE id = ? AND user_id = ?',
      [id, user._id],
    )
    return json({ ok: true })
  }
  return json({ error: 'Not found' }, { status: 404 })
}
