-- ============================================================
-- 2026社區消費連環賞 (Oct 9 – Dec 17, 2026) upgrade
-- Adds merchant vouchers (商戶滿減券 / 消費禮遇券) to the coupons table.
-- Run once in Supabase: SQL Editor → New query. Safe to run again.
-- ============================================================

alter table public.coupons
  add column if not exists kind text not null default 'gov';

alter table public.coupons drop constraint if exists coupons_kind_check;
alter table public.coupons
  add constraint coupons_kind_check check (kind in ('gov', 'merchant_discount', 'merchant_gift'));

-- Government e-vouchers keep their fixed values; merchant vouchers store
-- the discount (12) or 0 for a gift.
alter table public.coupons drop constraint if exists coupons_face_value_check;
alter table public.coupons
  add constraint coupons_face_value_check check (
    (kind = 'gov' and face_value in (10, 20, 50, 100, 200))
    or (kind <> 'gov' and face_value >= 0)
  );
