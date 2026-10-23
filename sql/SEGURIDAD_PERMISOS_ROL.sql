-- AJUSTAR PERMISOS POR ROL (informe de seguridad 2, 23/10/2026)
-- Ejecutar DESPUÉS de SEGURIDAD_PRODUCTOS_RLS.sql y SEGURIDAD_CERRAR_PUERTAS.sql.
--
-- Cierra lo que un usuario CON cuenta puede hacer de más usando Thunder Client
-- o la importación de facturas:
--   1. Funciones de la bóveda: revisan que quien llama sea admin o superadmin.
--   2. Facturas: solo admin y superadmin modifican facturas ya guardadas
--      (los demás roles siguen creando facturas nuevas).
--   3. Abonos: solo admin y superadmin crean o modifican abonos
--      (en la app el formulario de abonos ya es solo para admin).
--   4. Verificación física: borrar marcas en bloque solo admin y superadmin;
--      los demás solo pueden desmarcar lo que verificaron en las últimas 24 horas.
--   5. Auditoría de productos: nadie puede escribir registros a nombre de otro.

-- ---------------------------------------------------------------------------
-- 1. BÓVEDA: las funciones verifican el rol por dentro
-- ---------------------------------------------------------------------------
create or replace function public.guardar_credencial_segura(
  p_id_plataforma uuid,
  p_proveedor text,
  p_usuario_o_email text,
  p_password_plana text,
  p_url_acceso text,
  p_notas_seguridad text,
  p_clave_maestra text
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  if auth.uid() is null or not public.has_app_role(array['admin', 'superadmin']) then
    raise exception 'No tienes permiso para guardar credenciales' using errcode = '42501';
  end if;

  if nullif(trim(p_password_plana), '') is not null
     and nullif(trim(p_clave_maestra), '') is null then
    raise exception 'La clave maestra es obligatoria cuando hay contrasena';
  end if;

  insert into public.credenciales_plataforma (
    id_plataforma, proveedor, usuario_o_email, password_cifrada, url_acceso, notas_seguridad
  ) values (
    p_id_plataforma,
    upper(p_proveedor)::public.tipo_proveedor_cloud,
    p_usuario_o_email,
    case when nullif(trim(p_password_plana), '') is null then null
      else extensions.pgp_sym_encrypt(p_password_plana, p_clave_maestra)
    end,
    nullif(p_url_acceso, ''),
    nullif(p_notas_seguridad, '')
  )
  on conflict (id_plataforma, proveedor) do update set
    usuario_o_email = excluded.usuario_o_email,
    password_cifrada = excluded.password_cifrada,
    url_acceso = excluded.url_acceso,
    notas_seguridad = excluded.notas_seguridad;

  select id_credencial into v_id
  from public.credenciales_plataforma
  where id_plataforma = p_id_plataforma
    and proveedor = upper(p_proveedor)::public.tipo_proveedor_cloud;

  return v_id;
end;
$$;

create or replace function public.consultar_credenciales_seguras(
  p_numero_contrato text,
  p_clave_maestra text
)
returns table (
  plataforma varchar(120),
  proveedor public.tipo_proveedor_cloud,
  usuario_o_email varchar(150),
  password_plana text,
  url_acceso varchar(255),
  ultima_actualizacion timestamptz
)
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or not public.has_app_role(array['admin', 'superadmin']) then
    raise exception 'No tienes permiso para consultar credenciales' using errcode = '42501';
  end if;

  if nullif(trim(p_clave_maestra), '') is null then
    raise exception 'La clave maestra es obligatoria';
  end if;

  return query
  select
    p.nombre_plataforma,
    cp.proveedor,
    cp.usuario_o_email,
    case when cp.password_cifrada is null then null
      else extensions.pgp_sym_decrypt(cp.password_cifrada, p_clave_maestra)::text
    end,
    cp.url_acceso,
    cp.ultima_actualizacion
  from public.credenciales_plataforma cp
  join public.plataformas_arriendo p on p.id_plataforma = cp.id_plataforma
  where p.numero_contrato = p_numero_contrato;
end;
$$;

revoke all on function public.guardar_credencial_segura(uuid, text, text, text, text, text, text) from public, anon;
grant execute on function public.guardar_credencial_segura(uuid, text, text, text, text, text, text) to authenticated;
revoke all on function public.consultar_credenciales_seguras(text, text) from public, anon;
grant execute on function public.consultar_credenciales_seguras(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. FACTURAS: crear lo hace el equipo; modificar una factura guardada, solo admin
--    (también bloquea que la importación de Excel sobrescriba facturas)
-- ---------------------------------------------------------------------------
drop policy if exists "app_modificar" on public.facturas;
create policy "app_modificar" on public.facturas
  for update to authenticated
  using (public.has_app_role(array['admin', 'superadmin']))
  with check (public.has_app_role(array['admin', 'superadmin']));

-- ---------------------------------------------------------------------------
-- 3. ABONOS: crear y modificar solo admin y superadmin
-- ---------------------------------------------------------------------------
drop policy if exists "app_crear" on public.abonos;
create policy "app_crear" on public.abonos
  for insert to authenticated
  with check (public.has_app_role(array['admin', 'superadmin']));

drop policy if exists "app_modificar" on public.abonos;
create policy "app_modificar" on public.abonos
  for update to authenticated
  using (public.has_app_role(array['admin', 'superadmin']))
  with check (public.has_app_role(array['admin', 'superadmin']));

-- ---------------------------------------------------------------------------
-- 4. VERIFICACIÓN DE FACTURAS FÍSICAS: nadie borra todo el inventario de marcas
--    salvo admin y superadmin; los demás solo desmarcan marcas recientes
-- ---------------------------------------------------------------------------
drop policy if exists "admins can delete invoice checks" on public.verificacion_facturas_fisicas;
create policy "admins can delete invoice checks"
  on public.verificacion_facturas_fisicas for delete to authenticated
  using (
    public.has_app_role(array['admin', 'superadmin'])
    or (
      public.has_app_role(array['contabilidad', 'inventario'])
      and verificada_en >= now() - interval '24 hours'
    )
  );

-- ---------------------------------------------------------------------------
-- 5. AUDITORÍA DE PRODUCTOS: el registro lleva el correo real de quien lo crea
-- ---------------------------------------------------------------------------
create or replace function public.firmar_auditoria_productos()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  claims jsonb := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
begin
  if claims is not null and new.tipo_accion is distinct from 'edicion_bd' then
    new.usuario := coalesce(claims ->> 'email', new.usuario);
  end if;
  return new;
end;
$$;

drop trigger if exists firmar_auditoria_productos on public.auditoria_productos;
create trigger firmar_auditoria_productos
  before insert on public.auditoria_productos
  for each row execute function public.firmar_auditoria_productos();

-- ---------------------------------------------------------------------------
-- 6. OPCIONAL: que el vendedor solo pueda cambiar el stock de los productos
--    Quitar los comentarios (--) si los vendedores NO deben editar precios,
--    nombres ni imágenes desde el catálogo. Ojo: hoy la pantalla del catálogo
--    les permite editar productos; con esto les daría error al guardar.
-- ---------------------------------------------------------------------------
-- create or replace function public.limitar_edicion_productos()
-- returns trigger
-- language plpgsql
-- security definer
-- set search_path = ''
-- as $$
-- begin
--   if current_setting('request.jwt.claims', true) is not null
--      and not public.has_app_role(array['admin', 'superadmin'])
--      and (to_jsonb(new) - 'stock') is distinct from (to_jsonb(old) - 'stock') then
--     raise exception 'Solo admin y superadmin pueden cambiar precio, nombre o imagen'
--       using errcode = '42501';
--   end if;
--   return new;
-- end;
-- $$;
--
-- drop trigger if exists limitar_edicion_productos on public.productos;
-- create trigger limitar_edicion_productos
--   before update on public.productos
--   for each row execute function public.limitar_edicion_productos();
