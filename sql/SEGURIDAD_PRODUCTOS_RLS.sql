-- PROTEGER LA TABLA productos CON ROW LEVEL SECURITY
-- Ejecutar después de AUTENTICACION_SUPABASE_SETUP.sql (crea has_app_role).
--
-- Quién puede hacer qué:
--   Leer productos ............ todos (el catálogo es público)
--   Crear / modificar ......... admin, superadmin, inventario, vendedor
--                               (vendedor e inventario descuentan stock al facturar)
--   Eliminar .................. admin, superadmin
--   Visitante sin sesión ...... solo leer: ya no puede cambiar imágenes, precios ni nada
--
-- Las funciones de inventario (registrar_movimiento_inventario, etc.) son
-- security definer y siguen funcionando.

alter table public.productos enable row level security;

-- Quitar cualquier política anterior (una política "permitir todo" deja la tabla abierta)
do $$
declare
  politica record;
begin
  for politica in
    select policyname from pg_policies where schemaname = 'public' and tablename = 'productos'
  loop
    execute format('drop policy %I on public.productos', politica.policyname);
  end loop;
end
$$;

revoke insert, update, delete on table public.productos from anon, public;
grant select on table public.productos to anon, authenticated;
grant insert, update, delete on table public.productos to authenticated;

create policy "catalogo publico puede leer productos"
  on public.productos for select to anon, authenticated
  using (true);

create policy "equipo puede crear productos"
  on public.productos for insert to authenticated
  with check (public.has_app_role(array['admin', 'superadmin', 'inventario', 'vendedor']));

create policy "equipo puede modificar productos"
  on public.productos for update to authenticated
  using (public.has_app_role(array['admin', 'superadmin', 'inventario', 'vendedor']))
  with check (public.has_app_role(array['admin', 'superadmin', 'inventario', 'vendedor']));

create policy "administradores pueden eliminar productos"
  on public.productos for delete to authenticated
  using (public.has_app_role(array['admin', 'superadmin']));

-- AUDITORÍA DESDE LA BASE DE DATOS
-- Registra en auditoria_productos todo cambio de nombre, precio, imagen, descripción,
-- categoría o estado, venga de la app o directamente de la API. Así queda constancia
-- de quién cambió una imagen aunque no use la pantalla del catálogo.
-- (Los cambios de stock no se registran aquí: ya quedan en movimientos_inventario.)
create or replace function public.auditar_cambios_productos()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  claims jsonb := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
  antes jsonb := to_jsonb(old);
  despues jsonb := to_jsonb(new);
  cambios jsonb := '{}'::jsonb;
  campo text;
begin
  foreach campo in array array['nombre', 'precio', 'imagen_url', 'descripcion', 'categoria', 'activo', 'codigo'] loop
    if (antes -> campo) is distinct from (despues -> campo) then
      cambios := cambios || jsonb_build_object(campo, jsonb_build_object('antes', antes -> campo, 'despues', despues -> campo));
    end if;
  end loop;

  if cambios = '{}'::jsonb then
    return new;
  end if;

  insert into public.auditoria_productos (producto_id, tipo_accion, campos_modificados, cambios_resumen, usuario, rol_usuario)
  values (
    new.id,
    'edicion_bd',
    cambios,
    'Registrado por la base de datos: ' || (select string_agg(k, ', ') from jsonb_object_keys(cambios) as k),
    coalesce(claims ->> 'email', 'sin sesión'),
    coalesce(claims ->> 'role', 'sql_editor')
  );

  return new;
end;
$$;

drop trigger if exists auditar_cambios_productos on public.productos;
create trigger auditar_cambios_productos
  after update on public.productos
  for each row execute function public.auditar_cambios_productos();

-- Verificar: debe mostrar rls_activo = true y anon_puede_modificar = false
select
  c.relrowsecurity as rls_activo,
  has_table_privilege('anon', c.oid, 'UPDATE') as anon_puede_modificar
from pg_class c
where c.oid = 'public.productos'::regclass;
