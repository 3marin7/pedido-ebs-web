-- Modulo independiente de plataformas arrendadas.
-- Ejecutar en Supabase SQL Editor antes de habilitar la vista en producción.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE public.tipo_proveedor_cloud AS ENUM ('SUPABASE', 'CLOUDINARY', 'GITHUB', 'CORREO', 'OTRO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE public.tipo_proveedor_cloud ADD VALUE IF NOT EXISTS 'CORREO';

CREATE TABLE IF NOT EXISTS public.clientes_plataforma (
  id_cliente_plataforma uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_contacto varchar(150) NOT NULL,
  telefono_contacto varchar(30) NOT NULL,
  correo_contacto varchar(150),
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.plataformas_arriendo (
  id_plataforma uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_cliente_plataforma uuid NOT NULL REFERENCES public.clientes_plataforma(id_cliente_plataforma) ON DELETE RESTRICT,
  nombre_plataforma varchar(120) NOT NULL,
  proveedor_despliegue varchar(80),
  url_produccion varchar(500),
  numero_contrato varchar(50) NOT NULL UNIQUE,
  fecha_inicio_arriendo date NOT NULL,
  fecha_fin_arriendo date,
  dia_corte smallint NOT NULL DEFAULT 5 CHECK (dia_corte BETWEEN 1 AND 31),
  valor_mensual numeric(12,2) NOT NULL DEFAULT 0 CHECK (valor_mensual >= 0),
  servicio_supabase boolean NOT NULL DEFAULT true,
  servicio_cloudinary boolean NOT NULL DEFAULT true,
  servicio_github boolean NOT NULL DEFAULT true,
  servicio_correo boolean NOT NULL DEFAULT false,
  estado varchar(20) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'SUSPENDIDO', 'FINALIZADO')),
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now(),
  CHECK (fecha_fin_arriendo IS NULL OR fecha_fin_arriendo >= fecha_inicio_arriendo)
);

ALTER TABLE public.plataformas_arriendo
  ADD COLUMN IF NOT EXISTS servicio_correo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS proveedor_despliegue varchar(80),
  ADD COLUMN IF NOT EXISTS url_produccion varchar(500);

CREATE TABLE IF NOT EXISTS public.pagos_plataforma (
  id_pago uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_plataforma uuid NOT NULL REFERENCES public.plataformas_arriendo(id_plataforma) ON DELETE CASCADE,
  periodo date NOT NULL,
  periodo_hasta date,
  frecuencia varchar(20) NOT NULL DEFAULT 'MENSUAL' CHECK (frecuencia IN ('MENSUAL', 'SEMESTRAL', 'ANUAL')),
  monto numeric(12,2) NOT NULL CHECK (monto >= 0),
  fecha_pago date,
  estado varchar(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'PAGADO', 'ANULADO')),
  evidencia_url text,
  creado_en timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id_plataforma, periodo)
);

ALTER TABLE public.pagos_plataforma
  ADD COLUMN IF NOT EXISTS periodo_hasta date,
  ADD COLUMN IF NOT EXISTS frecuencia varchar(20) NOT NULL DEFAULT 'MENSUAL';

CREATE TABLE IF NOT EXISTS public.credenciales_plataforma (
  id_credencial uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_plataforma uuid NOT NULL REFERENCES public.plataformas_arriendo(id_plataforma) ON DELETE CASCADE,
  proveedor public.tipo_proveedor_cloud NOT NULL,
  usuario_o_email varchar(150) NOT NULL,
  password_cifrada bytea,
  url_acceso varchar(255),
  notas_seguridad text,
  ultima_actualizacion timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id_plataforma, proveedor)
);

