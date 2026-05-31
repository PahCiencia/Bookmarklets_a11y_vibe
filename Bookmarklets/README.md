# 📊 Bookmarklets de Auditoría de Accesibilidad Web

Suite de 8 bookmarklets accesibles para testear y auditar la accesibilidad de páginas web en tiempo real, según WCAG 2.2.

## 🎯 Propósito

Estos bookmarklets están diseñados para **auditores de accesibilidad**, **desarrolladores** y **usuarios LLM** que necesiten:

1. **Análisis visual instantáneo** en la página web
2. **Exportación de resultados en JSON** para procesar con IA/LLMs
3. **Recomendaciones basadas en WCAG 2.2** de forma accesible

## 📦 Los 8 Bookmarklets

### Core (4 Esenciales)

| Nombre | Función | Salida |
|--------|---------|--------|
| **📋 Analizar Headings** | Valida estructura jerárquica h1-h6, detecta saltos de nivel | Panel + JSON con lista de headings |
| **🖼️ Analizar Imágenes** | Detecta imágenes sin alt, alt vacío o genérico | Panel + JSON con estado de cada imagen |
| **🎨 Analizar Contraste** | Valida ratios de color (WCAG AA/AAA) | Panel + JSON con ratios por elemento |
| **⚙️ Auditoría Axe-Core** | Análisis automático completo con axe-core | Panel + JSON con violaciones/pases |

### Adicionales (4 Especializados)

| Nombre | Función | Salida |
|--------|---------|--------|
| **📝 Análisis de Texto Alt** | Evalúa calidad del alt (puntuación 0-100) | Panel + JSON con puntuación por imagen |
| **🏗️ Análisis Semántico HTML** | Valida uso de nav, main, section, article | Panel + JSON con estructura semántica |
| **📋 Análisis de Formularios** | Valida labels, fieldsets, accesibilidad | Panel + JSON con estado de campos |
| **🎨 Ratios de Color WCAG** | Análisis detallado con tabla de contraste | Panel + JSON con ratios únicos |

## 🚀 Instalación Rápida

### Paso 1: Copiar Código

Abre [Bookmarklets/page/index.html](./page/index.html) en tu navegador y **copia el bookmarklet** que desees instalar.

### Paso 2: Crear Marcador

**Chrome/Edge:**
1. Abre **Marcadores** (Ctrl+Shift+B)
2. Click derecho → **Agregar página**
3. **Nombre:** "A11y - Headings" (u otro)
4. **URL:** Pega el código copiado
5. ✓ ¡Listo!

**Firefox:**
1. Abre **Marcadores** (Ctrl+Shift+B)
2. Click derecho → **Nuevo marcador**
3. Sigue los mismos pasos que Chrome

**Safari:**
1. Abre **Marcadores** (Cmd+Option+B)
2. Click derecho → **Nuevo marcador**
3. Sigue los mismos pasos

### Paso 3: Usar

1. Navega a cualquier página web
2. Haz clic en tu bookmarklet
3. ¡Aparecerá un panel flotante con los resultados!

## 📋 Estructura de Proyecto

```
Bookmarklets/
├── src/
│   ├── lib.js              ← Librería compartida (utilidades, panel, JSON export)
│   ├── styles.css          ← Estilos base del panel (accesible, responsive)
│   ├── headings.js         ← Bookmarklet: Analizar Headings
│   ├── images.js           ← Bookmarklet: Analizar Imágenes
│   ├── contrast.js         ← Bookmarklet: Analizar Contraste
│   ├── axe-core.js         ← Bookmarklet: Auditoría Axe-Core
│   ├── alt-text.js         ← Bookmarklet: Análisis Texto Alt
│   ├── semantics.js        ← Bookmarklet: Análisis Semántica HTML
│   ├── forms.js            ← Bookmarklet: Análisis Formularios
│   └── color-ratios.js     ← Bookmarklet: Análisis Ratios WCAG
├── page/
│   ├── index.html          ← Página web de instalación
│   └── agents.md           ← Notas de decisiones
└── README.md               ← Este archivo
```

## 🔧 Arquitectura Técnica

### lib.js - Utilidades Compartidas

Todas los bookmarklets usan `lib.js` que proporciona:

- **`createPanel(title)`** - Crea panel flotante accesible
- **`getElementSelector(el)`** - Obtiene selector CSS único
- **`getContrastRatio(color1, color2)`** - Calcula contraste WCAG
- **`getWcagRecommendation(issueType)`** - Recomendaciones WCAG
- **Más**: `getComputedColor()`, `isElementVisible()`, `getAccessibleName()`, etc.

### Panel Flotante Accesible

El panel que aparece es:

✅ **Accesible:**
- Semántica HTML correcta (`<aside role="complementary">`)
- Navegación por teclado (Tab, Escape para cerrar)
- ARIA labels y roles apropiados
- Contraste 4.5:1 mínimo (AA)

✅ **Visual:**
- Flotante en esquina derecha (mobile: abajo)
- Sin interferir con contenido de página
- Modo oscuro automático (respeta preferencias)
- Resaltados sutiles de elementos problemáticos

✅ **Funcional:**
- Botón "Copiar JSON" (al portapapeles)
- Botón "Ver en Consola" (F12)
- Cierre con ✕ o Escape

## 📊 Formato JSON de Salida

Cada bookmarklet devuelve JSON normalizado con estructura:

