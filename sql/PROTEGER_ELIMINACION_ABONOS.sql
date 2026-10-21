-- Solo la cuenta 3marin7@gmail.com puede eliminar abonos desde la app o la API.
-- No cambia los permisos de lectura, creación ni edición de la tabla.
-- Las consultas ejecutadas en el SQL Editor de Supabase (sin usuario de la app)
-- no se bloquean.
create or replace function public.proteger_eliminacion_abonos()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  claims jsonb := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
begin
  if claims is not null
     and lower(coalesce(claims ->> 'email', '')) <> '3marin7@gmail.com' then
    raise exception 'Solo la cuenta autorizada puede eliminar abonos'
      using errcode = '42501';
  end if;

  return old;
end;
$$;

drop trigger if exists proteger_eliminacion_abonos on public.abonos;
create trigger proteger_eliminacion_abonos
  before delete on public.abonos
  for each row execute function public.proteger_eliminacion_abonos();
