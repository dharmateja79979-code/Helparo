-- Marketplace extensions: disputes, premium subscriptions, corporate bookings, AI estimates, escrow hooks

do $$
begin
  if not exists (select 1 from pg_type where typname = 'dispute_status') then
    create type public.dispute_status as enum ('open','investigating','resolved','rejected');
  end if;
  if not exists (select 1 from pg_type where typname = 'subscription_status') then
    create type public.subscription_status as enum ('active','cancelled','expired','trial');
  end if;
  if not exists (select 1 from pg_type where typname = 'corporate_role') then
    create type public.corporate_role as enum ('owner','manager','member');
  end if;
  if not exists (select 1 from pg_type where typname = 'estimate_status') then
    create type public.estimate_status as enum ('pending','completed','failed');
  end if;
  if not exists (select 1 from pg_type where typname = 'escrow_status') then
    create type public.escrow_status as enum ('na','held','released','refunded');
  end if;
end $$;

alter table public.payments
  add column if not exists escrow_status public.escrow_status not null default 'na',
  add column if not exists escrow_held_at timestamptz,
  add column if not exists escrow_released_at timestamptz;

create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  raised_by uuid not null references public.users(id),
  reason text not null,
  evidence jsonb not null default '[]'::jsonb,
  status public.dispute_status not null default 'open',
  resolution_note text,
  resolved_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  monthly_price numeric(10,2) not null check (monthly_price >= 0),
  features jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id),
  status public.subscription_status not null default 'active',
  started_at timestamptz not null default now(),
  ends_at timestamptz,
  provider_ref text,
  created_at timestamptz not null default now()
);

create table if not exists public.corporate_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  is_active boolean not null default true,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.corporate_members (
  id uuid primary key default gen_random_uuid(),
  corporate_id uuid not null references public.corporate_accounts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.corporate_role not null default 'member',
  created_at timestamptz not null default now(),
  unique(corporate_id, user_id)
);

create table if not exists public.corporate_bookings (
  id uuid primary key default gen_random_uuid(),
  corporate_id uuid not null references public.corporate_accounts(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  requested_by uuid not null references public.users(id),
  cost_center text,
  created_at timestamptz not null default now(),
  unique(corporate_id, booking_id)
);

create table if not exists public.ai_issue_estimates (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  requested_by uuid not null references public.users(id),
  input_media jsonb not null default '[]'::jsonb,
  result jsonb,
  status public.estimate_status not null default 'pending',
  model_key text default 'extensions_stub',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_disputes_updated_at on public.disputes;
create trigger trg_disputes_updated_at
before update on public.disputes
for each row execute function public.set_updated_at();

drop trigger if exists trg_ai_estimates_updated_at on public.ai_issue_estimates;
create trigger trg_ai_estimates_updated_at
before update on public.ai_issue_estimates
for each row execute function public.set_updated_at();

alter table public.disputes enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.corporate_accounts enable row level security;
alter table public.corporate_members enable row level security;
alter table public.corporate_bookings enable row level security;
alter table public.ai_issue_estimates enable row level security;

drop policy if exists disputes_access on public.disputes;
create policy disputes_access on public.disputes
for select using (
  public.is_admin(auth.uid())
  or exists (
    select 1 from public.bookings b
    where b.id = booking_id and (b.customer_id = auth.uid() or b.helper_id = auth.uid())
  )
);

drop policy if exists disputes_create on public.disputes;
create policy disputes_create on public.disputes
for insert with check (
  raised_by = auth.uid()
  and exists (
    select 1 from public.bookings b
    where b.id = booking_id and (b.customer_id = auth.uid() or b.helper_id = auth.uid())
  )
);

drop policy if exists disputes_admin_update on public.disputes;
create policy disputes_admin_update on public.disputes
for update using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists subscription_plans_public_read on public.subscription_plans;
create policy subscription_plans_public_read on public.subscription_plans
for select using (true);

drop policy if exists user_subscriptions_owner_read on public.user_subscriptions;
create policy user_subscriptions_owner_read on public.user_subscriptions
for select using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists user_subscriptions_owner_insert on public.user_subscriptions;
create policy user_subscriptions_owner_insert on public.user_subscriptions
for insert with check (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists corporate_accounts_member_read on public.corporate_accounts;
create policy corporate_accounts_member_read on public.corporate_accounts
for select using (
  public.is_admin(auth.uid())
  or exists (
    select 1 from public.corporate_members cm
    where cm.corporate_id = id and cm.user_id = auth.uid()
  )
);

drop policy if exists corporate_accounts_owner_insert on public.corporate_accounts;
create policy corporate_accounts_owner_insert on public.corporate_accounts
for insert with check (created_by = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists corporate_members_member_read on public.corporate_members;
create policy corporate_members_member_read on public.corporate_members
for select using (
  public.is_admin(auth.uid())
  or user_id = auth.uid()
  or exists (
    select 1 from public.corporate_members cm
    where cm.corporate_id = corporate_id and cm.user_id = auth.uid()
  )
);

drop policy if exists corporate_members_owner_write on public.corporate_members;
create policy corporate_members_owner_write on public.corporate_members
for all using (
  public.is_admin(auth.uid())
  or exists (
    select 1 from public.corporate_members cm
    where cm.corporate_id = corporate_id and cm.user_id = auth.uid() and cm.role in ('owner','manager')
  )
)
with check (
  public.is_admin(auth.uid())
  or exists (
    select 1 from public.corporate_members cm
    where cm.corporate_id = corporate_id and cm.user_id = auth.uid() and cm.role in ('owner','manager')
  )
);

drop policy if exists corporate_bookings_member_read on public.corporate_bookings;
create policy corporate_bookings_member_read on public.corporate_bookings
for select using (
  public.is_admin(auth.uid())
  or exists (
    select 1 from public.corporate_members cm
    where cm.corporate_id = corporate_id and cm.user_id = auth.uid()
  )
);

drop policy if exists corporate_bookings_member_insert on public.corporate_bookings;
create policy corporate_bookings_member_insert on public.corporate_bookings
for insert with check (
  requested_by = auth.uid()
  and exists (
    select 1 from public.corporate_members cm
    where cm.corporate_id = corporate_id and cm.user_id = auth.uid()
  )
);

drop policy if exists ai_estimates_access on public.ai_issue_estimates;
create policy ai_estimates_access on public.ai_issue_estimates
for select using (
  requested_by = auth.uid()
  or public.is_admin(auth.uid())
  or (booking_id is not null and public.can_access_booking(auth.uid(), booking_id))
);

drop policy if exists ai_estimates_create on public.ai_issue_estimates;
create policy ai_estimates_create on public.ai_issue_estimates
for insert with check (
  requested_by = auth.uid()
  and (
    booking_id is null
    or public.can_access_booking(auth.uid(), booking_id)
  )
);
