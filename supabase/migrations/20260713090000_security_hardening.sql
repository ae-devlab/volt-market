-- Security hardening (from the security review):
-- is_admin(uid) is exposed by PostgREST as an RPC and is SECURITY DEFINER, so a caller
-- could probe ANY user's admin status by passing an arbitrary uid. This keeps the exact
-- same signature (so all existing RLS policies + the moderation trigger keep working via
-- the default auth.uid()), but adds a guard: a non-admin may only learn their OWN status.
create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if uid is distinct from auth.uid()
     and not exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin') then
    return false;  -- do not leak another user's admin status to a non-admin
  end if;
  return exists (
    select 1 from public.user_roles where user_id = uid and role = 'admin'
  );
end;
$$;
