-- Ejecutar si PLATAFORMAS_ARRENDAMIENTO_SETUP.sql ya fue ejecutado.
-- Corrige el alta desde la aplicación, cuyo login actual es local.

DROP POLICY IF EXISTS "clientes_plataforma_operacion_app" ON public.clientes_plataforma;
CREATE POLICY "clientes_plataforma_operacion_app" ON public.clientes_plataforma
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "plataformas_operacion_app" ON public.plataformas_arriendo;
CREATE POLICY "plataformas_operacion_app" ON public.plataformas_arriendo
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "pagos_plataforma_operacion_app" ON public.pagos_plataforma;
CREATE POLICY "pagos_plataforma_operacion_app" ON public.pagos_plataforma
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);