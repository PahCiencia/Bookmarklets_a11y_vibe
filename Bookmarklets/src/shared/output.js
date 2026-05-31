/**
 * A11Y AUDITOR — Salida JSON
 * Formatea los resultados, los muestra en consola y los copia al portapapeles.
 */

var A11yOutput = (function () {
  var _data = null;

  /**
   * Guarda el resultado del análisis y lo vuelca en consola.
   * @param {string} tool - Nombre del bookmarklet
   * @param {Array} issues - Lista de issues
   * @param {Object} summary - { errors, warnings, passes }
   * @param {Object} [extra] - Datos adicionales específicos de cada bookmarklet
   */
  function set(tool, issues, summary, extra) {
    _data = {
      tool: tool,
      url: location.href,
      timestamp: new Date().toISOString(),
      summary: {
        errors: summary.errors || 0,
        warnings: summary.warnings || 0,
        passes: summary.passes || 0,
        total: issues.length
      },
      issues: issues,
      extra: extra || null
    };

    // Volcado en consola con estilo
    console.group('%c A11Y AUDITOR · ' + tool, 'background:#0f1117;color:#7c85ff;font-weight:bold;padding:4px 8px;border-radius:3px');
    console.log('%c Errores: ' + _data.summary.errors + ' · Avisos: ' + _data.summary.warnings + ' · Correctos: ' + _data.summary.passes,
      'color:#9ca3af;font-size:11px');
    if (issues.length > 0) {
      var errors = issues.filter(function (i) { return i.severity === 'error'; });
      var warnings = issues.filter(function (i) { return i.severity === 'warning'; });
      if (errors.length > 0) {
        console.group('%c ✗ Errores', 'color:#f87171;font-weight:bold');
        errors.forEach(function (i) { console.error(i.message, i.selector || '', i.element || ''); });
        console.groupEnd();
      }
      if (warnings.length > 0) {
        console.group('%c ⚠ Advertencias', 'color:#fb923c;font-weight:bold');
        warnings.forEach(function (i) { console.warn(i.message, i.selector || '', i.element || ''); });
        console.groupEnd();
      }
    }
    console.log('%c JSON completo →', 'color:#4a5068;font-size:11px', _data);
    console.groupEnd();

    // Exponer los datos para lectura externa (agentes, scripts, etc.)
    window.A11yAuditData = _data;

    return _data;
  }

  /**
   * Copia el último resultado al portapapeles.
   */
  function copy() {
    if (!_data) {
      if (window.A11yPanel) A11yPanel.toast('⚠ No hay datos para copiar');
      return;
    }

    var json = JSON.stringify(_data, null, 2);

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(json).then(function () {
        if (window.A11yPanel) A11yPanel.toast('✓ JSON copiado al portapapeles');
      }).catch(function () {
        fallbackCopy(json);
      });
    } else {
      fallbackCopy(json);
    }
  }

  /**
   * Fallback para copiar sin navigator.clipboard (páginas http, iframes, etc.)
   */
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      if (window.A11yPanel) A11yPanel.toast('✓ JSON copiado al portapapeles');
    } catch (e) {
      if (window.A11yPanel) A11yPanel.toast('✗ No se pudo copiar. Abre DevTools para ver el JSON.');
    }
    ta.remove();
  }

  /**
   * Construye el objeto summary a partir de una lista de issues.
   * @param {Array} issues
   * @returns {{ errors: number, warnings: number, passes: number }}
   */
  function buildSummary(issues) {
    return issues.reduce(function (acc, issue) {
      if (issue.severity === 'error') acc.errors++;
      else if (issue.severity === 'warning') acc.warnings++;
      else if (issue.severity === 'pass') acc.passes++;
      return acc;
    }, { errors: 0, warnings: 0, passes: 0 });
  }

  /**
   * Devuelve el selector CSS de un elemento (simplificado pero único).
   * @param {Element} el
   * @returns {string}
   */
  function getSelector(el) {
    if (!el || el === document.body) return 'body';
    if (el.id) return '#' + el.id;

    var tag = el.tagName.toLowerCase();
    var parent = el.parentElement;
    if (!parent) return tag;

    var siblings = Array.prototype.slice.call(parent.children).filter(function (c) {
      return c.tagName === el.tagName;
    });
    var suffix = siblings.length > 1
      ? ':nth-of-type(' + (siblings.indexOf(el) + 1) + ')'
      : '';

    return getSelector(parent) + ' > ' + tag + suffix;
  }

  /**
   * Devuelve el HTML del elemento truncado para mostrarlo en el JSON.
   * @param {Element} el
   * @returns {string}
   */
  function getElementHtml(el) {
    if (!el) return '';
    var outer = el.outerHTML || '';
    return outer.length > 120 ? outer.slice(0, 120) + '…' : outer;
  }

  function get() {
    return _data;
  }

  return { set: set, get: get, copy: copy, buildSummary: buildSummary, getSelector: getSelector, getElementHtml: getElementHtml };
})();
