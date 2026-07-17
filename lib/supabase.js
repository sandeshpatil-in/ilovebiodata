import { createClient } from '@supabase/supabase-js'

function requiredEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

export function getSupabaseAdmin() {
  if (!globalThis._supabaseAdmin) {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!url) {
      throw new Error('Missing required environment variable: SUPABASE_URL')
    }

    globalThis._supabaseAdmin = createClient(
      url,
      requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )
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
