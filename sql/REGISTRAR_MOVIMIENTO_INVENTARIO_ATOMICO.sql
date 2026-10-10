-- Ejecutar después de AUTENTICACION_SUPABASE_SETUP.sql y de crear
-- public.movimientos_inventario. La función registra el movimiento y ajusta
-- el stock en una sola transacción; repetir el mismo request_id no duplica stock.

alter table public.movimientos_inventario
  add column if not exists idempotency_key uuid,
  add column if not exists precio_unitario numeric,
  add column if not exists motivo text,
  add column if not exists observaciones text;

create unique index if not exists movimientos_inventario_idempotency_key_uidx
  on public.movimientos_inventario (idempotency_key);

alter table public.movimientos_inventario enable row level security;

drop policy if exists "Allow read access to all" on public.movimientos_inventario;
drop policy if exists "Allow insert access to all" on public.movimientos_inventario;
drop policy if exists "Inventory staff can read movements" on public.movimientos_inventario;
drop policy if exists "Authorized staff can insert movements" on public.movimientos_inventario;

revoke all on table public.movimientos_inventario from public, anon, authenticated;
grant select, insert on table public.movimientos_inventario to authenticated;

create policy "Inventory staff can read movements"
  on public.movimientos_inventario
  for select
  to authenticated
  using (public.has_app_role(array['admin', 'superadmin', 'inventario', 'vendedor']));

create policy "Authorized staff can insert movements"
  on public.movimientos_inventario
  for insert
  to authenticated
  with check (public.has_app_role(array['admin', 'superadmin', 'inventario', 'vendedor']));

create or replace function public.registrar_movimiento_inventario(
  p_request_id uuid,
  p_producto_id bigint,
  p_tipo_movimiento text,
  p_cantidad integer,
  p_descripcion text,
  p_precio_unitario numeric,
  p_motivo text,
  p_observaciones text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing public.movimientos_inventario%rowtype;
  v_stock_anterior integer;
  v_stock_nuevo integer;
  v_movimiento_id bigint;
  v_usuario text;
  v_rol_usuario text;
begin
  if auth.uid() is null
    or not public.has_app_role(array['admin', 'superadmin', 'inventario']) then
    raise exception 'No tienes permiso para registrar movimientos de inventario'
      using errcode = '42501';
  end if;

  if p_request_id is null then
    raise exception 'El identificador del movimiento es obligatorio';
  end if;
  if p_tipo_movimiento not in ('entrada', 'salida') then
    raise exception 'Tipo de movimiento inválido';
  end if;
  if p_cantidad is null or p_cantidad <= 0 then
    raise exception 'La cantidad debe ser mayor a cero';
  end if;

  select username, role
  into v_usuario, v_rol_usuario
  from public.user_profiles
  where id = auth.uid()
    and activo = true;

  if not found then
    raise exception 'No se encontró un perfil activo para este usuario'
      using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));

  select *
  into v_existing
  from public.movimientos_inventario
  where idempotency_key = p_request_id;

  if found then
    if v_existing.producto_id <> p_producto_id
      or v_existing.tipo_movimiento <> p_tipo_movimiento
      or v_existing.cantidad <> p_cantidad
      or v_existing.descripcion is distinct from p_descripcion
      or v_existing.precio_unitario is distinct from p_precio_unitario
      or v_existing.motivo is distinct from p_motivo
      or v_existing.observaciones is distinct from p_observaciones
      or v_existing.usuario is distinct from v_usuario
      or v_existing.rol_usuario is distinct from v_rol_usuario then
      raise exception 'El identificador ya fue utilizado para otro movimiento';
    end if;

    return jsonb_build_object(
      'movimiento_id', v_existing.id,
      'stock_anterior', v_existing.stock_anterior,
      'stock_nuevo', v_existing.stock_nuevo,
      'ya_registrado', true
    );
  end if;

  select coalesce(stock, 0)
  into v_stock_anterior
  from public.productos
  where id = p_producto_id
  for update;

  if not found then
    raise exception 'No se encontró el producto seleccionado';
  end if;

  if p_tipo_movimiento = 'salida' and p_cantidad > v_stock_anterior then
    raise exception 'No hay suficiente stock disponible';
  end if;

  v_stock_nuevo := case
    when p_tipo_movimiento = 'entrada' then v_stock_anterior + p_cantidad
    else v_stock_anterior - p_cantidad
  end;

  update public.productos
  set stock = v_stock_nuevo
  where id = p_producto_id;

  insert into public.movimientos_inventario (
    producto_id,
    tipo_movimiento,
    cantidad,
    stock_anterior,
    stock_nuevo,
    descripcion,
    usuario,
    rol_usuario,
    precio_unitario,
    motivo,
    observaciones,
    idempotency_key
  )
  values (
    p_producto_id,
    p_tipo_movimiento,
    p_cantidad,
    v_stock_anterior,
    v_stock_nuevo,
    p_descripcion,
    v_usuario,
    v_rol_usuario,
    p_precio_unitario,
    p_motivo,
    p_observaciones,
    p_request_id
  )
  returning id into v_movimiento_id;

  return jsonb_build_object(
    'movimiento_id', v_movimiento_id,
    'stock_anterior', v_stock_anterior,
    'stock_nuevo', v_stock_nuevo,
    'ya_registrado', false
  );
end;
$$;

revoke all on function public.registrar_movimiento_inventario(
  uuid, bigint, text, integer, text, numeric, text, text
) from public, anon;
grant execute on function public.registrar_movimiento_inventario(
  uuid, bigint, text, integer, text, numeric, text, text
) to authenticated;

notify pgrst, 'reload schema';
