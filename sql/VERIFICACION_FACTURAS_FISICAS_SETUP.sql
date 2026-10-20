-- Registro de facturas físicas verificadas contra las facturas del sistema.
-- Cada fila indica que la factura en papel fue encontrada durante el inventario.
-- Ejecutar AUTENTICACION_SUPABASE_SETUP.sql primero (crea has_app_role).
create table if not exists public.verificacion_facturas_fisicas (
  factura_id bigint primary key references public.facturas(id) on delete cascade,
  verificada_por text,
  verificada_en timestamptz not null default now()
);

alter table public.verificacion_facturas_fisicas enable row level security;

revoke all privileges on table public.verificacion_facturas_fisicas from public, anon, authenticated;
grant select, insert, delete on table public.verificacion_facturas_fisicas to authenticated;

drop policy if exists "admins can read invoice checks" on public.verificacion_facturas_fisicas;
drop policy if exists "admins can create invoice checks" on public.verificacion_facturas_fisicas;
drop policy if exists "admins can delete invoice checks" on public.verificacion_facturas_fisicas;

create policy "admins can read invoice checks"
  on public.verificacion_facturas_fisicas for select to authenticated
  using (public.has_app_role(array['admin', 'superadmin', 'contabilidad']));
create policy "admins can create invoice checks"
  on public.verificacion_facturas_fisicas for insert to authenticated
  with check (public.has_app_role(array['admin', 'superadmin', 'contabilidad']));
create policy "admins can delete invoice checks"
  on public.verificacion_facturas_fisicas for delete to authenticated
  using (public.has_app_role(array['admin', 'superadmin', 'contabilidad']));
