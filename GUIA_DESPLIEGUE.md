# 🚀 GUÍA DE DESPLIEGUE

**Feature:** Vendedor en Carrito  
**Versión:** 1.0  
**Fecha:** 21 de febrero de 2026  

---

## ✅ PRE-REQUISITOS (VERIFICAR ANTES)

- [ ] SQL ejecutado en Supabase
- [ ] Código actualizado (git pull/push)
- [ ] Aplicación compilada sin errores
- [ ] Pruebas locales pasadas

---

## 📋 CHECKLIST DE DESPLIEGUE

### 1. Verificar Base de Datos ✅
```bash
# En Supabase SQL Editor:
SELECT column_name FROM information_schema.columns 
WHERE table_name='pedidos' AND column_name='vendedor';
```
**Debe mostrar:** vendedor | character varying

---

### 2. Hacer Build Local
```bash
cd /Users/edwinmarin/pedido-ebs-web
npm run build
```
**Resultado esperado:**
```
✓ built in XXXms
```

---

### 3. Verificar Compilación
```bash
npm run lint
```
**Resultado esperado:**
```
0 errors
0 warnings
```

---

### 4. Deploy a Producción

**Si usas Vercel/Netlify:**
```bash
git add .
git commit -m "feat: agregar vendedor en carrito"
git push origin main
```

**Si usas servidor directo:**
```bash
npm run build
# Copiar archivos de dist/ a servidor web
```

---

### 5. Post-Despliegue

#### 5a. Limpiar Caché
```
Comunica a usuarios:
"Limpia el caché: Ctrl+Shift+Del → Cookies y caché"
```

#### 5b. Prueba Funcional

**En Producción (después de despliegue):**
1. Abre aplicación
2. Ve a Catálogo
3. Agrega producto
4. Abre carrito
5. ✅ Debe ver dropdown de vendedor
6. Selecciona vendedor
7. Llena datos
8. Envía pedido
9. ✅ Debe guardarse sin error
10. Ve a Gestión de Pedidos
11. ✅ Debe ver el vendedor
12. Haz clic "Cargar como Factura"
13. ✅ Vendedor debe estar pre-llenado

#### 5c. Monitoreo

**Verificar logs de errores:**
```
- Errores de compilación: 0
- Errores de BD: 0
- Errores de JS: 0
```

---

## 🎯 ROLLBACK (Si hay problemas)

**Si algo falla:**
```bash
# Revertir último commit
git revert HEAD

# Push cambios
git push origin main
```

---

## 📊 MÉTRICAS POST-DESPLIEGUE

### Para monitorear:
- [ ] Velocidad de carga (normal)
- [ ] Errores de JS (0)
- [ ] Errores de BD (0)
- [ ] Usuarios usando feature (ver analytics)

---

## 🔍 TESTING EN PRODUCCIÓN

**Casos de Prueba:**

### Caso 1: Crear Pedido
```
✅ Vendedor aparece en carrito
✅ Es campo obligatorio
✅ Acepta 3 opciones diferentes
✅ Se guarda en BD
```

### Caso 2: Ver en Gestión
```
✅ Vendedor visible en lista pedidos
✅ Vendedor visible en modal
✅ Vendedor correcto (no otro pedido)
```

### Caso 3: Cargar como Factura
```
✅ Vendedor pre-llenado
✅ Es editable
✅ Se guarda en factura
```

### Caso 4: Datos Antiguos
```
✅ Pedidos sin vendedor muestran "Sin asignar"
✅ Se pueden cargar como factura
```

---

## 📞 EQUIPO DE SOPORTE

**Si hay problemas, verificar:**

### Problema: "Campo Vendedor no aparece"
**Solución:**
1. Limpiar caché (Ctrl+Shift+Del)
2. F5 para recargar
3. Verifica que SQL se ejecutó

### Problema: "Error al guardar pedido"
**Solución:**
1. Verifica que columna `vendedor` existe en BD
2. Revisa logs de Supabase
3. Ejecuta SQL si no existe la columna

### Problema: "Vendedor no se pre-llena en factura"
**Solución:**
1. Verifica que estés usando "Cargar como Factura"
2. No uses "Crear Factura" del menú
3. Verifica que pedido tiene vendedor guardado

---

## 📈 MÉTRICAS DE ÉXITO

```
✅ 0 errores de compilación
✅ 0 errores de runtime
✅ Feature funciona en todos navegadores
✅ Usuarios pueden usar sin problemas
✅ Vendedor se guarda correctamente
✅ Vendedor se importa en factura
✅ Validación funciona
✅ Performance normal
```

---

## ✨ DESPUÉS DEL DESPLIEGUE

1. **Comunica a usuarios**
   - "Nuevo campo: Vendedor en carrito"
   - "Es obligatorio seleccionar vendedor"

2. **Documenta cambios**
   - Actualiza changelog
   - Notifica al equipo

3. **Monitorea por 24hrs**
   - Revisa logs
   - Verifica sin errores
   - Recibe feedback

---

## 🎉 DESPLIEGUE EXITOSO SIGNIFICA

```
✅ Usuarios pueden seleccionar vendedor
✅ Vendedor se guarda en cada pedido
✅ Vendedor se importa automáticamente
✅ Sin errores ni crashes
✅ Rendimiento normal
✅ Base de datos intacta
```

---

**ESTADO:** ✅ LISTO PARA DESPLIEGUE  
**RIESGO:** ⭐⭐☆☆☆ BAJO  
**APROBACIÓN:** AUTOMÁTICA  

**¡Adelante con el despliegue! 🚀**
