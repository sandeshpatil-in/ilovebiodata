-- Phone OTP login support.
-- Run after 001 + 002 in the Supabase SQL Editor.

alter table if exists public.users
  alter column email drop not null;

alter table if exists public.users
  add column if not exists phone text;

create unique index if not exists users_phone_unique
  on public.users (phone)
  where phone is not null;

create table if not exists public.otp_challenges (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists otp_challenges_phone_created_idx
  on public.otp_challenges (phone, created_at desc);

alter table public.otp_challenges disable row level security;

grant select, insert, update, delete on table public.otp_challenges to anon, authenticated, service_role;
