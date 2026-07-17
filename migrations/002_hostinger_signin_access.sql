-- Hostinger often injects only the anon key.
-- Disable RLS and grant table access so server-side Next.js can save Google users.
-- Re-run safely in the Supabase SQL Editor.

alter table if exists public.users disable row level security;
alter table if exists public.biodatas disable row level security;
alter table if exists public.payments disable row level security;

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on table public.users to anon, authenticated, service_role;
grant select, insert, update, delete on table public.biodatas to anon, authenticated, service_role;
grant select, insert, update, delete on table public.payments to anon, authenticated, service_role;
