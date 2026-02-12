insert into public.service_categories (name, description, icon_key)
values
  ('Cleaning', 'Home and office cleaning', 'cleaning'),
  ('Plumbing', 'Leak, fitting, and pipe work', 'plumbing'),
  ('Electrical', 'Wiring, switches, and repairs', 'electrical')
on conflict (name) do nothing;

insert into public.service_zones (name, city, country, is_active)
values
  ('Koramangala', 'Bangalore', 'India', true),
  ('HSR Layout', 'Bangalore', 'India', true),
  ('Indiranagar', 'Bangalore', 'India', true),
  ('Whitefield', 'Bangalore', 'India', true)
on conflict do nothing;

insert into public.app_settings (key, value)
values ('commission', '{"default_percent":15}'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

insert into public.subscription_plans (code, name, monthly_price, features, is_active)
values
  ('premium_monthly', 'Premium Monthly', 299.00, '["priority_matching","faster_dispatch_sla","discount_coupons","free_rework_window"]'::jsonb, true)
on conflict (code) do update
set monthly_price = excluded.monthly_price,
    features = excluded.features,
    is_active = excluded.is_active;
