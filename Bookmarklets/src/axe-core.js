/**
 * Bookmarklet: Ejecutar Axe-Core
 * Ejecuta auditoría automática completa con axe-core
 */

(function() {
  'use strict';

  // Cargar axe-core desde CDN
  const axeCoreUrl = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js';

  A11yAuditLib.onReady(() => {
    injectStyles();
    const panel = A11yAuditLib.createPanel('⚙️ Auditoría Axe-Core');

    // Mostrar estado de carga
    panel.addLine('Cargando axe-core...', 'a11y-result-info');

    loadAxeCore().then(() => {
      panel.content.innerHTML = ''; // Limpiar
      runAxeAnalysis(panel);
    }).catch(err => {
      panel.content.innerHTML = `
        <div class="a11y-result a11y-result-error">
          <div class="a11y-result-level">❌</div>
          <div class="a11y-result-body">
            <p class="a11y-result-title">Error al cargar axe-core</p>
            <p class="a11y-result-desc">${err.message}</p>
          </div>
        </div>
      `;
    });
  });

  function injectStyles() {
    if (document.getElementById('a11y-audit-styles')) return;
    const style = document.createElement('style');
    style.id = 'a11y-audit-styles';
    style.textContent = getBaseStyles();
    document.head.appendChild(style);
  }

  function getBaseStyles() {
    return `
      #a11y-audit-panel {
        position: fixed; right: 0; top: 0; bottom: 0; width: 420px; max-width: 90vw;
        z-index: 999999; background: #ffffff; border-left: 4px solid #1976d2;
        box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15); display: flex;
        flex-direction: column; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 14px; line-height: 1.5; color: #212121;
      }
      .a11y-panel-header {
        display: flex; justify-content: space-between; align-items: center;
        padding: 16px; border-bottom: 1px solid #e0e0e0; background: #fafafa;
        flex-shrink: 0; gap: 8px;
      }
      .a11y-panel-title { margin: 0; font-size: 16px; font-weight: 600; color: #1976d2; flex: 1; }
      .a11y-panel-close {
        background: transparent; border: 2px solid transparent; color: #666;
        font-size: 20px; width: 32px; height: 32px; padding: 4px;
        cursor: pointer; border-radius: 4px; flex-shrink: 0;
      }
      .a11y-panel-close:hover { background: #e8e8e8; }
      .a11y-panel-close:focus-visible { outline: 2px solid #1976d2; outline-offset: 2px; }
      .a11y-panel-content {
        flex: 1; overflow-y: auto; overflow-x: hidden; padding: 16px; background: #ffffff;
      }
      .a11y-panel-footer {
        display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid #e0e0e0;
        background: #fafafa; flex-shrink: 0;
      }
      .a11y-panel-btn {
        flex: 1; padding: 10px 12px; border: 1px solid #bdbdbd; background: #ffffff;
        color: #212121; border-radius: 4px; font-size: 13px; font-weight: 500;
        cursor: pointer;
      }
      .a11y-panel-btn:hover:not(:disabled) { background: #f5f5f5; }
      .a11y-panel-btn:focus-visible { outline: 2px solid #1976d2; outline-offset: -2px; }
      .a11y-panel-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .a11y-result {
        display: flex; gap: 12px; padding: 12px; margin-bottom: 12px;
        border-radius: 4px; border-left: 4px solid; background: #f9f9f9;
      }
      .a11y-result-error { border-left-color: #d32f2f; background: #ffebee; }
      .a11y-result-warning { border-left-color: #f57c00; background: #fff3e0; }
      .a11y-result-success { border-left-color: #388e3c; background: #e8f5e9; }
      .a11y-result-info { border-left-color: #1976d2; background: #e3f2fd; }
      .a11y-result-level { font-size: 20px; flex-shrink: 0; }
      .a11y-result-body { flex: 1; }
      .a11y-result-body p { margin: 0; padding: 0; }
      .a11y-result-body p + p { margin-top: 8px; }
      .a11y-result-title { font-weight: 600; color: #212121; margin: 0 !important; }
      .a11y-result-desc { color: #424242; font-size: 13px; margin: 0 !important; }
      .a11y-result-element { background: #f0f0f0; padding: 4px 6px; border-radius: 3px;
        font-family: monospace; font-size: 12px; color: #d32f2f; margin: 0 !important; }
      .a11y-result-rec { background: rgba(25, 118, 210, 0.08); padding: 8px; border-radius: 3px;
        margin: 0 !important; font-size: 13px; color: #0d47a1; }
      .a11y-axe-violations { border-left-color: #d32f2f; background: #ffebee; }
      .a11y-axe-incomplete { border-left-color: #f57c00; background: #fff3e0; }
      .a11y-axe-passes { border-left-color: #388e3c; background: #e8f5e9; }
    `;
  }

  /**
   * Carga axe-core desde CDN
   */
  function loadAxeCore() {
    return new Promise((resolve, reject) => {
      if (window.axe) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = axeCoreUrl;
      script.onload = () => {
        if (window.axe) {
          resolve();
        } else {
          reject(new Error('axe-core no se cargó correctamente'));
        }
      };
      script.onerror = () => {
        reject(new Error(`No se pudo cargar axe-core desde ${axeCoreUrl}`));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Ejecuta análisis con axe-core
   */
  function runAxeAnalysis(panel) {
    window.axe.run({
      runOnly: {
        type: 'tag',
        values: ['wcag2aa', 'wcag21aa', 'wcag22aa']
      }
    }, (error, results) => {
      if (error) {
        console.error('Error en axe-core:', error);
        return;
      }

      displayResults(panel, results);

      // Exportar JSON
      const jsonResults = {
        analisis: 'axe-core',
        timestamp: new Date().toISOString(),
        urlPagina: window.location.href(),
        version: window.axe.version,
        resumen: {
          violaciones: results.violations.length,
          incompletos: results.incomplete.length,
          pasados: results.passes.length
        },
        violations: results.violations.map(v => ({
          id: v.id,
          impacto: v.impact,
          descripcion: v.description,
          ayuda: v.help,
          enlace: v.helpUrl,
          nodos: v.nodes.length,
          nodosAfectados: v.nodes.map(n => ({
            html: n.html,
            impacto: n.impact
          }))
        })),
        incomplete: results.incomplete,
        passes: results.passes.length
      };

      panel.enableJsonButtons(jsonResults);
    });
  }

  /**
   * Muestra resultados del análisis
   */
  function displayResults(panel, results) {
    const { violations, incomplete, passes } = results;

    // Resumen
    const summary = document.createElement('div');
    summary.innerHTML = `
      <div class="a11y-result a11y-result-error">
        <div class="a11y-result-level">❌</div>
        <div class="a11y-result-body">
          <p class="a11y-result-title">${violations.length} Violaciones</p>
          <p class="a11y-result-desc">Problemas que fallan WCAG</p>
        </div>
      </div>
      <div class="a11y-result a11y-result-warning">
        <div class="a11y-result-level">⚠️</div>
        <div class="a11y-result-body">
          <p class="a11y-result-title">${incomplete.length} Incompletos</p>
          <p class="a11y-result-desc">Requiere verificación manual</p>
        </div>
      </div>
      <div class="a11y-result a11y-result-success">
        <div class="a11y-result-level">✓</div>
        <div class="a11y-result-body">
          <p class="a11y-result-title">${passes.length} Pasados</p>
          <p class="a11y-result-desc">Criterios cumplidos</p>
        </div>
      </div>
    `;
    panel.content.appendChild(summary);

    // Violaciones
    if (violations.length > 0) {
      panel.addLine('', '');
      panel.addLine('🔴 Violaciones encontradas:', 'a11y-result-title');
      violations.slice(0, 10).forEach(v => {
        panel.addResult({
          title: v.id,
          description: v.description,
          recommendation: v.help
        }, 'error');
      });

      if (violations.length > 10) {
        panel.addLine(`... y ${violations.length - 10} violaciones más.`, 'a11y-result-desc');
      }
    }

    // Incompletos
    if (incomplete.length > 0) {
      panel.addLine('', '');
      panel.addLine('🟡 Requieren verificación manual:', 'a11y-result-title');
      incomplete.slice(0, 5).forEach(i => {
        panel.addLine(`• ${i.id}: ${i.description}`, 'a11y-result-desc');
      });
    }

    console.log('[Axe-Core] Resultados completos:', results);
  }
})();
