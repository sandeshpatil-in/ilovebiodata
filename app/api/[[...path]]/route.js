import { NextResponse } from 'next/server'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '@/lib/mongodb'
import { createSession, sessionCookieOptions, SESSION_COOKIE, getCurrentUser, destroySession } from '@/lib/auth'

export const runtime = 'nodejs'

const PREMIUM_AMOUNT = 9900 // ₹99 in paise

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

  if (route === 'auth/me') {
    const user = await getCurrentUser()
    if (!user) return json({ user: null }, { status: 200 })
    return json({ user: publicUser(user) })
  }

  if (route === 'biodatas') {
    const user = await getCurrentUser()
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 })
    const db = await getDb()
    const items = await db.collection('biodatas').find({ userId: user._id }).sort({ updatedAt: -1 }).toArray()
    return json({ items })
  }

  if (route.startsWith('biodatas/')) {
    const id = route.split('/')[1]
    const user = await getCurrentUser()
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 })
    const db = await getDb()
    const doc = await db.collection('biodatas').findOne({ _id: id, userId: user._id })
    if (!doc) return json({ error: 'Not found' }, { status: 404 })
    return json({ item: doc })
  }

  // Public share view (no auth) — read-only
  if (route.startsWith('share/')) {
    const id = route.split('/')[1]
    const db = await getDb()
    const doc = await db.collection('biodatas').findOne({ _id: id })
    if (!doc) return json({ error: 'Not found' }, { status: 404 })
    return json({ item: doc })
  }

  return json({ error: 'Not found' }, { status: 404 })
}

function publicUser(u) {
  if (!u) return null
  return { id: u._id, email: u.email, name: u.name, picture: u.picture, isPremium: !!u.isPremium, premiumUnlockedAt: u.premiumUnlockedAt }
}

// POST handler
export async function POST(request, { params }) {
  const { path = [] } = (await params) || {}
  const route = path.join('/')
  const body = await readBody(request)

  // ---------- AUTH ----------
  if (route === 'auth/session') {
    // Exchange Emergent session_id for user data via Emergent API, then create app session
    const sessionId = body.session_id
    if (!sessionId) return json({ error: 'session_id required' }, { status: 400 })
    try {
      const res = await fetch(process.env.EMERGENT_AUTH_API, {
        headers: { 'X-Session-ID': sessionId },
      })
      if (!res.ok) return json({ error: 'Invalid Emergent session' }, { status: 401 })
      const emergent = await res.json() // { id, email, name, picture, session_token }
      if (!emergent?.email) return json({ error: 'Invalid Emergent payload' }, { status: 401 })

      const { token, expiresAt, user } = await createSession({
        id: emergent.id,
        email: emergent.email,
        name: emergent.name,
        picture: emergent.picture,
      })
      const resp = json({ ok: true, user: publicUser(user) })
      resp.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt))
      return resp
    } catch (e) {
      console.error('auth/session error', e)
      return json({ error: 'Auth failed' }, { status: 500 })
    }
  }

  if (route === 'auth/logout') {
    const c = request.cookies
    const token = c.get(SESSION_COOKIE)?.value
    await destroySession(token)
    const resp = json({ ok: true })
    resp.cookies.delete(SESSION_COOKIE)
    return resp
  }

  // ---------- BIODATAS ----------
  if (route === 'biodatas') {
    const user = await getCurrentUser()
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 })
    const db = await getDb()
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
    await db.collection('biodatas').updateOne(
      { _id: id, userId: user._id },
      { $set: doc, $setOnInsert: { createdAt: now } },
      { upsert: true }
    )
    return json({ ok: true, id, item: doc })
  }

  if (route.startsWith('biodatas/') && route.endsWith('/delete')) {
    const id = route.split('/')[1]
    const user = await getCurrentUser()
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 })
    const db = await getDb()
    await db.collection('biodatas').deleteOne({ _id: id, userId: user._id })
    return json({ ok: true })
  }

  // ---------- RAZORPAY ----------
  if (route === 'razorpay/create-order') {
    const user = await getCurrentUser()
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 })
    try {
      const order = await rz().orders.create({
        amount: PREMIUM_AMOUNT,
        currency: 'INR',
        receipt: `premium_${user._id}_${Date.now()}`,
        notes: { userId: String(user._id), plan: 'lifetime_premium_templates' },
      })
      const db = await getDb()
      await db.collection('payments').insertOne({
        _id: uuidv4(),
        userId: user._id,
        razorpayOrderId: order.id,
        amount: PREMIUM_AMOUNT,
        currency: 'INR',
        status: 'created',
        createdAt: new Date(),
      })
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
    const db = await getDb()
    const payment = await db.collection('payments').findOne({ userId: user._id, razorpayOrderId: orderId })
    if (!payment) return json({ error: 'Order not found' }, { status: 404 })
    if (payment.status === 'paid') {
      // already applied
      await db.collection('users').updateOne({ _id: user._id }, { $set: { isPremium: true } })
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

    await db.collection('payments').updateOne(
      { razorpayOrderId: orderId },
      { $set: { status: 'paid', razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature, paidAt: new Date() } }
    )
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { isPremium: true, premiumUnlockedAt: new Date(), premiumSource: 'razorpay', razorpayPaymentId: razorpay_payment_id } }
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
    const db = await getDb()
    await db.collection('biodatas').deleteOne({ _id: id, userId: user._id })
    return json({ ok: true })
  }
  return json({ error: 'Not found' }, { status: 404 })
}
