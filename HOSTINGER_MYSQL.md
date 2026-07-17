# Hostinger MySQL setup

1. Create a MySQL database and user in Hostinger hPanel.
2. Copy the values from `.env.example` into the Node.js environment settings.
   Use the exact database host, name, and username shown by hPanel.
3. Keep `DB_SSL=false` when Hostinger provides a local database host. Set it to
   `true` only when the database endpoint supplies a publicly trusted TLS
   certificate.
4. Create the tables using either option:
   - Run `npm run db:migrate` from the application directory over SSH.
   - Import `migrations/001_initial_schema.sql` using phpMyAdmin.
5. Build and restart the application.
6. Open `/api/health/database`. A successful connection returns HTTP 200 with
   `"database": "connected"`.

Database credentials and `AUTH_SECRET` must only be stored in Hostinger's
environment settings. Never commit a populated `.env` file.

The SQL migration creates foreign keys, unique constraints, and indexes. All
application queries use placeholders, and payment verification is processed
inside a transaction to prevent duplicate application.

This changes the application's storage engine but does not copy records from an
existing MongoDB deployment. Existing records require a one-time export/import
with access to both databases; preserve the UUID values when importing them.
