import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  const path = (await params)?.path || []
  if (path[0] === 'health') {
    return NextResponse.json({ ok: true, service: 'ilovebiodata', ts: Date.now() })
  }
  return NextResponse.json({ ok: true, message: 'ILoveBiodata API', path })
}

export async function POST(request, { params }) {
  return NextResponse.json({ ok: true })
}
