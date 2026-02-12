create table if not exists public.auth_identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  provider text not null,
  external_uid text not null,
  created_at timestamptz not null default now(),
  unique(provider, external_uid)
);

alter table public.auth_identities enable row level security;

drop policy if exists auth_identities_admin_only on public.auth_identities;
create policy auth_identities_admin_only on public.auth_identities
for all using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));
