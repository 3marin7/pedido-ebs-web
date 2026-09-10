-- Las credenciales solo pueden guardarse con una sesión Supabase Auth.
-- El login local de la aplicación no genera auth.uid() y no debe recibir
-- permiso para escribir secretos.

GRANT EXECUTE ON FUNCTION public.guardar_credencial_segura(
  uuid, text, text, text, text, text, text
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.consultar_credenciales_seguras(text, text)
  TO authenticated;