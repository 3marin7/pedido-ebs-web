# ⚡ GUÍA RÁPIDA: ACTIVAR SISTEMA DE AUDITORÍA

## 📋 En 3 pasos está listo

### PASO 1️⃣: Copiar Script SQL

Abre el archivo: `../sql/SQL_CREAR_TABLA_MOVIMIENTOS.sql`

Copia TODO el contenido.

### PASO 2️⃣: Ejecutar en Supabase

1. Ve a tu **Supabase Dashboard**
2. Click en **SQL Editor** (izquierda)
3. Haz click en **New Query**
4. **Pega el código** del archivo
5. Haz click en **Run** (botón azul)

Deberías ver: ✅ Success

### PASO 3️⃣: Listo para usar

¡Ya está! Ahora:
- 📊 Cada factura guardada registra automáticamente un movimiento
- 🔍 Puedes verlos en `/movimientos`
- 📥 Puedes exportar a CSV

---

## 🧪 Prueba Inmediata

1. **Crea una factura** desde InvoiceScreen
2. **Agrega un producto** (ej: 10 unidades de Gigo)
3. **Guarda la factura**
4. **Ve a `/movimientos`**
5. **Deberías ver** el movimiento registrado

---

## 📁 Archivos del Sistema

```
src/components/
├── HistorialMovimientos.jsx    ← Componente para ver historial
├── HistorialMovimientos.css    ← Estilos
├── InvoiceScreen.jsx           ← MODIFICADO (agrega registro automático)
└── Navigation.jsx              ← MODIFICADO (agrega enlace /movimientos)

Raíz del proyecto/
├── sql/SQL_CREAR_TABLA_MOVIMIENTOS.sql               ← Script SQL
└── docs/
	├── RESUMEN_AUDITORIA_IMPLEMENTADA.md            ← Resumen completo
	├── IMPLEMENTACION_AUDITORIA_INVENTARIO.md       ← Guía detallada
	└── VISTA_PREVIA_AUDITORIA.md                    ← Cómo se ve
```

---

## ✅ Checklist Final

- [ ] Ejecuté el script SQL en Supabase
- [ ] La tabla se creó exitosamente (✅ Success)
- [ ] Los archivos .jsx y .css están en su lugar
- [ ] Hice una factura de prueba
- [ ] Verifiqué `/movimientos`
- [ ] Vi el movimiento registrado
- [ ] Probé los filtros
- [ ] Exporté a CSV

---

## 🆘 ¿Algo sale mal?

### Error: "Table does not exist"
✓ Ejecuta de nuevo el script SQL en Supabase

### Error: "Cannot read HistorialMovimientos"
✓ Verifica que el archivo esté en `src/components/`

### No aparece el enlace `/movimientos`
✓ Verifica que Navigation.jsx fue modificado correctamente

### El movimiento no se registra
✓ Abre la consola (F12) y busca errores
✓ Verifica que InvoiceScreen.jsx fue actualizado

---

## 📞 Soporte Rápido

**Problema:** La tabla ya existe en Supabase
**Solución:** Ejecuta el script tal cual, se sobrescribe

**Problema:** Los datos no se ven en `/movimientos`
**Solución:** Recarga la página (Ctrl+R o Cmd+R)

**Problema:** El CSV no se descarga
**Solución:** Desactiva bloqueador de pop-ups

---

## 🎯 Después de Implementar

Tendrás acceso a:
- ✅ **Historial completo** de cambios de stock
- ✅ **Auditoría permanente** de quién cambió qué
- ✅ **Trazabilidad** factura ↔ inventario
- ✅ **Reportes exportables** en CSV
- ✅ **Filtros avanzados** por producto, tipo, fecha
- ✅ **Cumplimiento normativo** de registros

---

## 💡 Casos de Uso

### Caso 1: Revisar faltantes
```
- Filtro por producto: "Gigo"
- Filtro tipo: "venta"
- Resultado: Ve todas las ventas de Gigo
- Acción: Verifica si los números coinciden con facturas
```

### Caso 2: Auditoría de usuario
```
- Filtro tipo: "ajuste"
- Rango de fechas: Últimos 7 días
- Resultado: Ve todos los ajustes del usuario
- Acción: Verificar si son legítimos
```

### Caso 3: Reporte mensual
```
- Rango: Todo enero 2026
- Exportar CSV
- Resultado: Archivo con todos los movimientos
- Acción: Análisis en Excel o Google Sheets
```

---

## 🚀 Ya está completamente implementado:

✅ **Tabla SQL** → Lista para ejecutar
✅ **Código de registro** → Agregado a InvoiceScreen
✅ **Interfaz de visualización** → HistorialMovimientos.jsx
✅ **Estilos** → HistorialMovimientos.css
✅ **Navegación** → Enlace en el menú
✅ **Documentación** → Completa

**Solo falta ejecutar el script SQL y ¡funcionará automáticamente!**

---

**Última actualización:** 26 de enero de 2026  
**Estado:** ✅ 100% Listo para implementar
