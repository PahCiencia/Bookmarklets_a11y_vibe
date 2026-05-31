/**
 * A11Y AUDITOR — Analizar Headings
 *
 * Verifica:
 * - Jerarquía h1-h6 (niveles saltados)
 * - Múltiples h1
 * - Headings vacíos o sin texto accesible
 * - Headings ocultos con display:none / visibility:hidden
 */

(function () {
  'use strict';

  var TOOL_NAME = 'Analizar Headings';
  var headings = Array.prototype.slice.call(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));

  var issues = [];
  var prevLevel = 0;
  var h1Count = 0;

  headings.forEach(function (el, i) {
    if (el.closest('#a11y-panel')) return; // Ignorar elementos dentro del panel
    var level = parseInt(el.tagName.slice(1), 10);
    var style = window.getComputedStyle(el);
    var isHidden = style.display === 'none' || style.visibility === 'hidden' || el.getAttribute('aria-hidden') === 'true';
    var text = (el.textContent || el.innerText || '').trim();
    var ariaLabel = el.getAttribute('aria-label') || '';
    var accessibleText = (ariaLabel || text).trim();

    var selector = A11yOutput.getSelector(el);
    var html = A11yOutput.getElementHtml(el);

    // Heading vacío
    if (!accessibleText) {
      issues.push({
        severity: 'error',
        message: el.tagName + ' vacío — no tiene texto accesible',
        selector: selector,
        element: html,
        wcag: '2.4.6'
      });
      A11yOverlay.add(issues.length - 1, el, 'error', el.tagName + ' vacío');
      prevLevel = level;
      return;
    }

    // Heading oculto — no debería ser parte de la jerarquía visible
    if (isHidden) {
      issues.push({
        severity: 'warning',
        message: el.tagName + ' oculto: "' + truncate(accessibleText, 50) + '"',
        selector: selector,
        element: html,
        wcag: '1.3.1'
      });
      A11yOverlay.add(issues.length - 1, el, 'warning', el.tagName + ' oculto');
      return;
    }

    // Contar h1
    if (level === 1) {
      h1Count++;
      if (h1Count > 1) {
        issues.push({
          severity: 'warning',
          message: 'Múltiple H1 (' + h1Count + 'º): "' + truncate(accessibleText, 50) + '"',
          selector: selector,
          element: html,
          wcag: '2.4.6'
        });
        A11yOverlay.add(issues.length - 1, el, 'warning', 'H1 extra');
      } else {
        issues.push({
          severity: 'pass',
          message: 'H1 correcto: "' + truncate(accessibleText, 50) + '"',
          selector: selector,
          element: html,
          wcag: '2.4.6'
        });
        A11yOverlay.add(issues.length - 1, el, 'pass', 'H1');
      }
    } else {
      // Comprueba salto de nivel (solo cuando hay un prevLevel)
      if (prevLevel > 0 && level > prevLevel + 1) {
        issues.push({
          severity: 'error',
          message: 'Nivel saltado: H' + prevLevel + ' → H' + level + ' — "' + truncate(accessibleText, 50) + '"',
          selector: selector,
          element: html,
          wcag: '1.3.1'
        });
        A11yOverlay.add(issues.length - 1, el, 'error', 'H' + level + ' saltado');
      } else {
        issues.push({
          severity: 'pass',
          message: el.tagName + ': "' + truncate(accessibleText, 60) + '"',
          selector: selector,
          element: html,
          wcag: '1.3.1'
        });
        A11yOverlay.add(issues.length - 1, el, 'pass', el.tagName);
      }
    }

    prevLevel = level;
  });

  // No hay h1 en absoluto
  if (h1Count === 0 && headings.length > 0) {
    issues.unshift({
      severity: 'error',
      message: 'No se encontró ningún H1 en la página',
      selector: 'body',
      element: '',
      wcag: '2.4.6'
    });
  }

  // Sin headings
  if (headings.length === 0) {
    issues.push({
      severity: 'warning',
      message: 'La página no tiene ningún heading (h1-h6)',
      selector: 'body',
      element: '',
      wcag: '2.4.6'
    });
  }

  var summary = A11yOutput.buildSummary(issues);
  A11yOutput.set(TOOL_NAME, issues, summary, { totalHeadings: headings.length });
  A11yPanel.create(TOOL_NAME, issues, summary);

  // --- Helpers ---
  function truncate(str, max) {
    return str.length > max ? str.slice(0, max) + '…' : str;
  }
})();
