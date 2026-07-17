# Hostinger + Supabase setup

Use Hostinger's Supabase database option (not MySQL or MongoDB).

## 1. Create / connect Supabase

1. In Hostinger Node.js settings, choose the Supabase connect option
   (or create a project at supabase.com).
2. Prefer Hostinger’s Database Connect wizard (Essentials → Database →
   Connect → Supabase). It injects `SUPABASE_URL` and the API key on redeploy.
3. Open Supabase → SQL Editor and run:
   `migrations/001_supabase_schema.sql`
4. Keep root `db.js` in the repo. Hostinger uses it with the `users` table to
   verify the Supabase connection.

## 2. Hostinger environment variables

If the wizard did not inject keys, add these in Environment Variables (no quotes):

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

AUTH_SECRET=long-random-secret
AUTH_TRUST_HOST=true
AUTH_URL=https://ilovebiodata.com
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
NEXT_PUBLIC_RAZORPAY_KEY_ID=...
```

Generate `AUTH_SECRET` once:

```bash
openssl rand -base64 32
```

Never put `SUPABASE_SERVICE_ROLE_KEY` in any `NEXT_PUBLIC_*` variable.
Never commit real secrets to GitHub.

If Hostinger only injects the anon key, add `SUPABASE_SERVICE_ROLE_KEY`
manually from Supabase → Project Settings → API. The schema revokes anon
table access, so the service role key is required for login and saves.

## 3. Deploy

1. Save environment variables.
2. Rebuild and restart the Node.js app.
3. Open `/api/health/database`.
   Success returns HTTP 200 with `"database": "connected"`.

Google OAuth still uses NextAuth. Supabase is only the database.
