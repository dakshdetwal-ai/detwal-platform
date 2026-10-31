-- Run this in Supabase Dashboard > SQL Editor.
-- Authenticated users can create and view only their own payment requests.
create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_name text not null,
  mobile_number text not null,
  plan_id text not null check (plan_id in ('basic','pro','premium','trial')),
  payer_upi_id text not null,
  amount_inr integer not null check (amount_inr in (299,799,1399,2499)),
  utr_reference text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
alter table public.payment_requests enable row level security;
drop policy if exists "Users can submit their own payment requests" on public.payment_requests;
create policy "Users can submit their own payment requests"
on public.payment_requests for insert to authenticated
with check (auth.uid() = user_id and status = 'pending');
drop policy if exists "Users can view their own payment requests" on public.payment_requests;
create policy "Users can view their own payment requests"
on public.payment_requests for select to authenticated
using (auth.uid() = user_id);
