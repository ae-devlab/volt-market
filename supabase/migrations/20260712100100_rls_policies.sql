-- VoltMarket — Row Level Security policies + admin helper
-- Security model: the frontend is untrusted; these policies are the real access control.

-- ---------------------------------------------------------------------------
-- is_admin(): SECURITY DEFINER so it bypasses RLS on user_roles (no recursion)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = uid and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- enable RLS on every table
-- ---------------------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.categories     enable row level security;
alter table public.listings       enable row level security;
alter table public.listing_images enable row level security;
alter table public.favorites      enable row level security;
alter table public.user_roles     enable row level security;

-- ---------------------------------------------------------------------------
-- profiles: public read, self write
-- ---------------------------------------------------------------------------
drop policy if exists profiles_select_all on public.profiles;
create policy profiles_select_all on public.profiles
  for select using (true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- categories: public read, admin write
-- ---------------------------------------------------------------------------
drop policy if exists categories_select_all on public.categories;
create policy categories_select_all on public.categories
  for select using (true);

drop policy if exists categories_admin_write on public.categories;
create policy categories_admin_write on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- listings: approved visible to all; owner sees own; admin sees all
-- ---------------------------------------------------------------------------
drop policy if exists listings_select_visible on public.listings;
create policy listings_select_visible on public.listings
  for select using (
    status = 'approved' or seller_id = auth.uid() or public.is_admin()
  );

drop policy if exists listings_insert_own on public.listings;
create policy listings_insert_own on public.listings
  for insert with check (seller_id = auth.uid() or public.is_admin());

drop policy if exists listings_update_own_or_admin on public.listings;
create policy listings_update_own_or_admin on public.listings
  for update using (seller_id = auth.uid() or public.is_admin())
  with check (seller_id = auth.uid() or public.is_admin());

drop policy if exists listings_delete_own_or_admin on public.listings;
create policy listings_delete_own_or_admin on public.listings
  for delete using (seller_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- listing_images: follow the visibility/ownership of the parent listing
-- ---------------------------------------------------------------------------
drop policy if exists listing_images_select on public.listing_images;
create policy listing_images_select on public.listing_images
  for select using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id
        and (l.status = 'approved' or l.seller_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists listing_images_insert on public.listing_images;
create policy listing_images_insert on public.listing_images
  for insert with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and (l.seller_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists listing_images_delete on public.listing_images;
create policy listing_images_delete on public.listing_images
  for delete using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and (l.seller_id = auth.uid() or public.is_admin())
    )
  );

-- ---------------------------------------------------------------------------
-- favorites: strictly per-user
-- ---------------------------------------------------------------------------
drop policy if exists favorites_select_own on public.favorites;
create policy favorites_select_own on public.favorites
  for select using (user_id = auth.uid());

drop policy if exists favorites_insert_own on public.favorites;
create policy favorites_insert_own on public.favorites
  for insert with check (user_id = auth.uid());

drop policy if exists favorites_delete_own on public.favorites;
create policy favorites_delete_own on public.favorites
  for delete using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- user_roles: user reads own roles; only admins can grant/revoke
-- (bootstrap the first admin manually — see supabase/seed.sql)
-- ---------------------------------------------------------------------------
drop policy if exists user_roles_select on public.user_roles;
create policy user_roles_select on public.user_roles
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists user_roles_insert_admin on public.user_roles;
create policy user_roles_insert_admin on public.user_roles
  for insert with check (public.is_admin());

drop policy if exists user_roles_update_admin on public.user_roles;
create policy user_roles_update_admin on public.user_roles
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists user_roles_delete_admin on public.user_roles;
create policy user_roles_delete_admin on public.user_roles
  for delete using (public.is_admin());
