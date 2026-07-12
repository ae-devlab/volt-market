-- VoltMarket — initial schema
-- Tables: profiles, categories, listings, listing_images, favorites, user_roles

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique,
  full_name   text,
  avatar_url  text,
  phone       text,
  location    text,
  bio         text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- categories (EV body types)
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id    bigint generated always as identity primary key,
  name  text not null,
  slug  text not null unique,
  icon  text
);

-- ---------------------------------------------------------------------------
-- listings
-- ---------------------------------------------------------------------------
create table if not exists public.listings (
  id                    bigint generated always as identity primary key,
  seller_id             uuid   not null references public.profiles(id) on delete cascade,
  category_id           bigint references public.categories(id) on delete set null,
  title                 text   not null,
  brand                 text,
  model                 text,
  year                  int,
  price                 numeric(12,2) not null default 0,
  mileage_km            int,
  battery_capacity_kwh  numeric(6,2),
  range_km              int,
  condition             text not null default 'used'    check (condition in ('new','used')),
  location              text,
  description           text,
  status                text not null default 'pending' check (status in ('pending','approved','rejected','sold')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- listing_images
-- ---------------------------------------------------------------------------
create table if not exists public.listing_images (
  id           bigint generated always as identity primary key,
  listing_id   bigint  not null references public.listings(id) on delete cascade,
  storage_path text    not null,
  is_primary   boolean not null default false,
  sort_order   int     not null default 0,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- favorites (many-to-many profiles <-> listings)
-- ---------------------------------------------------------------------------
create table if not exists public.favorites (
  id          bigint generated always as identity primary key,
  user_id     uuid   not null references public.profiles(id) on delete cascade,
  listing_id  bigint not null references public.listings(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, listing_id)
);

-- ---------------------------------------------------------------------------
-- user_roles (RBAC)
-- ---------------------------------------------------------------------------
create table if not exists public.user_roles (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null check (role in ('admin')),
  created_at  timestamptz not null default now(),
  unique (user_id, role)
);

-- ---------------------------------------------------------------------------
-- indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_listings_status         on public.listings(status);
create index if not exists idx_listings_category        on public.listings(category_id);
create index if not exists idx_listings_seller          on public.listings(seller_id);
create index if not exists idx_listings_created_at      on public.listings(created_at desc);
create index if not exists idx_listing_images_listing   on public.listing_images(listing_id);
create index if not exists idx_favorites_user           on public.favorites(user_id);

-- ---------------------------------------------------------------------------
-- keep listings.updated_at fresh
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_listings_updated on public.listings;
create trigger trg_listings_updated
  before update on public.listings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- auto-create a profile row whenever an auth user signs up
-- (username / full_name are passed via auth signUp options.data)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- admin check helper — SECURITY DEFINER so it bypasses RLS on user_roles
-- (defined here because the moderation trigger below depends on it)
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
-- moderation rules enforced server-side (defense in depth vs. the client)
--  * non-admins: new listings are forced to 'pending', seller_id forced to self
--  * non-admins cannot self-approve/-reject; only 'approved' <-> 'sold' toggling allowed
--  * ownership can never be reassigned by a non-admin
-- ---------------------------------------------------------------------------
create or replace function public.enforce_listing_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if not public.is_admin() then
      new.status    := 'pending';
      new.seller_id := auth.uid();
    end if;
  elsif tg_op = 'UPDATE' then
    if not public.is_admin() then
      new.seller_id := old.seller_id;               -- cannot change owner
      if new.status is distinct from old.status then
        if (new.status = 'sold'     and old.status = 'approved')
        or (new.status = 'approved' and old.status = 'sold') then
          null;                                      -- allowed toggle for the owner
        else
          new.status := old.status;                 -- ignore any illegal status change
        end if;
      end if;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_listings_rules on public.listings;
create trigger trg_listings_rules
  before insert or update on public.listings
  for each row execute function public.enforce_listing_rules();
