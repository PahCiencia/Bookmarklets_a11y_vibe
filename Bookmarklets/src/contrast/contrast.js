/**
 * A11Y AUDITOR — Analizar Contraste
 *
 * Calcula el contraste entre el color del texto y el fondo para cada
 * elemento de texto visible en la página.
 *
 * Niveles WCAG 2.1:
 *   AA  → 4.5:1 texto normal, 3:1 texto grande (≥18pt o ≥14pt negrita)
 *   AAA → 7:1 texto normal, 4.5:1 texto grande
 */

(function () {
  'use strict';

  var TOOL_NAME = 'Analizar Contraste';
  var MAX_ELEMENTS = 200; // Límite para no bloquear el navegador

  var issues = [];
  var checked = 0;

  // Selector de elementos con texto directo
  var candidates = Array.prototype.slice.call(
    document.querySelectorAll('p, li, a, button, label, span, div, h1, h2, h3, h4, h5, h6, td, th, caption, legend, dt, dd, blockquote, figcaption')
  );

  candidates.forEach(function (el) {
    if (checked >= MAX_ELEMENTS) return;
    if (el.closest('#a11y-panel')) return; // Ignorar elementos dentro del panel
    if (!isVisible(el)) return;
    if (!hasDirectText(el)) return;

    var style = window.getComputedStyle(el);
    var colorStr = style.color;
    var bgStr = resolveBackground(el);

    if (!colorStr || !bgStr) return;

    var fg = parseColor(colorStr);
    var bg = parseColor(bgStr);
    if (!fg || !bg) return;

    var ratio = contrastRatio(fg, bg);
    var ratioStr = ratio.toFixed(2) + ':1';
    var fontSize = parseFloat(style.fontSize);
    var isBold = parseInt(style.fontWeight, 10) >= 700 || style.fontWeight === 'bold';
    var isLarge = fontSize >= 24 || (isBold && fontSize >= 18.67); // 18pt ≈ 24px, 14pt ≈ 18.67px

    var aaRequired = isLarge ? 3 : 4.5;
    var aaaRequired = isLarge ? 4.5 : 7;
    var sizeLabel = isLarge ? ' (texto grande)' : '';

    var selector = A11yOutput.getSelector(el);
    var html = A11yOutput.getElementHtml(el);

    if (ratio < aaRequired) {
      issues.push({
        severity: 'error',
        message: 'Contraste insuficiente' + sizeLabel + ': ' + ratioStr + ' (mínimo AA: ' + aaRequired + ':1)',
        selector: selector,
        element: html,
        wcag: '1.4.3',
        _ratio: ratio,
        _fg: colorStr,
        _bg: bgStr
      });
      A11yOverlay.add(issues.length - 1, el, 'error', ratioStr);
    } else if (ratio < aaaRequired) {
      issues.push({
        severity: 'warning',
        message: 'Pasa AA' + sizeLabel + ' (' + ratioStr + ') — No alcanza AAA (' + aaaRequired + ':1)',
        selector: selector,
        element: html,
        wcag: '1.4.6',
        _ratio: ratio,
        _fg: colorStr,
        _bg: bgStr
      });
      A11yOverlay.add(issues.length - 1, el, 'warning', ratioStr);
    } else {
      issues.push({
        severity: 'pass',
        message: 'Pasa AAA' + sizeLabel + ': ' + ratioStr,
        selector: selector,
        element: html,
        wcag: '1.4.6',
        _ratio: ratio
      });
    }

    checked++;
  });

  if (checked === 0) {
    issues.push({
      severity: 'warning',
      message: 'No se encontraron elementos de texto analizables',
      selector: 'body',
      element: '',
      wcag: '1.4.3'
    });
  }

  var summary = A11yOutput.buildSummary(issues);

  // Limpiar campos privados antes de serializar
  var cleanIssues = issues.map(function (i) {
    return { severity: i.severity, message: i.message, selector: i.selector, element: i.element, wcag: i.wcag };
  });

  A11yOutput.set(TOOL_NAME, cleanIssues, summary, { elementsChecked: checked });
  A11yPanel.create(TOOL_NAME, cleanIssues, summary);

  // =============================================================
  // Funciones auxiliares
  // =============================================================

  /**
   * Comprueba si un elemento es visible en pantalla.
   */
  function isVisible(el) {
    var style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    if (parseFloat(style.opacity) === 0) return false;
    var rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  /**
   * Comprueba si el elemento tiene texto directo (no solo en hijos).
   */
  function hasDirectText(el) {
    for (var i = 0; i < el.childNodes.length; i++) {
      if (el.childNodes[i].nodeType === Node.TEXT_NODE && el.childNodes[i].textContent.trim()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Sube por el DOM para resolver el color de fondo real (ignorando transparentes).
   * @param {Element} el
   * @returns {string|null}
   */
  function resolveBackground(el) {
    var current = el;
    while (current && current !== document.documentElement) {
      var style = window.getComputedStyle(current);
      var bg = style.backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        return bg;
      }
      current = current.parentElement;
    }
    // Fondo del html/body
    return '#ffffff'; // Fallback blanco
  }

  /**
   * Parsea un color CSS a { r, g, b } (0-255).
   * Soporta rgb() y rgba().
   * @param {string} str
   * @returns {{r:number, g:number, b:number}|null}
   */
  function parseColor(str) {
    var m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (m) return { r: +m[1], g: +m[2], b: +m[3] };

    // Soporte hex fallback vía canvas (para colores con nombre)
    if (str.startsWith('#')) {
      var hex = str.slice(1);
      if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16)
      };
    }
    return null;
  }

  /**
   * Calcula la luminancia relativa según WCAG 2.1.
   * @param {{r:number, g:number, b:number}} color
   * @returns {number}
   */
  function relativeLuminance(color) {
    var r = linearize(color.r / 255);
    var g = linearize(color.g / 255);
    var b = linearize(color.b / 255);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function linearize(c) {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  /**
   * Calcula el ratio de contraste entre dos colores.
   * @returns {number}
   */
  function contrastRatio(fg, bg) {
    var l1 = relativeLuminance(fg);
    var l2 = relativeLuminance(bg);
    var lighter = Math.max(l1, l2);
    var darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }
})();
