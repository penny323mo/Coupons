-- ============================================================
-- 澳門消費大獎賞 | Macau Rewards App - Supabase Schema
-- Run this in your Supabase project: SQL Editor → New query
-- ============================================================

-- 1. Profiles table (extends auth.users)
create table if not exists public.profiles (
  id               uuid references auth.users on delete cascade primary key,
  display_name     text,
  enabled_platforms jsonb not null default '["MPay","AlipayMacau","BOC","ICBC","TaiFungPay","Guangfa","LusoPay","UePay"]',
  language         text not null default 'zh' check (language in ('zh', 'en')),
  created_at       timestamptz default now()
);

-- 2. Coupons table
create table if not exists public.coupons (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users on delete cascade not null,
  platform    text not null,
  kind        text not null default 'gov'
              constraint coupons_kind_check check (kind in ('gov', 'merchant_discount', 'merchant_gift')),
  face_value  integer not null,
  drawn_date  date not null,
  status      text not null default 'unused' check (status in ('unused', 'used', 'expired')),
  used_date   date,
  store_name  text,
  notes       text,
  created_at  timestamptz default now(),
  constraint coupons_face_value_check check (
    (kind = 'gov' and face_value in (10, 20, 50, 100, 200))
    or (kind <> 'gov' and face_value >= 0)
  )
);

-- 3. Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.coupons  enable row level security;

-- 4. Profiles RLS policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 5. Coupons RLS policies
create policy "Users can view own coupons"
  on public.coupons for select
  using (auth.uid() = user_id);

create policy "Users can insert own coupons"
  on public.coupons for insert
  with check (auth.uid() = user_id);

create policy "Users can update own coupons"
  on public.coupons for update
  using (auth.uid() = user_id);

create policy "Users can delete own coupons"
  on public.coupons for delete
  using (auth.uid() = user_id);

-- 6. Auto-create profile on user sign-up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. Index for faster queries
create index if not exists coupons_user_id_idx on public.coupons (user_id);
create index if not exists coupons_status_idx  on public.coupons (user_id, status);
