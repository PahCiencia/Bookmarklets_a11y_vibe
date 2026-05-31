/**
 * A11Y AUDITOR — Axe-core
 *
 * Carga axe-core desde CDN y ejecuta una auditoría WCAG 2.1 completa.
 * Mapea violations, passes e incomplete al formato estándar del panel.
 *
 * Dependencia: axe-core via CDN de cdnjs
 */

(function () {
  'use strict';

  var TOOL_NAME = 'Axe-core WCAG 2.1';
  var AXE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js';

  // Si ya hay un script de axe cargado, reutilizarlo directamente
  if (window.axe) {
    runAxe();
    return;
  }

  A11yPanel.toast('Cargando axe-core…');

  var script = document.createElement('script');
  script.src = AXE_CDN;
  script.onload = runAxe;
  script.onerror = function () {
    A11yPanel.toast('✗ No se pudo cargar axe-core. Comprueba la conexión.');
  };
  document.head.appendChild(script);

  function runAxe() {
    A11yPanel.toast('Analizando…');
    // Limpiar overlays anteriores antes de escanear para no contaminar resultados
    A11yOverlay.clearAll();

    // El exclude va en el CONTEXTO (primer parámetro), no en las opciones
    window.axe.run(
      {
        exclude: [
          ['#a11y-panel'],
          ['#a11y-toast'],
          ['.a11y-overlay-badge'],
          ['[data-a11y-bid]']
        ]
      },
      {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'best-practice'] }
      },
      function (err, results) {
      if (err) {
        A11yPanel.toast('✗ Error al ejecutar axe-core.');
        console.error('[A11Y AUDITOR] axe error:', err);
        return;
      }

      var issues = [];

      // Violations → errors
      (results.violations || []).forEach(function (v) {
        v.nodes.forEach(function (node) {
          var el = document.querySelector(node.target[0]);
          issues.push({
            severity: 'error',
            message: v.description,
            impact: v.impact,
            selector: node.target.join(', '),
            element: node.html || '',
            wcag: getWcagRef(v),
            help: v.help || '',
            helpUrl: v.helpUrl || '',
            failureSummary: node.failureSummary || '',
            _impact: v.impact,
            _id: v.id,
            _element: el
          });
          if (el) A11yOverlay.add(issues.length - 1, el, 'error', v.impact);
        });
      });

      // Incomplete → warnings (necesitan revisión manual)
      (results.incomplete || []).forEach(function (v) {
        v.nodes.forEach(function (node) {
          var el = document.querySelector(node.target[0]);
          issues.push({
            severity: 'warning',
            message: v.description,
            impact: 'revisar',
            selector: node.target.join(', '),
            element: node.html || '',
            wcag: getWcagRef(v),
            help: v.help || '',
            helpUrl: v.helpUrl || '',
            failureSummary: node.failureSummary || '',
            _impact: v.impact || 'moderate',
            _id: v.id,
            _element: el
          });
          if (el) A11yOverlay.add(issues.length - 1, el, 'warning', 'revisar');
        });
      });

      // Passes → info (solo el primero de cada regla para no saturar)
      (results.passes || []).forEach(function (v) {
        if (v.nodes.length === 0) return;
        var node = v.nodes[0];
        var el = document.querySelector(node.target[0]);
        issues.push({
          severity: 'pass',
          message: v.description,
          selector: node.target.join(', '),
          element: node.html || '',
          wcag: getWcagRef(v),
          _id: v.id
        });
      });

      var summary = A11yOutput.buildSummary(issues);
      var extra = {
        axeVersion: window.axe.version,
        violations: results.violations.length,
        passes: results.passes.length,
        incomplete: results.incomplete.length,
        inapplicable: (results.inapplicable || []).length
      };

      // Limpiamos el campo privado _element antes de serializar
      var cleanIssues = issues.map(function (i) {
        var copy = {};
        Object.keys(i).forEach(function (k) {
          if (k !== '_element') copy[k] = i[k];
        });
        return copy;
      });

      A11yOutput.set(TOOL_NAME, cleanIssues, summary, extra);
      A11yPanel.create(TOOL_NAME, cleanIssues, summary);
    });
  }

  /**
   * Extrae la primera referencia WCAG de una regla axe.
   * @param {Object} rule
   * @returns {string}
   */
  function getWcagRef(rule) {
    var tags = rule.tags || [];
    var wcag = tags.find(function (t) { return /^wcag\d/.test(t); });
    if (!wcag) return '';
    // "wcag111" → "1.1.1"
    return wcag.replace('wcag', '').split('').join('.').replace(/\.{2,}/g, '.').replace(/^\.|\.$/, '');
  }
})();
