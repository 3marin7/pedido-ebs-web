-- DIAGNÓSTICO DE SEGURIDAD (solo lectura: no cambia nada)
-- Ejecutar en Supabase SQL Editor y revisar los resultados.

-- 1. Estado de cada tabla.
--    rls_activo = false            → la tabla NO tiene Row Level Security
--    anon_puede_modificar = true   → con la clave pública de la app (sin iniciar sesión)
--                                    se podría modificar esa tabla si RLS está apagado
select
  c.relname as tabla,
  c.relrowsecurity as rls_activo,
  (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname) as politicas,
  has_table_privilege('anon', c.oid, 'SELECT') as anon_puede_leer,
  has_table_privilege('anon', c.oid, 'INSERT') as anon_puede_crear,
  has_table_privilege('anon', c.oid, 'UPDATE') as anon_puede_modificar,
  has_table_privilege('anon', c.oid, 'DELETE') as anon_puede_borrar
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relrowsecurity, c.relname;

-- 2. Políticas actuales de las tablas principales.
--    Una política con qual = 'true' para el rol anon o public deja la tabla abierta.
select tablename as tabla, policyname as politica, cmd as operacion, roles, qual as condicion, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('productos', 'clientes', 'facturas', 'abonos', 'pedidos', 'usuarios', 'gastos_empresa')
order by tablename, cmd;

-- 3. Últimos cambios registrados por la app en productos (si se usó la pantalla del catálogo)
select created_at, producto_id, tipo_accion, usuario, rol_usuario, cambios_resumen
from public.auditoria_productos
order by created_at desc
limit 50;
