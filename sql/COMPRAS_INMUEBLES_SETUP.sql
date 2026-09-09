-- Registro independiente de compras de inmuebles y sus abonos.
create table if not exists public.compras_inmuebles (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  direccion text,
  valor_total numeric(14, 2) not null check (valor_total > 0),
  fecha_compra date not null default current_date,
  notas text,
  created_at timestamptz not null default now()
);

create table if not exists public.abonos_inmueble (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid not null references public.compras_inmuebles(id) on delete cascade,
  valor numeric(14, 2) not null check (valor > 0),
  fecha_abono date not null default current_date,
  abonado_por text not null,
  evidencia_url text,
  nota text,
  created_at timestamptz not null default now()
);

create table if not exists public.gastos_inmueble (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid not null references public.compras_inmuebles(id) on delete cascade,
  concepto text not null,
  valor numeric(14, 2) not null check (valor > 0),
  fecha_gasto date not null default current_date,
  pagado_por text not null,
  created_at timestamptz not null default now()
);

create index if not exists abonos_inmueble_compra_id_idx on public.abonos_inmueble(compra_id);
create index if not exists abonos_inmueble_fecha_idx on public.abonos_inmueble(fecha_abono desc);
create index if not exists gastos_inmueble_compra_id_idx on public.gastos_inmueble(compra_id);

alter table public.compras_inmuebles enable row level security;
alter table public.abonos_inmueble enable row level security;
alter table public.gastos_inmueble enable row level security;

-- Esta aplicación autentica usuarios en la propia app y usa el cliente anon de Supabase.
create policy "compras_inmuebles_select_app"
  on public.compras_inmuebles for select to anon, authenticated using (true);
create policy "compras_inmuebles_insert_app"
  on public.compras_inmuebles for insert to anon, authenticated with check (true);
create policy "abonos_inmueble_select_app"
  on public.abonos_inmueble for select to anon, authenticated using (true);
create policy "abonos_inmueble_insert_app"
  on public.abonos_inmueble for insert to anon, authenticated with check (true);
create policy "gastos_inmueble_select_app"
  on public.gastos_inmueble for select to anon, authenticated using (true);
create policy "gastos_inmueble_insert_app"
  on public.gastos_inmueble for insert to anon, authenticated with check (true);

grant select, insert on public.compras_inmuebles to anon, authenticated;
grant select, insert on public.abonos_inmueble to anon, authenticated;
grant select, insert on public.gastos_inmueble to anon, authenticated;
