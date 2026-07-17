const { createClient } = require('@supabase/supabase-js');

function cleanEnv(value) {
  if (!value) return '';
  return String(value).trim().replace(/^["']|["']$/g, '');
}

const supabaseUrl = cleanEnv(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseKey = cleanEnv(
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY,
);

let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  // Hostinger connection probe — uses an existing app table.
  supabase.from('users').select('*').limit(1);
} else {
  console.warn(
    'db.js: SUPABASE_URL and a Supabase API key are not set yet. Hostinger injects them after Database Connect.',
  );
}

module.exports = supabase;
