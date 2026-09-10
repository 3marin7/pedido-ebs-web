-- Compatibilidad con el login local actual de la aplicacion.
-- Ejecutar en Supabase SQL Editor.
-- Las contrasenas siguen cifradas con pgcrypto.
-- La clave maestra pasa a ser la proteccion de guardado/consulta.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER TABLE public.credenciales_plataforma
  ALTER COLUMN password_cifrada DROP NOT NULL;

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
    id_plataforma,
    proveedor,
    usuario_o_email,
    password_cifrada,
    url_acceso,
    notas_seguridad
  ) VALUES (
    p_id_plataforma,
    upper(p_proveedor)::public.tipo_proveedor_cloud,
    p_usuario_o_email,
    CASE WHEN nullif(trim(p_password_plana), '') IS NULL THEN NULL
      ELSE extensions.pgp_sym_encrypt(p_password_plana, p_clave_maestra)
    END,
    nullif(p_url_acceso, ''),
    nullif(p_notas_seguridad, '')
  )
  ON CONFLICT (id_plataforma, proveedor) DO UPDATE SET
    usuario_o_email = EXCLUDED.usuario_o_email,
    password_cifrada = EXCLUDED.password_cifrada,
    url_acceso = EXCLUDED.url_acceso,
    notas_seguridad = EXCLUDED.notas_seguridad;

  SELECT id_credencial INTO v_id
  FROM public.credenciales_plataforma
  WHERE id_plataforma = p_id_plataforma
    AND proveedor = upper(p_proveedor)::public.tipo_proveedor_cloud;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.consultar_credenciales_seguras(
  p_numero_contrato text,
  p_clave_maestra text
)
RETURNS TABLE (
  plataforma varchar(120),
  proveedor public.tipo_proveedor_cloud,
  usuario_o_email varchar(150),
  password_plana text,
  url_acceso varchar(255),
  ultima_actualizacion timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF nullif(trim(p_clave_maestra), '') IS NULL THEN
    RAISE EXCEPTION 'La clave maestra es obligatoria';
  END IF;

  RETURN QUERY
  SELECT
    p.nombre_plataforma,
    cp.proveedor,
    cp.usuario_o_email,
    CASE WHEN cp.password_cifrada IS NULL THEN NULL
      ELSE extensions.pgp_sym_decrypt(cp.password_cifrada, p_clave_maestra)::text
    END,
    cp.url_acceso,
    cp.ultima_actualizacion
  FROM public.credenciales_plataforma cp
  JOIN public.plataformas_arriendo p ON p.id_plataforma = cp.id_plataforma
  WHERE p.numero_contrato = p_numero_contrato;
END;
$$;

REVOKE ALL ON FUNCTION public.guardar_credencial_segura(uuid, text, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.guardar_credencial_segura(uuid, text, text, text, text, text, text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.consultar_credenciales_seguras(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consultar_credenciales_seguras(text, text) TO anon, authenticated;

DROP POLICY IF EXISTS "credenciales_metadatos_app_local" ON public.credenciales_plataforma;
CREATE POLICY "credenciales_metadatos_app_local" ON public.credenciales_plataforma
  FOR SELECT TO anon, authenticated USING (true);
