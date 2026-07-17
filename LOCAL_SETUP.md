# Mobile OTP login

Google login has been removed. Users sign in with a 10-digit Indian mobile
number and a 6-digit OTP.

## Setup

1. Run SQL migrations in Supabase SQL Editor (in order):
   - `migrations/001_supabase_schema.sql`
   - `migrations/002_hostinger_signin_access.sql`
   - `migrations/003_phone_otp.sql`
2. Set env vars from `.env.example`.
3. For local testing set:

```env
OTP_DEV_MODE=true
AUTH_SECRET=any-long-random-string
```

4. Start the app:

```bash
npm run dev
```

5. Open the login modal, enter a mobile number, request OTP.
   - With `OTP_DEV_MODE=true`, the OTP is returned in the API response and
     shown in the UI/server logs.
6. Enter OTP to complete login.

## Production SMS

Set MSG91 credentials:

```env
OTP_DEV_MODE=false
MSG91_AUTH_KEY=...
MSG91_TEMPLATE_ID=...
```

Template must include an `otp` variable.

## API

- `POST /api/auth/otp/send` `{ phone }`
- `POST /api/auth/otp/verify` `{ phone, code }`
- `POST /api/auth/logout`
- `GET /api/me`
