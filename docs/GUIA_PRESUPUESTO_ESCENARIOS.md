# Guia rapida - Presupuesto por escenarios

Archivo: `docs/PRESUPUESTO_MENSUAL_ESCENARIOS.csv`

## Objetivo

Comparar 3 escenarios de crecimiento con la misma estructura financiera:
- `Conservador_10`
- `Base_20`
- `Agresivo_30`

## Que editar

Edita solo estas columnas en cada escenario:
- `Clientes`
- `Precio_por_cliente_COP`
- `Costo_Infra_Mensual_COP`

No edites las celdas con formula de:
- `Ingresos_Mensuales_COP`
- `Margen_Infra_pct`
- `Utilidad_Mensual_COP`
- `Ingresos_Anuales_COP`
- `Costo_Infra_Anual_COP`
- `Utilidad_Anual_COP`

## Criterios de decision

- Saludable: `Margen_Infra_pct` entre `0,20` y `0,30`.
- Revisar costos: `Margen_Infra_pct` mayor a `0,30`.
- Riesgo alto: `Margen_Infra_pct` mayor a `0,40`.

## Recomendacion operativa

- Usa `Conservador_10` para plan minimo de continuidad.
- Usa `Base_20` como objetivo del siguiente trimestre.
- Usa `Agresivo_30` para simular inversion previa a escalar equipo/soporte.
