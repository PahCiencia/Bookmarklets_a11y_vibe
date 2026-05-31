# weAAAre - Curso de desarrollo accesible con IA

Repositorio del curso de desarrollo accesible con IA en la plataforma [weAAAre](https://weaaare.com).

## Descripción

Kit de **bookmarklets** para auditar la accesibilidad web ([WCAG 2.1](https://www.w3.org/WAI/standards-guidelines/wcag/)) de cualquier página en tiempo real.

Ejecuta los análisis directamente desde tu navegador y obtén:

- **Panel visual** con errores, avisos y verificaciones correctas
- **JSON exportable** para compartir resultados con un LLM
- **Cero dependencias** (excepto axe-core, que se carga desde CDN)

Cada bookmarklet se especializa en un aspecto diferente de la accesibilidad:

| Herramienta | Qué analiza |
|------------|-----------|
| **Headings** | Jerarquía h1-h6, niveles saltados, headings vacíos, múltiples H1 |
| **Axe-core** | Auditoría completa WCAG 2.1 usando el motor de Deque |
| **Imágenes** | Alt text ausente/vacío/largo, SVGs sin nombre accesible |
| **Contraste** | Ratio de colores (AA 4.5:1, AAA 7:1) |
| **Links** | Texto genérico, enlaces sin destino, nuevas pestañas sin aviso |
| **Formularios** | Labels asociados, fieldsets, autocomplete, botones sin texto |
| **Landmarks** | Regiones ARIA (main, nav, header), duplicados sin label |

## Estructura del proyecto

```
bookmarklets/
+-- build.js
+-- src/
¦   +-- shared/
¦   ¦   +-- panel.js
¦   ¦   +-- panel.css
¦   ¦   +-- overlay.js
¦   ¦   +-- overlay.css
¦   ¦   +-- output.js
¦   +-- headings/
¦   +-- axe/
¦   +-- images/
¦   +-- contrast/
¦   +-- links/
¦   +-- forms/
¦   +-- landmarks/
+-- page/
    +-- index.html
    +-- page.css
    +-- page.js
    +-- bookmarklets.json
    +-- bookmarklets-data.js
```

## Instalación

1. Clona el repositorio:

   ```sh
   git clone https://github.com/PahCiencia/Bookmarklets_a11y_vibe.git
   cd Bookmarklets_a11y_vibe
   ```

2. Compila los bookmarklets:

   ```sh
   cd bookmarklets
   node build.js
   ```

3. Abre `page/index.html` en tu navegador.

4. Arrastra cada bookmarklet a tu barra de favoritos.

## Uso

1. Navega a cualquier página web
2. Haz clic en el bookmarklet que quieras ejecutar
3. Aparecerá un **panel lateral** con los resultados
4. Haz clic en **"Copiar JSON"** para obtener el informe completo

El JSON se puede pegar directamente en un LLM (ChatGPT, Claude, etc.) para obtener recomendaciones de corrección.

## Compatibilidad

| Navegador | Soporte |
|-----------|---------|
| Chrome/Edge | ? 90+ |
| Firefox | ? 88+ |
| Safari | ? 14+ |

## Recursos

- [WCAG 2.1](https://www.w3.org/WAI/standards-guidelines/wcag/) — Pautas de Accesibilidad Web
- [Axe DevTools](https://www.deque.com/axe/devtools/) — Motor de auditoría WCAG
- [MDN: ARIA](https://developer.mozilla.org/es/docs/Web/Accessibility/ARIA) — Atributos accesibles

## Licencia

MIT

## Contacto

Si tienes preguntas o necesitas ayuda, puedes:
- Abrir un issue en este repositorio o escribir un comentario en la lección del curso.
- Contactar al equipo de weAAAre a través de hola@weaaare.com

---
Desarrollado con ?? por el equipo de weAARe
