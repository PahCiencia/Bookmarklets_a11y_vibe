/**
 * Bookmarklet: Analizar Headings
 * Detecta estructura de encabezados y valida según WCAG
 */

(function() {
  'use strict';

  A11yAuditLib.onReady(() => {
    // Cargar estilos
    injectStyles();

    // Crear panel
    const panel = A11yAuditLib.createPanel('📋 Análisis de Headings');

    // Ejecutar análisis
    const results = analyzeHeadings();

    // Mostrar resultados en panel
    displayResults(panel, results);

    // Exportar JSON
    panel.enableJsonButtons({
      analisis: 'headings',
      timestamp: new Date().toISOString(),
      urlPagina: window.location.href,
      resumen: {
        totalHeadings: results.headings.length,
        problemasEncontrados: results.issues.length,
        headingsValidos: results.headings.length - results.issues.length
      },
      headings: results.headings,
      problemas: results.issues
    });
  });

  /**
   * Inyecta estilos CSS del panel
   */
  function injectStyles() {
    if (document.getElementById('a11y-audit-styles')) return;

    const styles = `
      /* Estilos para headings resaltados */
      .a11y-heading-invalid { outline: 3px solid #d32f2f; outline-offset: 2px; }
      .a11y-heading-warning { outline: 3px solid #f57c00; outline-offset: 2px; }
      .a11y-heading-valid { outline: 3px solid #388e3c; outline-offset: 2px; }
      
      /* Panel principal */
      #a11y-audit-panel {
        position: fixed;
        right: 0;
        top: 0;
        bottom: 0;
        width: 420px;
        max-width: 90vw;
        z-index: 999999;
        background: #ffffff;
        border-left: 4px solid #1976d2;
        box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif;
        font-size: 14px;
        line-height: 1.5;
        color: #212121;
      }

      .a11y-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-bottom: 1px solid #e0e0e0;
        background: #fafafa;
        flex-shrink: 0;
        gap: 8px;
      }

      .a11y-panel-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #1976d2;
        flex: 1;
      }

      .a11y-panel-close {
        background: transparent;
        border: 2px solid transparent;
        color: #666;
        font-size: 20px;
        width: 32px;
        height: 32px;
        padding: 4px;
        cursor: pointer;
        border-radius: 4px;
        flex-shrink: 0;
      }

      .a11y-panel-close:hover { background: #e8e8e8; }
      .a11y-panel-close:focus-visible { outline: 2px solid #1976d2; outline-offset: 2px; }

      .a11y-panel-content {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 16px;
        background: #ffffff;
      }

      .a11y-panel-footer {
        display: flex;
        gap: 8px;
        padding: 12px 16px;
        border-top: 1px solid #e0e0e0;
        background: #fafafa;
        flex-shrink: 0;
      }

      .a11y-panel-btn {
        flex: 1;
        padding: 10px 12px;
        border: 1px solid #bdbdbd;
        background: #ffffff;
        color: #212121;
        border-radius: 4px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
      }

      .a11y-panel-btn:hover:not(:disabled) { background: #f5f5f5; }
      .a11y-panel-btn:focus-visible { outline: 2px solid #1976d2; outline-offset: -2px; }
      .a11y-panel-btn:disabled { opacity: 0.5; cursor: not-allowed; }

      .a11y-result {
        display: flex;
        gap: 12px;
        padding: 12px;
        margin-bottom: 12px;
        border-radius: 4px;
        border-left: 4px solid;
        background: #f9f9f9;
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
      .a11y-result-element { background: #f0f0f0; padding: 4px 6px; border-radius: 3px; font-family: monospace; font-size: 12px; color: #d32f2f; margin: 0 !important; }
      .a11y-result-rec { background: rgba(25, 118, 210, 0.08); padding: 8px; border-radius: 3px; margin: 0 !important; font-size: 13px; color: #0d47a1; }
    `;

    const style = document.createElement('style');
    style.id = 'a11y-audit-styles';
    style.textContent = styles;
    document.head.appendChild(style);
  }

  /**
   * Analiza todos los headings de la página
   */
  function analyzeHeadings() {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const issues = [];
    const headingData = [];

    // Verificar si hay h1
    const h1s = headings.filter(h => h.tagName === 'H1');
    if (h1s.length === 0) {
      issues.push({
        type: 'missing_h1',
        severity: 'error',
        title: 'Falta H1 en la página',
        description: 'Toda página debe tener al menos un H1 que describa el tema principal.',
        recommendation: A11yAuditLib.getWcagRecommendation('missing_heading'),
        wcagCriteria: '1.3.1 Info and Relationships'
      });
    } else if (h1s.length > 1) {
      issues.push({
        type: 'multiple_h1',
        severity: 'warning',
        title: 'Múltiples H1 encontrados',
        description: `Se encontraron ${h1s.length} H1 en la página. Lo recomendado es solo 1.`,
        recommendation: 'Considera usar solo un H1 por página, generalmente el título principal.',
        wcagCriteria: '1.3.1 Info and Relationships'
      });
    }

    // Analizar estructura de headings
    let lastLevel = 0;
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName[1]);
      const text = heading.textContent.trim();
      const selector = A11yAuditLib.getElementSelector(heading);

      headingData.push({
        nivel: level,
        texto: text.substring(0, 100),
        selector: selector,
        visible: A11yAuditLib.isElementVisible(heading)
      });

      // Validar saltos de nivel
      if (lastLevel > 0 && level > lastLevel + 1) {
        issues.push({
          type: 'heading_skip',
          severity: 'warning',
          title: `Salto de nivel H${lastLevel} a H${level}`,
          element: selector,
          description: `Se detectó un salto de nivel de encabezado. Pasó de H${lastLevel} a H${level}.`,
          recommendation: A11yAuditLib.getWcagRecommendation('heading_skip'),
          wcagCriteria: '1.3.1 Info and Relationships'
        });
      }

      // Validar headings vacíos
      if (!text) {
        issues.push({
          type: 'empty_heading',
          severity: 'error',
          title: `H${level} vacío`,
          element: selector,
          description: 'Este encabezado no tiene contenido de texto.',
          recommendation: 'Añade texto descriptivo al encabezado o elimínalo si no es necesario.',
          wcagCriteria: '1.3.1 Info and Relationships'
        });
      }

      lastLevel = level;
    });

    // Si no hay saltos, agregar resultado exitoso
    if (issues.filter(i => i.type === 'heading_skip').length === 0 && headings.length > 0) {
      issues.unshift({
        type: 'heading_structure_ok',
        severity: 'success',
        title: '✓ Estructura de headings válida',
        description: 'La estructura jerárquica de encabezados es correcta (sin saltos de nivel).',
        wcagCriteria: '1.3.1 Info and Relationships'
      });
    }

    return {
      headings: headingData,
      issues: issues
    };
  }

  /**
   * Muestra resultados en el panel
   */
  function displayResults(panel, results) {
    // Resumen
    panel.addLine(`Total headings: ${results.headings.length}`, 'a11y-result-desc');
    panel.addLine(`Problemas encontrados: ${results.issues.length}`, 'a11y-result-desc');

    if (results.issues.length === 0) {
      panel.addLine('✓ Estructura correcta, no hay problemas detectados.', 'a11y-result-success');
      return;
    }

    // Problemas
    results.issues.forEach(issue => {
      panel.addResult(issue, issue.severity);
    });

    // Listar todos los headings
    if (results.headings.length > 0) {
      panel.addLine('', '');
      panel.addLine('📄 Headings encontrados:', 'a11y-result-title');
      results.headings.forEach(h => {
        panel.addLine(`H${h.nivel}: "${h.texto}"`, 'a11y-result-desc');
      });
    }

    // Resaltar headings con problemas
    results.issues.forEach(issue => {
      if (issue.element) {
        try {
          const el = document.querySelector(issue.element);
          if (el) {
            el.classList.add(issue.severity === 'error' ? 'a11y-heading-invalid' : 'a11y-heading-warning');
          }
        } catch (e) {
          // Selector no válido
        }
      }
    });
  }
})();
