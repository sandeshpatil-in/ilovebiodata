-- Run this once in the Supabase SQL Editor.
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE where possible.

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key,
  email text not null unique,
  name text not null default '',
  picture text,
  is_premium boolean not null default false,
  premium_expires_at timestamptz,
  premium_unlocked_at timestamptz,
  premium_source text,
  razorpay_payment_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.biodatas (
  id uuid primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  template text not null default 't1',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists biodatas_user_updated_idx
  on public.biodatas (user_id, updated_at desc);

create table if not exists public.payments (
  id uuid primary key,
  user_id uuid not null references public.users (id) on delete restrict,
  razorpay_order_id text not null unique,
  amount integer not null check (amount > 0),
  currency char(3) not null default 'INR',
  status text not null default 'created'
    check (status in ('created', 'paid', 'failed')),
  razorpay_payment_id text,
  razorpay_signature text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists payments_user_idx
  on public.payments (user_id);

alter table public.users enable row level security;
alter table public.biodatas enable row level security;
alter table public.payments enable row level security;

-- The Next.js server uses SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.
-- Keep anon/authenticated blocked from direct table access.
revoke all on table public.users from anon, authenticated;
revoke all on table public.biodatas from anon, authenticated;
revoke all on table public.payments from anon, authenticated;
