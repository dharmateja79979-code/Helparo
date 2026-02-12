-- Helparo MVP schema + RLS
create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('customer', 'helper', 'admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'kyc_status') then
    create type public.kyc_status as enum ('pending', 'approved', 'rejected');
  end if;
  if not exists (select 1 from pg_type where typname = 'booking_status') then
    create type public.booking_status as enum ('requested','accepted','enroute','started','completed','paid','cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'media_type') then
    create type public.media_type as enum ('before', 'after', 'issue');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_method') then
    create type public.payment_method as enum ('cash','upi','card','razorpay','cashfree');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum ('pending','paid','failed','refunded');
  end if;
  if not exists (select 1 from pg_type where typname = 'user_plan') then
    create type public.user_plan as enum ('free','premium');
  end if;
end $$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'customer',
  user_plan public.user_plan not null default 'free',
  name text,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  icon_key text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.service_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  country text not null default 'India',
  polygon jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.helper_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  kyc_status public.kyc_status not null default 'pending',
  kyc_docs_path text,
  bio text,
  experience_years int default 0,
  services jsonb not null default '[]'::jsonb,
  base_price numeric(10,2) not null default 0,
  service_areas jsonb not null default '[]'::jsonb,
  rating_avg numeric(3,2) not null default 0,
  rating_count int not null default 0,
  reliability_score int not null default 50 check (reliability_score between 0 and 100),
  cancelled_count int not null default 0,
  completed_count int not null default 0,
  late_count int not null default 0,
  rework_count int not null default 0,
  complaint_count int not null default 0,
  is_active boolean not null default true,
  commission_percent numeric(5,2) not null default 15.00,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  label text not null,
  line1 text not null,
  line2 text,
  landmark text,
  lat numeric(10,7),
  lng numeric(10,7),
  zone_id uuid references public.service_zones(id),
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.users(id),
  helper_id uuid references public.users(id),
  category_id uuid not null references public.service_categories(id),
  address_id uuid not null references public.addresses(id),
  scheduled_at timestamptz,
  status public.booking_status not null default 'requested',
  price_estimate_min numeric(10,2),
  price_estimate_max numeric(10,2),
  final_price numeric(10,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.booking_media (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  uploader_id uuid not null references public.users(id),
  type public.media_type not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.booking_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  actor_id uuid references public.users(id),
  type text not null,
  from_status public.booking_status,
  to_status public.booking_status,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  sender_id uuid not null references public.users(id),
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  customer_id uuid not null references public.users(id),
  helper_id uuid not null references public.users(id),
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  method public.payment_method not null,
  status public.payment_status not null default 'pending',
  amount numeric(10,2) not null check (amount >= 0),
  provider_ref text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users(id),
  action text not null,
  entity_type text not null,
  entity_id text not null,
  ip text,
  user_agent text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  platform text not null check (platform in ('android','ios','web')),
  fcm_token text not null,
  created_at timestamptz not null default now(),
  unique(user_id, fcm_token)
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_helper_profiles_updated_at on public.helper_profiles;
create trigger trg_helper_profiles_updated_at
before update on public.helper_profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_bookings_updated_at on public.bookings;
create trigger trg_bookings_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, role, phone, email, name)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'customer'),
    new.phone,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users u
    where u.id = uid and u.role = 'admin'
  );
$$;

create or replace function public.is_helper(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users u
    where u.id = uid and u.role = 'helper'
  );
$$;

create or replace function public.can_access_booking(uid uuid, bid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.bookings b
    where b.id = bid
      and (b.customer_id = uid or b.helper_id = uid)
  );
$$;

alter table public.users enable row level security;
alter table public.helper_profiles enable row level security;
alter table public.service_categories enable row level security;
alter table public.service_zones enable row level security;
alter table public.addresses enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_media enable row level security;
alter table public.booking_events enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.payments enable row level security;
alter table public.audit_logs enable row level security;
alter table public.app_settings enable row level security;
alter table public.user_devices enable row level security;

drop policy if exists users_self_select on public.users;
create policy users_self_select on public.users
for select using (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists users_self_update on public.users;
create policy users_self_update on public.users
for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists categories_public_read on public.service_categories;
create policy categories_public_read on public.service_categories
for select using (true);

drop policy if exists zones_public_read on public.service_zones;
create policy zones_public_read on public.service_zones
for select using (true);

drop policy if exists helper_profiles_public_read on public.helper_profiles;
create policy helper_profiles_public_read on public.helper_profiles
for select using (true);

drop policy if exists helper_profiles_self_write on public.helper_profiles;
create policy helper_profiles_self_write on public.helper_profiles
for all using (user_id = auth.uid() or public.is_admin(auth.uid()))
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists addresses_owner_only on public.addresses;
create policy addresses_owner_only on public.addresses
for all using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists bookings_access on public.bookings;
create policy bookings_access on public.bookings
for select using (customer_id = auth.uid() or helper_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists bookings_customer_create on public.bookings;
create policy bookings_customer_create on public.bookings
for insert with check (customer_id = auth.uid());

drop policy if exists bookings_actor_update on public.bookings;
create policy bookings_actor_update on public.bookings
for update using (customer_id = auth.uid() or helper_id = auth.uid() or public.is_admin(auth.uid()))
with check (customer_id = auth.uid() or helper_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists booking_media_access on public.booking_media;
create policy booking_media_access on public.booking_media
for select using (public.can_access_booking(auth.uid(), booking_id) or public.is_admin(auth.uid()));

drop policy if exists booking_media_insert on public.booking_media;
create policy booking_media_insert on public.booking_media
for insert with check (
  uploader_id = auth.uid()
  and public.can_access_booking(auth.uid(), booking_id)
);

drop policy if exists booking_events_access on public.booking_events;
create policy booking_events_access on public.booking_events
for select using (public.can_access_booking(auth.uid(), booking_id) or public.is_admin(auth.uid()));

drop policy if exists booking_events_insert on public.booking_events;
create policy booking_events_insert on public.booking_events
for insert with check (
  actor_id = auth.uid() and public.can_access_booking(auth.uid(), booking_id)
);

drop policy if exists messages_access on public.messages;
create policy messages_access on public.messages
for select using (public.can_access_booking(auth.uid(), booking_id) or public.is_admin(auth.uid()));

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
for insert with check (
  sender_id = auth.uid() and public.can_access_booking(auth.uid(), booking_id)
);

drop policy if exists reviews_access on public.reviews;
create policy reviews_access on public.reviews
for select using (public.can_access_booking(auth.uid(), booking_id) or public.is_admin(auth.uid()));

drop policy if exists reviews_customer_insert on public.reviews;
create policy reviews_customer_insert on public.reviews
for insert with check (
  customer_id = auth.uid()
  and exists (
    select 1 from public.bookings b
    where b.id = booking_id
      and b.customer_id = auth.uid()
      and b.helper_id = helper_id
      and b.status = 'paid'
  )
);

drop policy if exists payments_booking_access on public.payments;
create policy payments_booking_access on public.payments
for select using (public.can_access_booking(auth.uid(), booking_id) or public.is_admin(auth.uid()));

drop policy if exists payments_actor_write on public.payments;
create policy payments_actor_write on public.payments
for insert with check (public.can_access_booking(auth.uid(), booking_id) or public.is_admin(auth.uid()));

drop policy if exists audit_logs_admin_only on public.audit_logs;
create policy audit_logs_admin_only on public.audit_logs
for select using (public.is_admin(auth.uid()));

drop policy if exists audit_logs_insert_self_or_admin on public.audit_logs;
create policy audit_logs_insert_self_or_admin on public.audit_logs
for insert with check (actor_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists app_settings_admin_only on public.app_settings;
create policy app_settings_admin_only on public.app_settings
for all using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists user_devices_owner on public.user_devices;
create policy user_devices_owner on public.user_devices
for all using (user_id = auth.uid() or public.is_admin(auth.uid()))
with check (user_id = auth.uid() or public.is_admin(auth.uid()));
