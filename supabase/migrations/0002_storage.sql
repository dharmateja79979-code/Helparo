-- Storage policies for booking media
insert into storage.buckets (id, name, public)
values ('booking-media', 'booking-media', false)
on conflict (id) do nothing;

drop policy if exists "booking media read by actors" on storage.objects;
create policy "booking media read by actors"
on storage.objects for select
to authenticated
using (
  bucket_id = 'booking-media'
  and exists (
    select 1
    from public.booking_media bm
    join public.bookings b on b.id = bm.booking_id
    where bm.storage_path = name
      and (b.customer_id = auth.uid() or b.helper_id = auth.uid() or public.is_admin(auth.uid()))
  )
);

-- Writes happen through signed upload URLs generated server-side (service role).
