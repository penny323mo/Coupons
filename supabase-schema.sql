-- ============================================================
-- 消費獎賞 | MO Rewards — complete Supabase setup
-- New project: SQL Editor → New query → paste all → Run.
-- Safe to run again; it only adds what is missing.
-- ============================================================

-- 1. Profiles (one row per user: chosen wallets and language)
create table if not exists public.profiles (
  id                uuid primary key references auth.users on delete cascade,
  display_name      text,
  enabled_platforms jsonb not null default '["MPay","AlipayMacau","BOC","ICBC","TaiFungPay","Guangfa","LusoPay","UePay"]',
  language          text not null default 'zh' check (language in ('zh', 'en')),
  created_at        timestamptz not null default now()
);

-- 2. Coupons (government e-vouchers and merchant vouchers)
create table if not exists public.coupons (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  platform    text not null,
  kind        text not null default 'gov',
  face_value  integer not null,
  drawn_date  date not null,
  status      text not null default 'unused',
  used_date   date,
  use_by      date,
  store_name  text,
  notes       text,
  created_at  timestamptz not null default now()
);

-- Older installs may lack these columns
alter table public.coupons add column if not exists kind text not null default 'gov';
-- Last usable day as shown in the wallet (overrides the Friday-clearing rule)
alter table public.coupons add column if not exists use_by date;

alter table public.coupons drop constraint if exists coupons_kind_check;
alter table public.coupons add constraint coupons_kind_check
  check (kind in ('gov', 'merchant_discount', 'merchant_gift'));

alter table public.coupons drop constraint if exists coupons_status_check;
alter table public.coupons add constraint coupons_status_check
  check (status in ('unused', 'used', 'expired'));

-- Government vouchers have fixed values; merchant vouchers store 12 (discount) or 0 (gift)
alter table public.coupons drop constraint if exists coupons_face_value_check;
alter table public.coupons add constraint coupons_face_value_check check (
  (kind = 'gov' and face_value in (10, 20, 50, 100, 200))
  or (kind <> 'gov' and face_value >= 0)
);

create index if not exists coupons_user_id_idx on public.coupons (user_id);
create index if not exists coupons_status_idx  on public.coupons (user_id, status);

-- 3. Row Level Security: everyone sees and changes only their own rows
alter table public.profiles enable row level security;
alter table public.coupons  enable row level security;

drop policy if exists "Users can view own profile"   on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can view own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users can view own coupons"   on public.coupons;
drop policy if exists "Users can insert own coupons" on public.coupons;
drop policy if exists "Users can update own coupons" on public.coupons;
drop policy if exists "Users can delete own coupons" on public.coupons;
create policy "Users can view own coupons"   on public.coupons for select using (auth.uid() = user_id);
create policy "Users can insert own coupons" on public.coupons for insert with check (auth.uid() = user_id);
create policy "Users can update own coupons" on public.coupons for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own coupons" on public.coupons for delete using (auth.uid() = user_id);

-- 4. Create a profile automatically for every new account (email or Google)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Profiles for any accounts created before the trigger existed
insert into public.profiles (id, display_name)
select id, email from auth.users
on conflict (id) do nothing;
