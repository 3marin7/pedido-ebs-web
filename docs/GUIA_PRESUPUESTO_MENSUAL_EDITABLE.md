# Guia rapida - Presupuesto mensual editable

Archivo principal: `docs/PRESUPUESTO_MENSUAL_EDITABLE.csv`

## Como usarlo

1. Abre el CSV en Excel o Google Sheets.
2. Edita solo estas columnas por mes:
   - `Clientes`
   - `Precio_por_cliente_COP`
   - `Costo_Vercel_COP`
   - `Costo_BD_COP`
   - `Costo_DNS_Monitoreo_COP`
   - `Costo_Backups_COP`
   - `Costo_Otros_COP`
3. No borres las formulas de:
   - `Ingresos_COP`
   - `Costo_Total_COP`
   - `Utilidad_Bruta_COP`
   - `Infra_sobre_ingresos_pct`
4. Formatea `Infra_sobre_ingresos_pct` como porcentaje (`%`).

## Regla de salud financiera sugerida

- Meta ideal: `Infra_sobre_ingresos_pct` entre `20%` y `30%`.
- Alerta amarilla: entre `31%` y `40%`.
- Alerta roja: mayor a `40%`.

## Indicadores clave

- Si la utilidad baja 2 meses seguidos, revisa costos fijos.
- Si clientes suben pero utilidad no, revisa BD y backups.
- Si la columna de porcentaje supera 30%, sube precio o optimiza stack.
