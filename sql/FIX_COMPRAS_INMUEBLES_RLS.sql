-- La aplicación usa autenticación propia y consulta Supabase con la clave anon.
-- Ejecuta este script una sola vez en Supabase SQL Editor.

alter table public.abonos_inmueble add column if not exists evidencia_url text;
create table if not exists public.gastos_inmueble (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid not null references public.compras_inmuebles(id) on delete cascade,
  concepto text not null,
  valor numeric(14, 2) not null check (valor > 0),
  fecha_gasto date not null default current_date,
  pagado_por text not null,
  created_at timestamptz not null default now()
);

-- Recarga el esquema que utiliza la API REST de Supabase.
notify pgrst, 'reload schema';

alter table public.compras_inmuebles enable row level security;
alter table public.abonos_inmueble enable row level security;
alter table public.gastos_inmueble enable row level security;

drop policy if exists "usuarios autenticados pueden consultar compras" on public.compras_inmuebles;
drop policy if exists "usuarios autenticados pueden crear compras" on public.compras_inmuebles;
drop policy if exists "usuarios autenticados pueden consultar abonos" on public.abonos_inmueble;
drop policy if exists "usuarios autenticados pueden crear abonos" on public.abonos_inmueble;
drop policy if exists "compras_inmuebles_select_app" on public.compras_inmuebles;
drop policy if exists "compras_inmuebles_insert_app" on public.compras_inmuebles;
drop policy if exists "abonos_inmueble_select_app" on public.abonos_inmueble;
drop policy if exists "abonos_inmueble_insert_app" on public.abonos_inmueble;
drop policy if exists "gastos_inmueble_select_app" on public.gastos_inmueble;
drop policy if exists "gastos_inmueble_insert_app" on public.gastos_inmueble;

create policy "compras_inmuebles_select_app"
  on public.compras_inmuebles for select
  to anon, authenticated
  using (true);

create policy "compras_inmuebles_insert_app"
  on public.compras_inmuebles for insert
  to anon, authenticated
  with check (true);

create policy "abonos_inmueble_select_app"
  on public.abonos_inmueble for select
  to anon, authenticated
  using (true);

create policy "abonos_inmueble_insert_app"
  on public.abonos_inmueble for insert
  to anon, authenticated
  with check (true);
create policy "gastos_inmueble_select_app" on public.gastos_inmueble for select to anon, authenticated using (true);
create policy "gastos_inmueble_insert_app" on public.gastos_inmueble for insert to anon, authenticated with check (true);

grant select, insert on public.compras_inmuebles to anon, authenticated;
grant select, insert on public.abonos_inmueble to anon, authenticated;
grant select, insert on public.gastos_inmueble to anon, authenticated;
