-- CERRAR LAS PUERTAS ABIERTAS DE LA BASE DE DATOS (informe de seguridad 23/10/2026)
-- Ejecutar en Supabase SQL Editor, después de AUTENTICACION_SUPABASE_SETUP.sql
-- (crea has_app_role) y de SEGURIDAD_PRODUCTOS_RLS.sql.
--
-- Regla general: sin iniciar sesión no se lee ni se cambia nada, excepto
-- productos (catálogo público, solo lectura) y la creación de pedidos.
-- Cada grupo de tablas queda solo para los roles que usan esas pantallas.
--
-- Probar la app con cada rol después de ejecutarlo. Si una pantalla deja de
-- cargar, el error aparece en la consola del navegador (F12) como
-- "permission denied" o "row-level security".

-- Aplica RLS y reemplaza todas las políticas de una tabla.
--   lectura / escritura / borrado: roles de la app con ese permiso
create or replace function pg_temp.proteger_tabla(
  tabla text,
  lectura text[],
  escritura text[],
  borrado text[]
) returns void
language plpgsql
as $$
declare
  politica record;
  tipo "char";
begin
  select c.relkind into tipo
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = tabla;

  if tipo is null then
    raise notice 'Tabla % no existe, se omite', tabla;
    return;
  end if;

  -- Las vistas no admiten RLS. Una vista normal debe aplicar los permisos
  -- y las políticas RLS de las tablas subyacentes.
  if tipo = 'v' then
    execute format('alter view public.%I set (security_invoker = true)', tabla);
    execute format('revoke all on table public.%I from public, anon', tabla);
    execute format('grant select on table public.%I to authenticated', tabla);
    raise notice '% es una vista: se protegió sin RLS', tabla;
    return;
  end if;

  -- Una vista materializada no puede usar security_invoker ni RLS y puede
  -- exponer datos ya materializados. Se bloquea hasta revisar su necesidad.
  if tipo = 'm' then
    execute format('revoke all on table public.%I from public, anon, authenticated', tabla);
    raise notice '% es una vista materializada: se bloqueó para revisión', tabla;
    return;
  end if;

  -- Solo tablas ordinarias y particionadas admiten las políticas de este helper.
  if tipo not in ('r', 'p') then
    execute format('revoke all on table public.%I from public, anon, authenticated', tabla);
    raise notice '% no es una tabla compatible: se bloqueó para revisión', tabla;
    return;
  end if;

  execute format('alter table public.%I enable row level security', tabla);

  for politica in
    select policyname from pg_policies where schemaname = 'public' and tablename = tabla
  loop
    execute format('drop policy %I on public.%I', politica.policyname, tabla);
  end loop;

  execute format('revoke all on table public.%I from public, anon', tabla);
  execute format('grant select, insert, update, delete on table public.%I to authenticated', tabla);

  execute format(
    'create policy "app_leer" on public.%I for select to authenticated using (public.has_app_role(%L::text[]))',
    tabla, lectura);
  execute format(
    'create policy "app_crear" on public.%I for insert to authenticated with check (public.has_app_role(%L::text[]))',
    tabla, escritura);
  execute format(
    'create policy "app_modificar" on public.%I for update to authenticated using (public.has_app_role(%L::text[])) with check (public.has_app_role(%L::text[]))',
    tabla, escritura, escritura);
  execute format(
    'create policy "app_borrar" on public.%I for delete to authenticated using (public.has_app_role(%L::text[]))',
    tabla, borrado);
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. BÓVEDA DE CREDENCIALES Y PLATAFORMAS (solo admin y superadmin)
-- ---------------------------------------------------------------------------
select pg_temp.proteger_tabla(t, array['admin','superadmin'], array['admin','superadmin'], array['admin','superadmin'])
from unnest(array[
  'credenciales_plataforma', 'auditoria_credenciales', 'auditoria_consultas_credenciales',
  'plataformas_arriendo', 'clientes_plataforma', 'pagos_plataforma'
]) as t;

-- Las funciones de la bóveda ya no se pueden llamar sin sesión
do $$
begin
  if to_regprocedure('public.guardar_credencial_segura(uuid, text, text, text, text, text, text)') is not null then
    revoke all on function public.guardar_credencial_segura(uuid, text, text, text, text, text, text) from public, anon;
    grant execute on function public.guardar_credencial_segura(uuid, text, text, text, text, text, text) to authenticated;
  end if;
  if to_regprocedure('public.consultar_credenciales_seguras(text, text)') is not null then
    revoke all on function public.consultar_credenciales_seguras(text, text) from public, anon;
    grant execute on function public.consultar_credenciales_seguras(text, text) to authenticated;
  end if;
end
$$;

-- Las vistas se saltan el RLS de sus tablas: que respeten los permisos de quien consulta
do $$
declare
  vista text;
  tipo "char";
