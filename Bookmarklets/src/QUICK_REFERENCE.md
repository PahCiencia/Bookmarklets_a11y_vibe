# 📋 Quick Reference - Bookmarklets de Accesibilidad

## ⚡ Instalación Rápida (30 segundos)

1. **Abre:** [page/index.html](../page/index.html)
2. **Copia:** Código del bookmarklet
3. **Crea marcador:** Pega en URL
4. **Usa:** Click en navegador web
5. **Mira:** Panel flotante con resultados

---

## 🎯 Los 8 Bookmarklets

### 📋 Analizar Headings
- **Detecta:** H1 único, saltos de nivel (H1→H3), headings vacíos
- **Salida:** Lista de headings + problemas encontrados
- **Útil para:** Validar estructura documento
- **WCAG:** 1.3.1 Info and Relationships

### 🖼️ Analizar Imágenes  
- **Detecta:** Alt faltante, vacío, genérico, nombres de archivo
- **Salida:** Estado alt por imagen + problemas
- **Útil para:** Validar textos alternativos
- **WCAG:** 1.1.1 Non-text Content

### 🎨 Analizar Contraste
- **Detecta:** Ratios insuficientes (< 4.5:1 para AA)
- **Salida:** Ratio por elemento + cumplimiento WCAG
- **Útil para:** Validar legibilidad color
- **WCAG:** 1.4.3 Contrast (Minimum)

### ⚙️ Auditoría Axe-Core
- **Detecta:** 50+ violaciones WCAG automáticas
- **Salida:** Violaciones + incompletos + pases
- **Útil para:** Análisis exhaustivo
- **WCAG:** Múltiples criterios

---

## 📊 Los 4 Adicionales

### 📝 Análisis Texto Alt
- Puntuación 0-100 por imagen (calidad)
- Detecta patrones débiles, nombres archivo, etc
- JSON con puntuación individual

### 🏗️ Análisis Semántica HTML
- Valida nav, main, section, article, footer
- Detecta divitis, estructura incorrecta
- Verifica atributo lang

### 📋 Análisis Formularios
- Labels asociadas (for/id correctos)
- Fieldsets con legend
- Detecta campos sin acceso
- Estado de cada input

### 🎨 Ratios Color WCAG
- Tabla de ratios únicos encontrados
- Desglose WCAG AA vs AAA
- Elementos problematicos detallados
- Recomendaciones de colores

---

## 📤 Panel y JSON

### Panel Flotante
```
┌─────────────────────────┐
│ 📋 Análisis de Headings │ ← Título + botón cerrar
├─────────────────────────┤
│ ✓ H1: "Inicio"          │ ← Resultados visual
│ ❌ Falta H2              │    con resaltados
│ ⚠️  Heading vacío        │    en página
├─────────────────────────┤
│ [📋 Copiar JSON] [🖥️ Consola] │ ← Botones acción
└─────────────────────────┘
```

### JSON Normalizado
```json
{
  "analisis": "headings",
  "timestamp": "2026-04-21T10:30:00Z",
  "urlPagina": "https://ejemplo.com",
  "resumen": {
    "totalHeadings": 5,
    "problemasEncontrados": 1,
    "headingsValidos": 4
  },
  "headings": [...],
  "problemas": [...]
}
```

**Disponible en:**
- 📋 Copiar al portapapeles (1 click)
- 🖥️ Consola DevTools (F12)

---

## 🤖 Con LLMs

### Flujo
```
Web page
  ↓
[Ejecutar bookmarklet]
  ↓ Panel + JSON
Copiar JSON
  ↓
Pegar en LLM prompt
  ↓
LLM genera recomendaciones
  ↓
Código HTML/CSS arreglado
```

### Prompt Ejemplo
```
Aquí hay un análisis de accesibilidad:

[JSON]

Basándote en WCAG 2.2, genera:
1. Código HTML corregido
2. Cambios CSS
3. Explicación de cada cambio
```

---

## 🔧 Arquitectura

### lib.js (Compartida)
```javascript
A11yAuditLib.
  ├── createPanel()          // Panel accesible
  ├── getElementSelector()   // Selector CSS
  ├── getContrastRatio()     // Ratio WCAG
  ├── getWcagRecommendation() // Recomendaciones
  └── ... 10+ funciones más
```

### Cada Bookmarklet
```javascript
(function() {
  A11yAuditLib.onReady(() => {
    const panel = A11yAuditLib.createPanel('...');
    const results = analyze();        // Lógica
    displayResults(panel, results);   // Visual
    panel.enableJsonButtons({...});   // JSON export
  });
})();
```

---

## 🎨 Accesibilidad del Panel

✅ **Semántica HTML**
- `<aside role="complementary">` para panel
- `<button>` para botones
- `aria-label` en elementos

✅ **Navegación**
- Tab entre botones
- Escape para cerrar
- Foco siempre visible

✅ **Contraste**
- 4.5:1 mínimo (AA)
- Modo oscuro automático
- Iconografía + texto

✅ **Responsive**
- Desktop: panel derecha
- Mobile: panel abajo (60vh)

---

## 🧪 Testing Rápido

### Headings
1. Página con h1
2. Ejecutar bookmarklet
3. Debería mostrar lista de headings
4. JSON en consola

### Imágenes
1. Página con imágenes sin alt
2. Ejecutar bookmarklet
3. Debería resaltar imágenes
4. Mostrar alt='' o genéricos

### Contraste
1. Página con texto bajo contraste
2. Ejecutar bookmarklet
3. Debería marcar con rojo
4. Mostrar ratio < 4.5:1

---

## 📚 Estándares

**WCAG 2.2 Cubierto:**
- ✓ 1.1.1 Non-text Content (imágenes)
- ✓ 1.3.1 Info and Relationships (headings, forms, semántica)
- ✓ 1.4.3 Contrast (AA/AAA)
- ✓ 3.1.1 Language of Page (lang)
- ✓ 3.3.1-3.3.2 Forms

---

## ⚡ Performance

- **Headings:** <100ms
- **Imágenes:** <200ms
- **Contraste:** <500ms (depende cantidad elementos)
- **Axe-core:** 1-3s (carga desde CDN)
- **Panel:** <50ms renderizar

---

## 🔐 Seguridad

✅ Sin acceso datos personales
✅ No modifica página permanentemente
✅ Local execution (ningún server)
⚠️ Axe-core desde CDN (jsDelivr)

---

## 🚀 Próximas Versiones

### v1.1 (Próxima)
- [ ] Minificar para menor tamaño
- [ ] Soporte iframes
- [ ] Testing cross-browser
- [ ] Offline mode

### v1.2
- [ ] Análisis navegación teclado
- [ ] Color picker accesible
- [ ] ARIA validation
- [ ] Caché resultados

### v2.0
- [ ] Extensión navegador
- [ ] Dashboard web
- [ ] Export HTML/PDF
- [ ] Integración CI/CD

---

## 📞 Ayuda Rápida

### Panel no aparece
- Verifica consola (F12)
- Recarga página
- Intenta otro bookmarklet

### JSON no copia
- Usa "Ver en Consola" (F12)
- Click derecho, copiar

### Contraste diferente
- CSS dinámico afecta colores
- Valida en DevTools
- Usa muestrador de colores

---

**Última actualización:** 21 de abril de 2026
**Versión:** 1.0 MVP
