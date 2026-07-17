# Hostinger + Supabase setup

Use Hostinger's Supabase database option (not MySQL or MongoDB).

## 1. Create / connect Supabase

1. In Hostinger Node.js settings, choose the Supabase connect option
   (or create a project at supabase.com).
2. Open Supabase → Project Settings → API and copy:
   - Project URL
   - `service_role` secret key
3. Open Supabase → SQL Editor and run:
   `migrations/001_supabase_schema.sql`

## 2. Hostinger environment variables

Put these in Hostinger Environment Variables (no quotes):

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

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

## 3. Deploy

1. Save environment variables.
2. Rebuild and restart the Node.js app.
3. Open `/api/health/database`.
   Success returns HTTP 200 with `"database": "connected"`.

Google OAuth still uses NextAuth. Supabase is only the database.