begin
  foreach vista in array array['vista_control_plataformas_arriendo', 'vista_seguimiento_credenciales'] loop
    select c.relkind into tipo
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = vista;

    if tipo = 'v' then
      execute format('alter view public.%I set (security_invoker = true)', vista);
      execute format('revoke all on table public.%I from public, anon', vista);
      execute format('grant select on table public.%I to authenticated', vista);
    elsif tipo = 'm' then
      execute format('revoke all on table public.%I from public, anon, authenticated', vista);
      raise notice '% es una vista materializada: se bloqueó para revisión', vista;
    end if;
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- 2. INMUEBLES (solo admin y superadmin)
-- ---------------------------------------------------------------------------
select pg_temp.proteger_tabla(t, array['admin','superadmin'], array['admin','superadmin'], array['admin','superadmin'])
from unnest(array[
  'inmuebles', 'compras_inmuebles', 'abonos_inmueble', 'gastos_inmueble',
  'pagos_arriendo', 'servicios_publicos'
]) as t;

-- ---------------------------------------------------------------------------
-- 3. CONTABILIDAD: proveedores y gastos
-- ---------------------------------------------------------------------------
select pg_temp.proteger_tabla(t, array['admin','superadmin','contabilidad'], array['admin','superadmin','contabilidad'], array['admin','superadmin'])
from unnest(array['proveedores', 'facturas_proveedores', 'pagos_proveedores']) as t;

-- /gastos también lo usa el vendedor
select pg_temp.proteger_tabla('gastos_empresa',
  array['admin','superadmin','contabilidad','vendedor'],
  array['admin','superadmin','contabilidad','vendedor'],
  array['admin','superadmin']);

-- ---------------------------------------------------------------------------
-- 4. NEGOCIO: clientes, facturas, abonos y operación (todo el equipo)
-- ---------------------------------------------------------------------------
select pg_temp.proteger_tabla(t,
  array['admin','superadmin','vendedor','inventario','contabilidad'],
  array['admin','superadmin','vendedor','inventario','contabilidad'],
  array['admin','superadmin'])
from unnest(array[
  'clientes', 'facturas', 'abonos', 'preparaciones_pedidos', 'historial_inventario',
  'inventario_revisiones', 'visits_cobro'
]) as t;

-- Auditoría de productos: la consultan admin, superadmin e inventario; la escribe todo el equipo
select pg_temp.proteger_tabla('auditoria_productos',
  array['admin','superadmin','inventario'],
  array['admin','superadmin','vendedor','inventario','contabilidad'],
  array['superadmin']);

-- ---------------------------------------------------------------------------
-- 5. PEDIDOS: el catálogo público crea pedidos sin iniciar sesión
-- ---------------------------------------------------------------------------
select pg_temp.proteger_tabla('pedidos',
  array['admin','superadmin','vendedor','inventario','contabilidad'],
  array['admin','superadmin','vendedor','inventario','contabilidad'],
  array['admin','superadmin']);

-- Un visitante puede crear pedidos nuevos (solo en estado pendiente)
grant insert, select on table public.pedidos to anon;
create policy "publico_crear_pedido" on public.pedidos
  for insert to anon
  with check (estado = 'pendiente');

-- La app lee el número del pedido recién creado y revisa si un pedido sin
-- conexión ya llegó. Para eso el visitante solo ve pedidos de los últimos
-- 10 minutos. MEDIDA TEMPORAL: reemplazar por una función crear_pedido_publico
-- (ver informe) y luego borrar esta política.
create policy "publico_ver_pedido_reciente" on public.pedidos
  for select to anon
  using (fecha_creacion >= now() - interval '10 minutes');

-- ---------------------------------------------------------------------------
-- 6. VERIFICACIÓN: tablas que todavía se pueden leer o cambiar sin sesión
--    Debe salir solo productos (lectura) y pedidos (crear).
-- ---------------------------------------------------------------------------
select
  c.relname as tabla,
  c.relrowsecurity as rls_activo,
  has_table_privilege('anon', c.oid, 'SELECT') as anon_lee,
  has_table_privilege('anon', c.oid, 'INSERT') as anon_crea,
  has_table_privilege('anon', c.oid, 'UPDATE') as anon_modifica,
  has_table_privilege('anon', c.oid, 'DELETE') as anon_borra
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r', 'p')
  and (not c.relrowsecurity
       or has_table_privilege('anon', c.oid, 'SELECT')
       or has_table_privilege('anon', c.oid, 'INSERT')
       or has_table_privilege('anon', c.oid, 'UPDATE')
       or has_table_privilege('anon', c.oid, 'DELETE'))
order by c.relname;

-- Las vistas no admiten RLS. Esta consulta detecta las vistas que aún
-- tienen privilegios directos para anon; lo esperado es cero filas.
select
  c.relname as vista,
  has_table_privilege('anon', c.oid, 'SELECT') as anon_lee
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'v'
  and has_table_privilege('anon', c.oid, 'SELECT')
order by c.relname;
