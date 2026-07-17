# Hostinger + Supabase setup (fixes Google Access Denied)

Google login fails with **Access Denied** when Auth.js cannot save the user
into Supabase. That is a database permission/setup problem, not a Google OAuth
problem.

## Final fix checklist

1. Hostinger → Node.js → Database → Connect → Supabase (done).
2. Hostinger Environment Variables must include (NO quotes):

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
AUTH_SECRET=long-random-secret
AUTH_TRUST_HOST=true
AUTH_URL=https://ilovebiodata.com
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

3. In Supabase → SQL Editor, run BOTH files in order:
   - `migrations/001_supabase_schema.sql`
   - `migrations/002_hostinger_signin_access.sql`
4. Rebuild + Restart the Node.js app.
5. Open `https://ilovebiodata.com/api/health/database`
   - Must return `"ok": true` and `"database": "connected"`.
6. Clear site cookies for `ilovebiodata.com`, then try Google login again.

## Why MongoDB / MySQL / Supabase all showed Access Denied

The app blocks Google sign-in when the database write fails:

- MongoDB: `MONGO_URL` missing → Access Denied
- MySQL: `DB_*` missing/wrong → Access Denied
- Supabase: tables missing, or anon key blocked by RLS → Access Denied

## Security note

Do not put `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_ANON_KEY` in any
`NEXT_PUBLIC_*` variable. The app uses Supabase only on the server.
