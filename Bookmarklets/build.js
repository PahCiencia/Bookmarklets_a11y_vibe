/**
 * A11Y AUDITOR — Script de Build
 *
 * Genera las URLs de bookmarklet para cada herramienta de análisis.
 * Ejecutar con: node build.js
 *
 * Resultado: bookmarklets/page/bookmarklets.json
 */

'use strict';

var fs = require('fs');
var path = require('path');

var SRC_DIR = path.join(__dirname, 'src');
var PAGE_DIR = path.join(__dirname, 'page');
var OUT_JSON = path.join(PAGE_DIR, 'bookmarklets.json');
var OUT_DATA_JS = path.join(PAGE_DIR, 'bookmarklets-data.js');

// Orden de carpetas de bookmarklets a incluir
var TOOLS = [
  { id: 'headings',  label: 'Analizar Headings',  description: 'Jerarquía h1-h6, niveles saltados, headings vacíos y múltiples H1.', icon: '¶' },
  { id: 'axe',       label: 'Axe-core WCAG 2.1',  description: 'Auditoría completa WCAG 2.1 usando axe-core. Detecta violations, alertas y pasa las verificaciones.', icon: '⚡' },
  { id: 'images',    label: 'Analizar Imágenes',   description: 'Alt text ausente, vacío, demasiado largo, SVGs sin accesibilidad, role="img" sin nombre.', icon: '🖼' },
  { id: 'contrast',  label: 'Analizar Contraste',  description: 'Ratio de contraste de textos (WCAG AA 4.5:1 y AAA 7:1). Marca todos los textos con bajo contraste.', icon: '◑' },
  { id: 'links',     label: 'Analizar Links',       description: 'Texto genérico, enlaces vacíos, sin destino, que abren nueva pestaña sin aviso.', icon: '↗' },
  { id: 'forms',     label: 'Analizar Formularios', description: 'Labels asociados, fieldset/legend en grupos, autocomplete, botones sin texto.', icon: '✎' },
  { id: 'landmarks', label: 'Analizar Landmarks',   description: 'Regiones ARIA (main, nav, header…), duplicados sin label, estructura de página.', icon: '⊞' }
];

// Archivos del módulo compartido (en orden de carga)
var SHARED_JS = [
  path.join(SRC_DIR, 'shared', 'panel.js'),
  path.join(SRC_DIR, 'shared', 'overlay.js'),
  path.join(SRC_DIR, 'shared', 'output.js')
];

var SHARED_CSS = [
  path.join(SRC_DIR, 'shared', 'panel.css'),
  path.join(SRC_DIR, 'shared', 'overlay.css')
];

/**
 * Lee un archivo y devuelve su contenido, o '' si no existe.
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return '';
  }
}

/**
 * Minificación básica de CSS: elimina comentarios, espacios y saltos innecesarios.
 * No requiere dependencias.
 */
function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')  // comentarios /* */
    .replace(/\s+/g, ' ')               // espacios múltiples
    .replace(/\s*([{};:,>+~])\s*/g, '$1') // espacios alrededor de caracteres especiales
    .replace(/;}/g, '}')                // último ; antes de }
    .trim();
}

/**
 * Minificación básica de JS: elimina comentarios de línea y líneas en blanco.
 * Conservativa — no altera strings ni regexp.
 */
function minifyJs(js) {
  return js
    .replace(/\/\*[\s\S]*?\*\//g, '')   // comentarios bloque
    .replace(/^\s*\/\/.*$/gm, '')        // comentarios línea
    .replace(/\n\s*\n/g, '\n')           // líneas vacías
    .trim();
}

/**
 * Genera el código JS completo de un bookmarklet (un único IIFE).
 */
function buildBookmarklet(toolId) {
  var toolDir = path.join(SRC_DIR, toolId);

  // CSS: shared + tool
  var allCss = SHARED_CSS.map(readFile).join('\n');
  allCss += '\n' + readFile(path.join(toolDir, toolId + '.css'));
  var minCss = minifyCss(allCss);
  // Escapar para embeber como template literal: primero \ luego `
  var escapedCss = minCss.replace(/\\/g, '\\\\').replace(/`/g, '\\`');

  // JS inyector de CSS
  var cssInjector = [
    'if(!document.getElementById("a11y-panel-styles")){',
    'var __s=document.createElement("style");',
    '__s.id="a11y-panel-styles";',
    '__s.textContent=`' + escapedCss + '`;',
    'document.head.appendChild(__s);}'
  ].join('');

  // JS: shared + tool
  var sharedJs = SHARED_JS.map(readFile).join('\n\n');
  var toolJs = readFile(path.join(toolDir, toolId + '.js'));
  var allJs = sharedJs + '\n\n' + toolJs;
  var minJs = minifyJs(allJs);

  // IIFE completo — exponer A11yOutput, A11yOverlay y A11yPanel globalmente
  var iife = '(function(){\n' 
    + cssInjector + '\n' 
    + minJs + '\n'
    + 'window.A11yOutput=A11yOutput;'
    + 'window.A11yOverlay=A11yOverlay;'
    + 'window.A11yPanel=A11yPanel;'
    + '\n})();';

  return iife;
}

/**
 * Convierte un IIFE en una URL de bookmarklet.
 */
function toBookmarkletUrl(code) {
  return 'javascript:' + encodeURIComponent(code);
}

// ---- MAIN ----

console.log('\n[A11Y AUDITOR] Generando bookmarklets...\n');

var result = TOOLS.map(function (tool) {
  try {
    var code = buildBookmarklet(tool.id);
    var url = toBookmarkletUrl(code);
    var sizeKb = (url.length / 1024).toFixed(1);
    console.log('  ✓ ' + tool.label.padEnd(30) + sizeKb + ' KB');
    return {
      id: tool.id,
      label: tool.label,
      description: tool.description,
      icon: tool.icon,
      url: url
    };
  } catch (e) {
    console.error('  ✗ Error en ' + tool.id + ':', e.message);
    return null;
  }
}).filter(Boolean);

// Asegurar que existe la carpeta page/
if (!fs.existsSync(PAGE_DIR)) {
  fs.mkdirSync(PAGE_DIR, { recursive: true });
}

// bookmarklets.json — para referencia
fs.writeFileSync(OUT_JSON, JSON.stringify(result, null, 2), 'utf8');

// bookmarklets-data.js — consumido directamente por index.html sin necesitar servidor
var dataJs = '// Generado automáticamente por build.js — no editar a mano\n';
dataJs += 'window.A11Y_BOOKMARKLETS = ' + JSON.stringify(result, null, 2) + ';\n';
fs.writeFileSync(OUT_DATA_JS, dataJs, 'utf8');

console.log('\n[A11Y AUDITOR] ✓ ' + result.length + ' bookmarklets generados');
console.log('  → ' + path.relative(process.cwd(), OUT_JSON));
console.log('  → ' + path.relative(process.cwd(), OUT_DATA_JS));
console.log('\nAbre bookmarklets/page/index.html en el navegador para ver la colección.\n');
