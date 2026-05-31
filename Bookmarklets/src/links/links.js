/**
 * A11Y AUDITOR — Analizar Links (Enlace)
 *
 * Verifica:
 * - Texto de enlace genérico ("haz clic aquí", "leer más", "aquí", "más info"…)
 * - Enlaces sin texto accesible (vacíos)
 * - href vacío o solo "#"
 * - title que duplica el texto visible
 * - Enlace que abre en nueva ventana sin aviso (_target="blank" sin indicación)
 */

(function () {
  'use strict';

  var TOOL_NAME = 'Analizar Links';

  var GENERIC_TEXTS = [
    'haz clic aquí', 'click aquí', 'click here', 'clic aquí', 'aquí', 'here',
    'leer más', 'read more', 'ver más', 'más', 'more', 'ver',
    'más información', 'more info', 'info',
    'enlace', 'link', 'ir a', 'go to', 'continuar', 'continue',
    'pulsa aquí', 'pulse aquí', 'this', 'este enlace'
  ];

  var issues = [];
  var links = Array.prototype.slice.call(document.querySelectorAll('a'));

  links.forEach(function (el) {
    if (el.closest('#a11y-panel')) return; // Ignorar elementos dentro del panel
    var selector = A11yOutput.getSelector(el);
    var html = A11yOutput.getElementHtml(el);
    var href = el.getAttribute('href');
    var target = el.getAttribute('target');

    // Texto accesible: aria-label > aria-labelledby > contenido textual
    var ariaLabel = el.getAttribute('aria-label') || '';
    var ariaLabelledby = el.getAttribute('aria-labelledby') || '';
    var textContent = (el.textContent || el.innerText || '').trim();
    var accessibleText = (ariaLabel || textContent).trim();

    // Nombre resuelto por aria-labelledby
    if (!ariaLabel && ariaLabelledby) {
      var labelEl = document.getElementById(ariaLabelledby);
      if (labelEl) accessibleText = (labelEl.textContent || '').trim();
    }

    // Img dentro del enlace: el alt cuenta como texto
    var img = el.querySelector('img');
    if (!accessibleText && img && img.getAttribute('alt')) {
      accessibleText = img.getAttribute('alt').trim();
    }

    // --- Enlace vacío ---
    if (!accessibleText) {
      issues.push({
        severity: 'error',
        message: 'Enlace sin nombre accesible (vacío)',
        selector: selector,
        element: html,
        wcag: '2.4.4'
      });
      A11yOverlay.add(issues.length - 1, el, 'error', 'enlace vacío');
      return;
    }

    // --- href ausente o solo "#" ---
    if (!href || href === '#') {
      issues.push({
        severity: 'warning',
        message: 'Enlace sin destino válido (href="' + (href || '') + '"): "' + truncate(accessibleText, 50) + '"',
        selector: selector,
        element: html,
        wcag: '2.4.4'
      });
      A11yOverlay.add(issues.length - 1, el, 'warning', 'sin destino');
    }

    // --- Texto genérico ---
    var normalized = accessibleText.toLowerCase().replace(/[^\w\s]/gi, '').trim();
    if (GENERIC_TEXTS.indexOf(normalized) !== -1) {
      issues.push({
        severity: 'error',
        message: 'Texto de enlace genérico: "' + accessibleText + '" — no describe el destino',
        selector: selector,
        element: html,
        wcag: '2.4.6'
      });
      A11yOverlay.add(issues.length - 1, el, 'error', 'texto genérico');
      return;
    }

    // --- Abre en nueva pestaña sin aviso ---
    if (target === '_blank') {
      var hasNotice = accessibleText.toLowerCase().includes('nueva ventana')
        || accessibleText.toLowerCase().includes('new window')
        || accessibleText.toLowerCase().includes('nueva pestaña')
        || el.querySelector('[aria-label*="nueva"]')
        || (el.getAttribute('title') || '').toLowerCase().includes('nueva');

      if (!hasNotice) {
        issues.push({
          severity: 'warning',
          message: 'Enlace que abre en nueva pestaña sin aviso: "' + truncate(accessibleText, 50) + '"',
          selector: selector,
          element: html,
          wcag: '3.2.5'
        });
        A11yOverlay.add(issues.length - 1, el, 'warning', 'nueva pestaña');
        return;
      }
    }

    // --- title que duplica el texto visible ---
    var title = el.getAttribute('title') || '';
    if (title && title.trim().toLowerCase() === accessibleText.toLowerCase()) {
      issues.push({
        severity: 'warning',
        message: 'title duplica el texto visible: "' + truncate(accessibleText, 50) + '"',
        selector: selector,
        element: html,
        wcag: '2.4.6'
      });
      A11yOverlay.add(issues.length - 1, el, 'warning', 'title duplicado');
      return;
    }

    // --- Correcto ---
    issues.push({
      severity: 'pass',
      message: '"' + truncate(accessibleText, 70) + '"',
      selector: selector,
      element: html,
      wcag: '2.4.4'
    });
  });

  if (links.length === 0) {
    issues.push({ severity: 'pass', message: 'No se encontraron enlaces en la página', selector: 'body', element: '', wcag: '2.4.4' });
  }

  var summary = A11yOutput.buildSummary(issues);
  A11yOutput.set(TOOL_NAME, issues, summary, { totalLinks: links.length });
  A11yPanel.create(TOOL_NAME, issues, summary);

  function truncate(str, max) {
    return str.length > max ? str.slice(0, max) + '…' : str;
  }
})();
