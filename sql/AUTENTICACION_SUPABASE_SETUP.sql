-- Ejecutar en Supabase SQL Editor antes de migrar las cuentas a Supabase Auth.
-- Crear una cuenta por empleado en Authentication y luego asociar su UUID aquí.
-- Usar roles canónicos que consume la aplicación: admin, superadmin, vendedor,
-- inventario, contabilidad o cliente.

create table if not exists public.user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  role text not null check (
    role in ('admin', 'superadmin', 'vendedor', 'inventario', 'contabilidad', 'cliente')
  ),
  nombre text,
  telefono text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

revoke all on table public.user_profiles from public, anon, authenticated;
grant select on table public.user_profiles to authenticated;

drop policy if exists "Users can read their own active profile" on public.user_profiles;
create policy "Users can read their own active profile"
  on public.user_profiles
  for select
  to authenticated
  using (id = (select auth.uid()) and activo = true);

create or replace function public.has_app_role(required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_profiles
    where id = (select auth.uid())
      and activo = true
      and role = any (required_roles)
  );
$$;

revoke all on function public.has_app_role(text[]) from public, anon;
grant execute on function public.has_app_role(text[]) to authenticated;

-- Bloquear el acceso desde el navegador a las tablas heredadas que contienen
-- passwords en texto plano. Se consideran únicamente tablas comunes con
-- una columna "password"; sus contraseñas no deben volver a utilizarse.
do $$
declare
  legacy_table text;
  has_active_column boolean;
begin
  for legacy_table in
    select table_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name in ('users', 'usuarios')
      and column_name = 'password'
    group by table_name
  loop
    execute format('alter table public.%I enable row level security', legacy_table);
    execute format('revoke all on table public.%I from public, anon, authenticated', legacy_table);

    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = legacy_table
        and column_name = 'id'
    ) and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = legacy_table
        and column_name = 'nombre'
    ) then
      execute format('grant select (id, nombre) on table public.%I to authenticated', legacy_table);
      select exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = legacy_table
          and column_name = 'activo'
      ) into has_active_column;

      execute format('drop policy if exists "Authenticated users can read account names" on public.%I', legacy_table);
      if has_active_column then
        execute format(
          'create policy "Authenticated users can read account names" on public.%I for select to authenticated using (activo is true and public.has_app_role(array[''admin'', ''superadmin'', ''vendedor'', ''inventario'', ''contabilidad'', ''cliente'']))',
          legacy_table
        );
      else
        execute format(
          'create policy "Authenticated users can read account names" on public.%I for select to authenticated using (public.has_app_role(array[''admin'', ''superadmin'', ''vendedor'', ''inventario'', ''contabilidad'', ''cliente'']))',
          legacy_table
        );
      end if;
    end if;
  end loop;
end
$$;

-- Provisioning pattern (replace UUIDs/usernames with the newly created Auth users):
-- insert into public.user_profiles (id, username, role, nombre)
-- values
--   ('<auth-user-uuid>', 'edwin', 'admin', 'Edwin Marín');
