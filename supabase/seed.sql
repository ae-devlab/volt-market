-- VoltMarket — seed data
-- Safe to run multiple times.

insert into public.categories (name, slug, icon) values
  ('Седан',   'sedan',     'bi-car-front'),
  ('SUV',     'suv',       'bi-truck'),
  ('Хечбек',  'hatchback', 'bi-car-front-fill'),
  ('Купе',    'coupe',     'bi-car-front'),
  ('Пикап',   'pickup',    'bi-truck-flatbed'),
  ('Ван',     'van',       'bi-truck-front')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Bootstrap the first admin (run ONCE, after you registered the admin user
-- through the app). Replace the email, then run this snippet in the SQL Editor:
--
--   insert into public.user_roles (user_id, role)
--   select id, 'admin' from auth.users where email = 'admin@voltmarket.dev'
--   on conflict (user_id, role) do nothing;
-- ---------------------------------------------------------------------------
