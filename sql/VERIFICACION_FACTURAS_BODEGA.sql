-- Permite al rol de bodega (inventario) usar la verificación de facturas físicas.
-- Ejecutar después de VERIFICACION_FACTURAS_FISICAS_SETUP.sql.

drop policy if exists "admins can read invoice checks" on public.verificacion_facturas_fisicas;
drop policy if exists "admins can create invoice checks" on public.verificacion_facturas_fisicas;
drop policy if exists "admins can delete invoice checks" on public.verificacion_facturas_fisicas;

create policy "admins can read invoice checks"
  on public.verificacion_facturas_fisicas for select to authenticated
  using (public.has_app_role(array['admin', 'superadmin', 'contabilidad', 'inventario']));
create policy "admins can create invoice checks"
  on public.verificacion_facturas_fisicas for insert to authenticated
  with check (public.has_app_role(array['admin', 'superadmin', 'contabilidad', 'inventario']));
create policy "admins can delete invoice checks"
  on public.verificacion_facturas_fisicas for delete to authenticated
  using (public.has_app_role(array['admin', 'superadmin', 'contabilidad', 'inventario']));

-- Revisar el rol de las dos cuentas de bodega (debe decir 'inventario' y activo = true)
select u.email, p.username, p.nombre, p.role, p.activo
from auth.users u
left join public.user_profiles p on p.id = u.id
where lower(u.email) in ('2sharonikole4@gmail.com', 'kevinvanegas789@gmail.com');

-- Si alguna sale con otro rol o sin perfil, asignar el rol de bodega:
-- update public.user_profiles set role = 'inventario', activo = true
-- where id in (
--   select id from auth.users
--   where lower(email) in ('2sharonikole4@gmail.com', 'kevinvanegas789@gmail.com')
-- );
