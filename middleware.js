import { NextResponse } from 'next/server'

// Auth is handled by /api/auth/otp/* and cookie sessions.
// Keep this matcher lightweight so OTP pages remain public.
export function middleware() {
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
