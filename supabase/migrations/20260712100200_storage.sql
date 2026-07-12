-- VoltMarket — Storage buckets + policies
-- Two public-read buckets. Writes are restricted to the uploader's own folder ("{uid}/...").

insert into storage.buckets (id, name, public)
values
  ('listing-images', 'listing-images', true),
  ('avatars',        'avatars',        true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- public read for both buckets
-- ---------------------------------------------------------------------------
drop policy if exists storage_public_read on storage.objects;
create policy storage_public_read on storage.objects
  for select
  using (bucket_id in ('listing-images', 'avatars'));

-- ---------------------------------------------------------------------------
-- authenticated users may write only inside their own "{uid}/" folder
-- ---------------------------------------------------------------------------
drop policy if exists storage_insert_own on storage.objects;
create policy storage_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('listing-images', 'avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists storage_update_own on storage.objects;
create policy storage_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id in ('listing-images', 'avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists storage_delete_own_or_admin on storage.objects;
create policy storage_delete_own_or_admin on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('listing-images', 'avatars')
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
