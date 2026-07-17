# Local development setup

Run the app on your computer first. Go live later when login and database work.

## 1. Install

```bash
git clone https://github.com/sandeshpatil-in/ilovebiodata.git
cd ilovebiodata
npm install
```

## 2. Create `.env.local`

Copy `.env.example`:

```bash
cp .env.example .env.local
```

Fill values with **no quotes**:

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

AUTH_SECRET=paste_output_of_openssl_rand_base64_32
AUTH_TRUST_HOST=true
AUTH_URL=http://localhost:3000

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
```

Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

Get Supabase keys from: Supabase → Project Settings → API  
Get Google keys from: Google Cloud → APIs & Services → Credentials

## 3. Google OAuth local redirect

In Google Cloud OAuth client, add:

- Authorized JavaScript origin: `http://localhost:3000`
- Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

## 4. Create Supabase tables

In Supabase → SQL Editor, run in order:

1. `migrations/001_supabase_schema.sql`
2. `migrations/002_hostinger_signin_access.sql`

## 5. Start locally

```bash
npm run dev
```

Open:

- App: http://localhost:3000
- Health: http://localhost:3000/api/health
- Database: http://localhost:3000/api/health/database

Database check must return `"ok": true` before testing Google login.

## 6. Go live later

When local login works:

1. Deploy the same `main` branch to Hostinger (or Vercel)
2. Set the same env vars, but change:

```env
AUTH_URL=https://your-domain.com
```

3. Add Google redirect:

`https://your-domain.com/api/auth/callback/google`

4. Rebuild/restart and test `/api/health/database` again
