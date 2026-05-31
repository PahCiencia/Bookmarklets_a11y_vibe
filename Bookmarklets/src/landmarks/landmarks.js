/**
 * A11Y AUDITOR — Analizar Landmarks
 *
 * Verifica:
 * - Presencia de región <main> (o role="main")
 * - Presencia de <header> / <nav> / <footer>
 * - Landmarks duplicados sin aria-label diferenciador
 * - Uso de role explícito correcto
 */

(function () {
  'use strict';

  var TOOL_NAME = 'Analizar Landmarks';
  var issues = [];

  // Mapa: [selector, role esperado, nombre legible]
  var LANDMARK_DEFS = [
    { selector: 'main, [role="main"]',              role: 'main',          label: 'Main',           required: true,  color: '#7c85ff', unique: true },
    { selector: 'header, [role="banner"]',           role: 'banner',        label: 'Banner',         required: false, color: '#22d3ee', unique: true },
    { selector: 'footer, [role="contentinfo"]',      role: 'contentinfo',   label: 'Content Info',   required: false, color: '#a78bfa', unique: true },
    { selector: 'nav, [role="navigation"]',          role: 'navigation',    label: 'Navigation',     required: false, color: '#34d399', unique: false },
    { selector: '[role="search"]',                   role: 'search',        label: 'Search',         required: false, color: '#fbbf24', unique: false },
    { selector: 'aside, [role="complementary"]',     role: 'complementary', label: 'Complementary',  required: false, color: '#f472b6', unique: false },
    { selector: '[role="form"], form[aria-label], form[aria-labelledby]', role: 'form', label: 'Form', required: false, color: '#fb923c', unique: false },
    { selector: '[role="region"][aria-label], [role="region"][aria-labelledby]', role: 'region', label: 'Region', required: false, color: '#e2e8f0', unique: false }
  ];

  var foundLandmarks = [];

  LANDMARK_DEFS.forEach(function (def) {
    var elements = Array.prototype.slice.call(document.querySelectorAll(def.selector));
    // Filtrar elementos dentro del panel
    elements = elements.filter(function (el) { return !el.closest('#a11y-panel'); });

    // Landmark requerido no encontrado
    if (elements.length === 0 && def.required) {
      issues.push({
        severity: 'error',
        message: 'No se encontró región <' + def.label + '> requerida',
        selector: def.selector,
        element: '',
        wcag: '1.3.6'
      });
      return;
    }

    // Landmark único duplicado sin aria-label
    if (def.unique && elements.length > 1) {
      elements.forEach(function (el) {
        var ariaLabel = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || '';
        var selector = A11yOutput.getSelector(el);
        var html = A11yOutput.getElementHtml(el);
        if (!ariaLabel) {
          issues.push({
            severity: 'error',
            message: 'Múltiple región <' + def.label + '> sin aria-label diferenciador',
            selector: selector,
            element: html,
            wcag: '1.3.6'
          });
          A11yOverlay.add(issues.length - 1, el, 'error', def.label + ' duplicado');
        } else {
          issues.push({
            severity: 'pass',
            message: 'Múltiple <' + def.label + '> con aria-label — correcto',
            selector: selector,
            element: html,
            wcag: '1.3.6'
          });
          A11yOverlay.add(issues.length - 1, el, 'pass', def.label);
        }
        foundLandmarks.push({ el: el, def: def });
      });
      return;
    }

    // Múltiples navigation sin aria-label
    if (!def.unique && elements.length > 1 && (def.role === 'navigation')) {
      elements.forEach(function (el) {
        var ariaLabel = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || '';
        var selector = A11yOutput.getSelector(el);
        var html = A11yOutput.getElementHtml(el);
        if (!ariaLabel) {
          issues.push({
            severity: 'warning',
            message: 'Múltiple <nav> sin aria-label diferenciador — usuarios de lector de pantalla no pueden distinguirlos',
            selector: selector,
            element: html,
            wcag: '2.4.1'
          });
          A11yOverlay.add(issues.length - 1, el, 'warning', 'nav sin label');
        } else {
          issues.push({
            severity: 'pass',
            message: '<nav> con aria-label: "' + ariaLabel + '" — correcto',
            selector: selector,
            element: html,
            wcag: '2.4.1'
          });
          A11yOverlay.add(issues.length - 1, el, 'pass', 'nav');
        }
        foundLandmarks.push({ el: el, def: def });
      });
      return;
    }

    // Encontrado correctamente
    elements.forEach(function (el) {
      var ariaLabel = el.getAttribute('aria-label') || '';
      var selector = A11yOutput.getSelector(el);
      var html = A11yOutput.getElementHtml(el);
      var msg = '<' + def.label + '>' + (ariaLabel ? ' (aria-label: "' + ariaLabel + '")' : '') + ' — correcto';
      issues.push({
        severity: 'pass',
        message: msg,
        selector: selector,
        element: html,
        wcag: '1.3.6'
      });
      A11yOverlay.add(issues.length - 1, el, 'pass', def.label);
      foundLandmarks.push({ el: el, def: def });
    });
  });

  var summary = A11yOutput.buildSummary(issues);
  A11yOutput.set(TOOL_NAME, issues, summary, {
    totalLandmarks: foundLandmarks.length,
    landmarkTypes: LANDMARK_DEFS.map(function (d) {
      return { role: d.role, count: document.querySelectorAll(d.selector).length };
    })
  });
  A11yPanel.create(TOOL_NAME, issues, summary);
})();
