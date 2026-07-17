import { createClient } from '@supabase/supabase-js'

function cleanEnv(value) {
  if (!value) return ''
  return String(value).trim().replace(/^["']|["']$/g, '')
}

function resolveSupabaseUrl() {
  return cleanEnv(
    process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL,
  )
}

function resolveSupabaseKey() {
  return cleanEnv(
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY,
  )
}

export function getSupabaseEnvStatus() {
  return {
    hasUrl: Boolean(resolveSupabaseUrl()),
    hasServiceRoleKey: Boolean(
      cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY),
    ),
    hasAnonKey: Boolean(
      cleanEnv(
        process.env.SUPABASE_ANON_KEY ||
          process.env.SUPABASE_KEY ||
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
          process.env.SUPABASE_PUBLISHABLE_KEY,
      ),
    ),
  }
}

export function getSupabaseAdmin() {
  if (!globalThis._supabaseAdmin) {
    const url = resolveSupabaseUrl()
    const key = resolveSupabaseKey()

    if (!url) {
      throw new Error('Missing SUPABASE_URL. Connect Supabase in Hostinger or set SUPABASE_URL.')
    }
    if (!key) {
      throw new Error(
        'Missing Supabase API key. Set SUPABASE_SERVICE_ROLE_KEY (best) or SUPABASE_ANON_KEY.',
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
  const message = [error.message, error.details, error.hint].filter(Boolean).join(' | ') || fallbackMessage
  const err = new Error(message)
  err.code = error.code
  err.details = error.details
  err.hint = error.hint
  throw err
}
