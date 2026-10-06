-- Ejecuta AUTENTICACION_SUPABASE_SETUP.sql primero para configurar Auth y roles.

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

do $$
declare
  target_table text;
  existing_policy record;
begin
  foreach target_table in array array['compras_inmuebles', 'abonos_inmueble', 'gastos_inmueble']
  loop
    for existing_policy in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = target_table
    loop
      execute format('drop policy %I on public.%I', existing_policy.policyname, target_table);
    end loop;

    execute format('revoke all privileges on table public.%I from public, anon, authenticated', target_table);
    execute format('grant select, insert on table public.%I to authenticated', target_table);
  end loop;
end
$$;

create policy "admins can read property purchases"
  on public.compras_inmuebles for select to authenticated
  using (public.has_app_role(array['admin', 'superadmin']));
create policy "admins can create property purchases"
  on public.compras_inmuebles for insert to authenticated
  with check (public.has_app_role(array['admin', 'superadmin']));

create policy "admins can read property payments"
  on public.abonos_inmueble for select to authenticated
  using (public.has_app_role(array['admin', 'superadmin']));
create policy "admins can create property payments"
  on public.abonos_inmueble for insert to authenticated
  with check (public.has_app_role(array['admin', 'superadmin']));

create policy "admins can read property expenses"
  on public.gastos_inmueble for select to authenticated
  using (public.has_app_role(array['admin', 'superadmin']));
create policy "admins can create property expenses"
  on public.gastos_inmueble for insert to authenticated
  with check (public.has_app_role(array['admin', 'superadmin']));