```json
{
  "analisis": "headings",
  "timestamp": "2026-04-21T10:30:00.000Z",
  "urlPagina": "https://ejemplo.com",
  "resumen": {
    "totalHeadings": 5,
    "problemasEncontrados": 1,
    "headingsValidos": 4
  },
  "headings": [
    {
      "nivel": 1,
      "texto": "Título Principal",
      "selector": "body > h1",
      "visible": true
    }
  ],
  "problemas": [
    {
      "type": "heading_skip",
      "severity": "warning",
      "title": "Salto de nivel H1 a H3",
      "element": "body > h3",
      "description": "...",
      "recommendation": "...",
      "wcagCriteria": "1.3.1 Info and Relationships"
    }
  ]
}
```

### Estructura Común

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `analisis` | string | Tipo de análisis (headings, imagenes, etc) |
| `timestamp` | ISO string | Cuándo se ejecutó |
| `urlPagina` | string | URL de la página analizada |
| `resumen` | object | Estadísticas principales |
| `problemas` | array | Lista de issues encontrados |
| `<tipo específico>` | array | Datos específicos (headings, imagenes, etc) |

Cada problema incluye:
- `type` - Código del problema
- `severity` - error / warning / info / success
- `title` - Descripción breve
- `element` - Selector CSS (si aplica)
- `description` - Detalles
- `recommendation` - Cómo arreglarlo
- `wcagCriteria` - Criterio WCAG afectado

## 🤖 Uso con LLMs

### Flujo Típico

1. **Auditor** ejecuta bookmarklet en página web
2. **JSON es copiado** al portapapeles
3. **LLM recibe contexto** con problemas detectados
4. **LLM genera** recomendaciones detalladas o código de arreglo

### Ejemplo Prompt para LLM

```
Analiza este resultado de auditoría de accesibilidad y sugiere 
cambios específicos de código para arreglarlo:

[PEGA JSON AQUÍ]

Basate en WCAG 2.2 y proporciona:
- Código HTML corregido
- Cambios CSS (si aplica)
- Explicación de por qué cada cambio mejora accesibilidad
```

## 🎨 Personalización

### Agregar un nuevo bookmarklet

1. **Crear archivo** en `src/new-bookmarklet.js`
2. **Usar la estructura estándar:**
   ```javascript
   (function() {
     A11yAuditLib.onReady(() => {
       injectStyles();
       const panel = A11yAuditLib.createPanel('📌 Mi Análisis');
       const results = myAnalysis();
       displayResults(panel, results);
       panel.enableJsonButtons({ ... });
     });
   })();
   ```
3. **Agregar a** `page/index.html`
4. **Comprimir/minificar** para producción (opcional)

### Personalizar estilos

Edita `src/styles.css` para cambiar:
- Colores del panel
- Tamaños de fuente
- Posición (derecha/izquierda)
- Ancho máximo

## ✅ Validación y Testing

### Verificación Manual

Para cada bookmarklet:

1. **Panel aparece** ✓
2. **Resultados se muestran** correctamente ✓
3. **JSON es válido** (pega en `JSON.parse()`) ✓
4. **Botones funcionan** (copiar, consola) ✓
5. **Elementos resaltados** visibles ✓
6. **Recomendaciones** son relevantes ✓

### Testing Automatizado (Próximo)

```bash
# Próximo: Agregar tests con Jest/Vitest
npm test

# Validar JSON output
npm run validate-json

# Lighthouse integration
npm run audit
```

## 📚 Estándares y Referencias

### WCAG 2.2 Criterios Cubiertos

- **1.1.1** Non-text Content (imágenes, alt)
- **1.3.1** Info and Relationships (headings, semántica, formularios)
- **1.4.3** Contrast (Minimum) - AA/AAA
- **2.4.3** Focus Order (formularios)
- **3.1.1** Language of Page (atributo lang)
- **3.3.1** Error Identification (validación)
- **3.3.2** Labels or Instructions (forms)

### Recursos

- [WCAG 2.2 Specification](https://www.w3.org/WAI/WCAG22/quickref/)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)

## 🛡️ Limitaciones Conocidas

1. **No analiza contenido en iframes** - Próximo: soporte para iframes embebidos
2. **No ejecuta JavaScript** - Analiza estado estático de DOM
3. **No detecta problemas de navegación por teclado avanzada** - Requiere testing manual
4. **Colores computados** - Puede variar con CSS dinámico
5. **Contraste** - No analiza iconografía sin texto

## 🔐 Seguridad

✅ **Seguro por defecto:**
- No accede a datos personales
- No realiza requests a servidores externos (excepto axe-core CDN)
- No modifica permanentemente la página
- No almacena datos

⚠️ **Consideraciones:**
- Axe-core se carga desde CDN (jsDelivr)
- Recomendado usar en sitios confiables
- Los datos JSON pueden contener información sensible

## 🤝 Contribuir

### Reportar Bugs

Si encuentras un problema:
1. Nota el **nombre del bookmarklet**
2. **URL de la página** donde falló
3. **Qué esperabas** vs **qué sucedió**
4. **Navegador y versión**

### Sugerencias de Mejora

- Nuevos análisis a incluir
- Mejor visual del panel
- Optimizaciones de performance
- Soporte de más idiomas

## 📄 Licencia

Estos bookmarklets están diseñados para uso educativo en auditoría de accesibilidad.

## 🎓 Aprendizaje

Útil para aprender:
- Cómo funciona la accesibilidad web en práctica
- WCAG 2.2 criterios específicos
- Cómo crear herramientas accesibles
- JSON para procesar con LLMs
- Bookmarklets en JavaScript vanilla

---

**Última actualización:** 21 de abril de 2026

**Autor:** Suite de Auditoría de Accesibilidad Web

¡Que disfrutes auditando accesibilidad! 🎉
