import { createClient } from '@supabase/supabase-js'

function resolveSupabaseUrl() {
  return (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ''
  )
}

function resolveSupabaseKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  )
}

export function getSupabaseAdmin() {
  if (!globalThis._supabaseAdmin) {
    const url = resolveSupabaseUrl()
    const key = resolveSupabaseKey()

    if (!url) {
      throw new Error('Missing required environment variable: SUPABASE_URL')
    }
    if (!key) {
      throw new Error(
        'Missing Supabase API key. Set SUPABASE_SERVICE_ROLE_KEY (recommended) or SUPABASE_ANON_KEY.',
      )
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SECRET_KEY) {
      console.warn(
        'Using a non-service Supabase key. Prefer SUPABASE_SERVICE_ROLE_KEY so server writes bypass RLS.',
      )
    }

    globalThis._supabaseAdmin = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return globalThis._supabaseAdmin
}

export async function pingDatabase() {
  const { error } = await getSupabaseAdmin()
    .from('users')
    .select('id', { head: true, count: 'exact' })
    .limit(1)

  if (error) throw error
}

export function assertNoError(error, fallbackMessage = 'Database request failed') {
  if (!error) return
  const message = error.message || fallbackMessage
  const err = new Error(message)
  err.code = error.code
  err.details = error.details
  err.hint = error.hint
  throw err
}