CREATE TABLE IF NOT EXISTS public.auditoria_credenciales (
  id_auditoria uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_credencial uuid NOT NULL REFERENCES public.credenciales_plataforma(id_credencial) ON DELETE CASCADE,
  usuario_o_email_anterior varchar(150),
  evento varchar(60) NOT NULL DEFAULT 'ACTUALIZACION_CREDENCIAL',
  actor uuid,
  fecha_modificacion timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.auditoria_consultas_credenciales (
  id_consulta uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_credencial uuid NOT NULL REFERENCES public.credenciales_plataforma(id_credencial) ON DELETE CASCADE,
  actor uuid,
  consultado_en timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.fn_actualizar_plataforma_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.actualizado_en = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guardar_credencial_segura(
  p_id_plataforma uuid,
  p_proveedor text,
  p_usuario_o_email text,
  p_password_plana text,
  p_url_acceso text,
  p_notas_seguridad text,
  p_clave_maestra text
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id uuid;
BEGIN
  IF nullif(trim(p_password_plana), '') IS NOT NULL
     AND nullif(trim(p_clave_maestra), '') IS NULL THEN
    RAISE EXCEPTION 'La clave maestra es obligatoria cuando hay contrasena';
  END IF;
  INSERT INTO public.credenciales_plataforma (
    id_plataforma, proveedor, usuario_o_email, password_cifrada,
    url_acceso, notas_seguridad
  ) VALUES (
    p_id_plataforma, upper(p_proveedor)::public.tipo_proveedor_cloud,
    p_usuario_o_email,
    CASE WHEN nullif(trim(p_password_plana), '') IS NULL THEN NULL
      ELSE extensions.pgp_sym_encrypt(p_password_plana, p_clave_maestra)
    END,
    nullif(p_url_acceso, ''), nullif(p_notas_seguridad, '')
  )
  ON CONFLICT (id_plataforma, proveedor) DO UPDATE SET
    usuario_o_email = EXCLUDED.usuario_o_email,
    password_cifrada = EXCLUDED.password_cifrada,
    url_acceso = EXCLUDED.url_acceso,
    notas_seguridad = EXCLUDED.notas_seguridad;
  SELECT id_credencial INTO v_id FROM public.credenciales_plataforma
  WHERE id_plataforma = p_id_plataforma
    AND proveedor = upper(p_proveedor)::public.tipo_proveedor_cloud;
  RETURN v_id;
END;
$$;

DROP TRIGGER IF EXISTS trg_plataforma_updated_at ON public.plataformas_arriendo;
CREATE TRIGGER trg_plataforma_updated_at
BEFORE UPDATE ON public.plataformas_arriendo
FOR EACH ROW EXECUTE FUNCTION public.fn_actualizar_plataforma_updated_at();

CREATE OR REPLACE FUNCTION public.fn_auditar_cambio_credencial()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.auditoria_credenciales (
    id_credencial, usuario_o_email_anterior, evento, actor
  ) VALUES (
    OLD.id_credencial,
    OLD.usuario_o_email,
    'ACTUALIZACION_PASSWORD_O_USUARIO',
    auth.uid()
  );
  NEW.ultima_actualizacion = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auditar_cambio_credencial ON public.credenciales_plataforma;
CREATE TRIGGER trg_auditar_cambio_credencial
BEFORE UPDATE ON public.credenciales_plataforma
FOR EACH ROW
WHEN (
  OLD.password_cifrada IS DISTINCT FROM NEW.password_cifrada
  OR OLD.usuario_o_email IS DISTINCT FROM NEW.usuario_o_email
)
EXECUTE FUNCTION public.fn_auditar_cambio_credencial();

CREATE OR REPLACE VIEW public.vista_control_plataformas_arriendo AS
SELECT
  p.id_plataforma,
  p.numero_contrato,
  p.nombre_plataforma,
  p.estado,
  p.fecha_inicio_arriendo,
  p.fecha_fin_arriendo,
  p.proveedor_despliegue,
  p.url_produccion,
  p.dia_corte,
  p.valor_mensual AS canon_pago,
  c.nombre_contacto,
  c.telefono_contacto,
  c.correo_contacto,
  concat_ws(', ',
    CASE WHEN p.servicio_supabase THEN 'Supabase (BD/Auth)' END,
    CASE WHEN p.servicio_cloudinary THEN 'Cloudinary (Media)' END,
    CASE WHEN p.servicio_github THEN 'GitHub (Repo/CI)' END,
    CASE WHEN p.servicio_correo THEN 'Correo electrónico' END
  ) AS servicios_infraestructura
FROM public.plataformas_arriendo p
JOIN public.clientes_plataforma c ON c.id_cliente_plataforma = p.id_cliente_plataforma;

CREATE OR REPLACE VIEW public.vista_seguimiento_credenciales AS
SELECT
  p.numero_contrato,
  p.nombre_plataforma,
  cp.id_credencial,
  cp.proveedor,
  cp.usuario_o_email,
  cp.url_acceso,
  cp.ultima_actualizacion AS fecha_ultimo_cambio,
  count(ac.id_auditoria)::integer AS total_rotaciones
FROM public.credenciales_plataforma cp
JOIN public.plataformas_arriendo p ON p.id_plataforma = cp.id_plataforma
LEFT JOIN public.auditoria_credenciales ac ON ac.id_credencial = cp.id_credencial
GROUP BY p.numero_contrato, p.nombre_plataforma, cp.id_credencial, cp.proveedor,
  cp.usuario_o_email, cp.url_acceso, cp.ultima_actualizacion;

CREATE OR REPLACE FUNCTION public.es_admin_tecnico()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(auth.jwt() -> 'user_metadata' ->> 'rol', '') IN ('admin', 'superadmin', 'tecnico');
$$;

CREATE OR REPLACE FUNCTION public.consultar_credenciales_seguras(
  p_numero_contrato text,
  p_clave_maestra text
)
RETURNS TABLE (
  plataforma varchar(120), proveedor public.tipo_proveedor_cloud,
  usuario_o_email varchar(150), password_plana text,
  url_acceso varchar(255), ultima_actualizacion timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.es_admin_tecnico() THEN
    RAISE EXCEPTION 'No autorizado para consultar credenciales';
  END IF;

  RETURN QUERY
  SELECT p.nombre_plataforma, cp.proveedor, cp.usuario_o_email,
    extensions.pgp_sym_decrypt(cp.password_cifrada, p_clave_maestra)::text,
    cp.url_acceso, cp.ultima_actualizacion
  FROM public.credenciales_plataforma cp
  JOIN public.plataformas_arriendo p ON p.id_plataforma = cp.id_plataforma
  WHERE p.numero_contrato = p_numero_contrato;
END;
$$;

ALTER TABLE public.clientes_plataforma ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plataformas_arriendo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos_plataforma ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credenciales_plataforma ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_credenciales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_consultas_credenciales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plataformas_lectura_autenticados" ON public.plataformas_arriendo;
CREATE POLICY "plataformas_lectura_autenticados" ON public.plataformas_arriendo
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "plataformas_gestion_admin" ON public.plataformas_arriendo;
CREATE POLICY "plataformas_gestion_admin" ON public.plataformas_arriendo
  FOR ALL TO authenticated USING (public.es_admin_tecnico()) WITH CHECK (public.es_admin_tecnico());

DROP POLICY IF EXISTS "clientes_plataforma_lectura_autenticados" ON public.clientes_plataforma;
CREATE POLICY "clientes_plataforma_lectura_autenticados" ON public.clientes_plataforma
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "clientes_plataforma_gestion_admin" ON public.clientes_plataforma;
CREATE POLICY "clientes_plataforma_gestion_admin" ON public.clientes_plataforma
  FOR ALL TO authenticated USING (public.es_admin_tecnico()) WITH CHECK (public.es_admin_tecnico());

DROP POLICY IF EXISTS "pagos_plataforma_lectura_autenticados" ON public.pagos_plataforma;
CREATE POLICY "pagos_plataforma_lectura_autenticados" ON public.pagos_plataforma
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "pagos_plataforma_gestion_admin" ON public.pagos_plataforma;
CREATE POLICY "pagos_plataforma_gestion_admin" ON public.pagos_plataforma
  FOR ALL TO authenticated USING (public.es_admin_tecnico()) WITH CHECK (public.es_admin_tecnico());

DROP POLICY IF EXISTS "credenciales_solo_tecnicos" ON public.credenciales_plataforma;
CREATE POLICY "credenciales_solo_tecnicos" ON public.credenciales_plataforma
  FOR ALL TO authenticated USING (public.es_admin_tecnico()) WITH CHECK (public.es_admin_tecnico());

DROP POLICY IF EXISTS "auditoria_credenciales_solo_tecnicos" ON public.auditoria_credenciales;
CREATE POLICY "auditoria_credenciales_solo_tecnicos" ON public.auditoria_credenciales
  FOR SELECT TO authenticated USING (public.es_admin_tecnico());

DROP POLICY IF EXISTS "auditoria_consultas_solo_tecnicos" ON public.auditoria_consultas_credenciales;
CREATE POLICY "auditoria_consultas_solo_tecnicos" ON public.auditoria_consultas_credenciales
  FOR SELECT TO authenticated USING (public.es_admin_tecnico());

-- Compatibilidad con el login local actual de la aplicación.
-- Este login no crea una sesión Supabase, por lo que las operaciones
-- comerciales no reciben un JWT con rol. La bóveda sigue restringida
-- a usuarios authenticated con rol técnico/admin.
DROP POLICY IF EXISTS "clientes_plataforma_operacion_app" ON public.clientes_plataforma;
CREATE POLICY "clientes_plataforma_operacion_app" ON public.clientes_plataforma
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "plataformas_operacion_app" ON public.plataformas_arriendo;
CREATE POLICY "plataformas_operacion_app" ON public.plataformas_arriendo
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "pagos_plataforma_operacion_app" ON public.pagos_plataforma;
CREATE POLICY "pagos_plataforma_operacion_app" ON public.pagos_plataforma
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

REVOKE ALL ON FUNCTION public.consultar_credenciales_seguras(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consultar_credenciales_seguras(text, text) TO authenticated;
REVOKE ALL ON FUNCTION public.guardar_credencial_segura(uuid, text, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.guardar_credencial_segura(uuid, text, text, text, text, text, text) TO authenticated;
