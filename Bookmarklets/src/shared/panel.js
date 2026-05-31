/**
 * A11Y AUDITOR — Panel lateral
 * Crea y gestiona el panel de resultados que aparece a la derecha de la pantalla.
 */

var A11yPanel = (function () {
  var PANEL_ID = 'a11y-panel';
  var TOAST_ID = 'a11y-toast';
  var panel = null;
  var currentResults = null;
  var overlayItems = [];

  /**
   * Inyecta los estilos del panel si aún no están presentes.
   * @param {string} cssText - CSS a inyectar
   */
  function injectStyles(cssText, id) {
    if (document.getElementById(id)) return;
    var style = document.createElement('style');
    style.id = id;
    style.textContent = cssText;
    document.head.appendChild(style);
  }

  /**
   * Elimina el panel existente si lo hay.
   * @param {boolean} [clearOverlays=false] - Si true, también limpia los overlays
   */
  function destroy(clearOverlays) {
    var existing = document.getElementById(PANEL_ID);
    if (existing) existing.remove();
    if (clearOverlays) A11yOverlay.clearAll();
    panel = null;
  }


  /**
   * Construye el HTML de un ítem de resultado.
   * @param {Object} issue
   * @param {number} index
   */
  function buildItem(issue, index) {
    var wcagLabel = issue.wcag ? ' · WCAG ' + issue.wcag : '';
    var severityLabel = {
      error: 'Error crítico',
      warning: 'Advertencia',
      pass: 'Correcto'
    }[issue.severity] || 'Información';
    
    var selectorHtml = issue.selector
      ? '<span class="a11y-item-selector">' + escapeHtml(truncate(issue.selector, 40)) + '</span>'
      : '';
    var wcagHtml = issue.wcag
      ? '<span class="a11y-item-wcag">WCAG ' + escapeHtml(issue.wcag) + '</span>'
      : '';
    var impactHtml = issue.impact
      ? '<span class="a11y-impact ' + escapeHtml(issue.impact) + '">' + escapeHtml(issue.impact === 'revisar' ? 'Revisar' : issue.impact.toUpperCase()) + '</span>'
      : '';

    var detailHtml = '';
    if (issue.helpUrl || issue.failureSummary) {
      var summaryHtml = issue.failureSummary
        ? '<p class="a11y-detail-summary">' + escapeHtml(issue.failureSummary) + '</p>'
        : '';
      var linkHtml = issue.helpUrl
        ? '<a class="a11y-detail-link" href="' + escapeHtml(issue.helpUrl) + '" target="_blank" rel="noopener noreferrer">Más información ↗</a>'
        : '';
      detailHtml =
        '<button class="a11y-item-toggle" aria-expanded="false" aria-controls="a11y-detail-' + index + '">▸ Cómo arreglarlo</button>' +
        '<div class="a11y-item-detail" id="a11y-detail-' + index + '" hidden>' +
          summaryHtml +
          linkHtml +
        '</div>';
    }

    return (
      '<div class="a11y-item ' + issue.severity + '" data-index="' + index + '" tabindex="0" role="listitem" aria-label="' + severityLabel + ': ' + escapeHtml(truncate(issue.message, 60)) + wcagLabel + '">' +
        '<div class="a11y-item-message">' + impactHtml + (impactHtml ? ' ' : '') + escapeHtml(issue.message) + '</div>' +
        '<div class="a11y-item-meta">' + wcagHtml + selectorHtml + '</div>' +
        detailHtml +
      '</div>'
    );
  }

  /**
   * Agrupa los issues por severidad y construye el HTML de la lista.
   * @param {Array} issues
   */
  function buildList(issues) {
    if (!issues || issues.length === 0) {
      return (
        '<div class="a11y-empty">' +
          '<div class="a11y-empty-icon">✓</div>' +
          '<div class="a11y-empty-text">No se encontraron problemas.</div>' +
        '</div>'
      );
    }

    var groups = { error: [], warning: [], pass: [] };
    issues.forEach(function (issue, i) {
      var sev = issue.severity || 'warning';
      if (!groups[sev]) groups[sev] = [];
      groups[sev].push({ issue: issue, index: i });
    });

    var labels = { error: 'Errores', warning: 'Advertencias', pass: 'Correctos' };
    var html = '';

    ['error', 'warning', 'pass'].forEach(function (sev) {
      if (groups[sev].length === 0) return;
      html += '<div class="a11y-group">';
      html += '<div class="a11y-group-title ' + sev + '">' + labels[sev] + ' (' + groups[sev].length + ')</div>';
      groups[sev].forEach(function (entry) {
        html += buildItem(entry.issue, entry.index);
      });
      html += '</div>';
    });

    return html;
  }

  /**
   * Crea y muestra el panel con los resultados.
   * @param {string} toolName - Nombre del análisis
   * @param {Array} issues - Lista de issues
   * @param {Object} summary - { errors, warnings, passes }
   */
  function create(toolName, issues, summary) {
    A11yOverlay.clearAll();
    destroy(false);

    panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.setAttribute('role', 'complementary');
    panel.setAttribute('aria-label', 'Panel de accesibilidad: ' + toolName);

    var errors = summary.errors || 0;
    var warnings = summary.warnings || 0;
    var passes = summary.passes || 0;

    panel.innerHTML =
      '<div id="a11y-panel-header">' +
        '<div>' +
          '<div id="a11y-panel-title">A11Y AUDITOR</div>' +
          '<div id="a11y-panel-tool">' + escapeHtml(toolName) + '</div>' +
        '</div>' +
        '<button id="a11y-panel-close" aria-label="Cerrar panel">✕</button>' +
      '</div>' +
      '<div id="a11y-panel-summary" aria-label="Resumen">' +
        '<div class="a11y-summary-badge error" title="Errores críticos">' +
          '<span class="a11y-count">' + errors + '</span>' +
          '<span class="a11y-label">Errores</span>' +
        '</div>' +
        '<div class="a11y-summary-badge warning" title="Advertencias">' +
          '<span class="a11y-count">' + warnings + '</span>' +
          '<span class="a11y-label">Avisos</span>' +
        '</div>' +
        '<div class="a11y-summary-badge pass" title="Verificaciones correctas">' +
          '<span class="a11y-count">' + passes + '</span>' +
          '<span class="a11y-label">Correctos</span>' +
        '</div>' +
      '</div>' +
      '<div id="a11y-panel-actions">' +
        '<button class="a11y-btn" id="a11y-btn-toggle-overlay" aria-label="Alternar visibilidad de los indicadores visuales sobre la página">Ocultar marcas</button>' +
        '<button class="a11y-btn primary" id="a11y-btn-copy" aria-label="Copiar resultados del análisis en formato JSON al portapapeles">Copiar JSON</button>' +
      '</div>' +
      '<div id="a11y-panel-list" role="list">' + buildList(issues) + '</div>' +
      '<div id="a11y-panel-url" title="' + escapeHtml(location.href) + '">' + escapeHtml(location.href) + '</div>';

    document.body.appendChild(panel);
    currentResults = issues;

    // Aplicar overlays encolados si el sistema de queue está disponible
    if (A11yOverlay.flush) A11yOverlay.flush();

    // Eventos
    document.getElementById('a11y-panel-close').addEventListener('click', function () { destroy(true); });

    document.getElementById('a11y-btn-copy').addEventListener('click', function () {
      if (window.A11yOutput && window.A11yOutput.copy) {
        window.A11yOutput.copy();
      } else {
        toast('✗ No hay datos disponibles para copiar');
      }
    });

    var overlayVisible = true;
    document.getElementById('a11y-btn-toggle-overlay').addEventListener('click', function () {
      overlayVisible = !overlayVisible;
      A11yOverlay.toggle(overlayVisible);
      this.textContent = overlayVisible ? 'Ocultar marcas' : 'Mostrar marcas';
    });

    // Hover sobre items: resaltar el elemento en la página
    panel.querySelectorAll('.a11y-item').forEach(function (item, itemIndex) {
      var idx = parseInt(item.getAttribute('data-index'), 10);
      
      item.addEventListener('mouseenter', function () {
        A11yOverlay.highlight(idx, true);
      });
      item.addEventListener('mouseleave', function () {
        A11yOverlay.highlight(idx, false);
      });
      item.addEventListener('click', function () {
        A11yOverlay.scrollTo(idx);
      });
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          A11yOverlay.scrollTo(idx);
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          var items = Array.prototype.slice.call(panel.querySelectorAll('.a11y-item'));
          var nextIndex = itemIndex + 1;
          if (nextIndex < items.length) {
            items[nextIndex].focus();
          }
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          var items = Array.prototype.slice.call(panel.querySelectorAll('.a11y-item'));
          var prevIndex = itemIndex - 1;
          if (prevIndex >= 0) {
            items[prevIndex].focus();
          }
        }
      });
    });

    // Toggle de detalle: dropdown "Cómo arreglarlo"
    panel.querySelectorAll('.a11y-item-toggle').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        btn.textContent = (!expanded ? '▾ ' : '▸ ') + 'Cómo arreglarlo';
        var detailEl = document.getElementById(btn.getAttribute('aria-controls'));
        if (detailEl) detailEl.hidden = expanded;
      });
    });
  }

  /**
   * Muestra una notificación flotante breve.
   * @param {string} message
   */
  function toast(message) {
    var existing = document.getElementById(TOAST_ID);
    if (existing) existing.remove();

    var el = document.createElement('div');
    el.id = TOAST_ID;
    el.textContent = message;
    document.body.appendChild(el);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        el.classList.add('visible');
      });
    });

    setTimeout(function () {
      el.classList.remove('visible');
      setTimeout(function () { el.remove(); }, 250);
    }, 2000);
  }

  // --- Helpers ---
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function truncate(str, max) {
    return str.length > max ? str.slice(0, max) + '…' : str;
  }

  return { create: create, destroy: destroy, toast: toast, injectStyles: injectStyles };
})();
