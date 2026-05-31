/**
 * A11Y AUDITOR — Analizar Imágenes
 *
 * Verifica:
 * - <img> sin atributo alt
 * - <img> con alt vacío que no son decorativas (heurístico)
 * - Alt demasiado largo (>125 caracteres)
 * - <svg> sin título accesible (title, aria-label, aria-labelledby)
 * - Elementos con role="img" sin nombre accesible
 * - <img> dentro de <a> donde el alt es la única fuente de texto del enlace
 */

(function () {
  'use strict';

  var TOOL_NAME = 'Analizar Imágenes';
  var issues = [];

  // --- 1. <img> estándar ---
  var imgs = Array.prototype.slice.call(document.querySelectorAll('img'));
  imgs.forEach(function (el) {
    if (el.closest('#a11y-panel')) return; // Ignorar elementos dentro del panel
    var selector = A11yOutput.getSelector(el);
    var html = A11yOutput.getElementHtml(el);
    var hasAlt = el.hasAttribute('alt');
    var alt = el.getAttribute('alt') || '';
    var src = el.getAttribute('src') || '';
    var isDecorative = alt === '' && el.getAttribute('role') === 'presentation';
    var inLink = !!el.closest('a');

    if (!hasAlt) {
      issues.push({
        severity: 'error',
        message: 'Imagen sin atributo alt',
        selector: selector,
        element: html,
        wcag: '1.1.1'
      });
      A11yOverlay.add(issues.length - 1, el, 'error', 'sin alt');
      return;
    }

    if (alt === '') {
      if (inLink) {
        // Si está en un enlace y es la única fuente de texto, es un error
        var link = el.closest('a');
        var linkText = (link.textContent || '').replace(el.alt || '', '').trim();
        if (!linkText) {
          issues.push({
            severity: 'error',
            message: 'Imagen dentro de enlace con alt vacío — el enlace no tiene nombre accesible',
            selector: selector,
            element: html,
            wcag: '2.4.4'
          });
          A11yOverlay.add(issues.length - 1, el, 'error', 'enlace sin nombre');
          return;
        }
      }
      // Alt vacío en imagen decorativa: correcto
      issues.push({
        severity: 'pass',
        message: 'Imagen decorativa (alt vacío) — ' + truncate(src, 40),
        selector: selector,
        element: html,
        wcag: '1.1.1'
      });
      return;
    }

    // Alt demasiado largo
    if (alt.length > 125) {
      issues.push({
        severity: 'warning',
        message: 'Alt demasiado largo (' + alt.length + ' chars): "' + truncate(alt, 60) + '"',
        selector: selector,
        element: html,
        wcag: '1.1.1'
      });
      A11yOverlay.add(issues.length - 1, el, 'warning', 'alt largo');
      return;
    }

    // Alt que es solo el nombre de archivo (mala práctica)
    var fileNamePattern = /\.(png|jpe?g|gif|webp|svg|bmp|tiff?)$/i;
    if (fileNamePattern.test(alt)) {
      issues.push({
        severity: 'warning',
        message: 'Alt parece un nombre de archivo: "' + alt + '"',
        selector: selector,
        element: html,
        wcag: '1.1.1'
      });
      A11yOverlay.add(issues.length - 1, el, 'warning', 'alt = nombre de archivo');
      return;
    }

    // Correcto
    issues.push({
      severity: 'pass',
      message: 'Alt correcto: "' + truncate(alt, 70) + '"',
      selector: selector,
      element: html,
      wcag: '1.1.1'
    });
  });

  // --- 2. <svg> ---
  var svgs = Array.prototype.slice.call(document.querySelectorAll('svg'));
  svgs.forEach(function (el) {
    var selector = A11yOutput.getSelector(el);
    var html = A11yOutput.getElementHtml(el);
    var isDecorativeSvg = el.getAttribute('aria-hidden') === 'true'
      || el.getAttribute('role') === 'presentation'
      || el.getAttribute('focusable') === 'false';

    if (isDecorativeSvg) {
      issues.push({
        severity: 'pass',
        message: 'SVG decorativo (aria-hidden) — correcto',
        selector: selector,
        element: html,
        wcag: '1.1.1'
      });
      return;
    }

    var title = el.querySelector('title');
    var ariaLabel = el.getAttribute('aria-label');
    var ariaLabelledby = el.getAttribute('aria-labelledby');

    var hasAccessibleName = (title && title.textContent.trim())
      || ariaLabel
      || ariaLabelledby;

    if (!hasAccessibleName) {
      issues.push({
        severity: 'error',
        message: 'SVG sin nombre accesible — añade <title>, aria-label o aria-labelledby, o aria-hidden="true" si es decorativo',
        selector: selector,
        element: html,
        wcag: '1.1.1'
      });
      A11yOverlay.add(issues.length - 1, el, 'error', 'SVG sin nombre');
    } else {
      issues.push({
        severity: 'pass',
        message: 'SVG con nombre accesible — correcto',
        selector: selector,
        element: html,
        wcag: '1.1.1'
      });
    }
  });

  // --- 3. role="img" ---
  var roleImgs = Array.prototype.slice.call(document.querySelectorAll('[role="img"]'));
  roleImgs.forEach(function (el) {
    if (el.tagName.toLowerCase() === 'svg') return; // ya procesado arriba
    var selector = A11yOutput.getSelector(el);
    var html = A11yOutput.getElementHtml(el);
    var ariaLabel = el.getAttribute('aria-label');
    var ariaLabelledby = el.getAttribute('aria-labelledby');

    if (!ariaLabel && !ariaLabelledby) {
      issues.push({
        severity: 'error',
        message: 'Elemento con role="img" sin aria-label ni aria-labelledby',
        selector: selector,
        element: html,
        wcag: '1.1.1'
      });
      A11yOverlay.add(issues.length - 1, el, 'error', 'role=img sin nombre');
    } else {
      issues.push({
        severity: 'pass',
        message: 'role="img" con nombre accesible — correcto',
        selector: selector,
        element: html,
        wcag: '1.1.1'
      });
    }
  });

  // Sin imágenes en la página
  if (imgs.length === 0 && svgs.length === 0 && roleImgs.length === 0) {
    issues.push({
      severity: 'pass',
      message: 'No se encontraron imágenes en la página',
      selector: 'body',
      element: '',
      wcag: '1.1.1'
    });
  }

  var summary = A11yOutput.buildSummary(issues);
  A11yOutput.set(TOOL_NAME, issues, summary, {
    totalImgs: imgs.length,
    totalSvgs: svgs.length,
    totalRoleImgs: roleImgs.length
  });
  A11yPanel.create(TOOL_NAME, issues, summary);

  // --- Helpers ---
  function truncate(str, max) {
    return str.length > max ? str.slice(0, max) + '…' : str;
  }
})();
