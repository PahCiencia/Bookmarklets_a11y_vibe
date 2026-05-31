/**
 * Bookmarklet: Analizar Contraste
 * Detecta elementos con contraste insuficiente según WCAG
 */

(function() {
  'use strict';

  A11yAuditLib.onReady(() => {
    injectStyles();
    const panel = A11yAuditLib.createPanel('🎨 Análisis de Contraste');
    const results = analyzeContrast();
    displayResults(panel, results);

    panel.enableJsonButtons({
      analisis: 'contraste',
      timestamp: new Date().toISOString(),
      urlPagina: window.location.href,
      resumen: {
        elementosAnalizados: results.elementos.length,
        problemasEncontrados: results.issues.length,
        elementosValidos: results.elementos.filter(e => !results.issues.find(p => p.elemento === e.selector)).length
      },
      elementos: results.elementos,
      problemas: results.issues
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
      .a11y-contrast-invalid { outline: 3px solid #d32f2f; outline-offset: 2px; }
    `;
  }

  /**
   * Analiza contraste de todos los elementos de texto
   */
  function analyzeContrast() {
    const elements = getAllTextElements();
    const issues = [];
    const elementData = [];

    elements.forEach((el, index) => {
      if (!A11yAuditLib.isElementVisible(el)) return;

      const textColor = A11yAuditLib.getComputedColor(el, 'color');
      const bgColor = A11yAuditLib.getComputedColor(el, 'backgroundColor');
      const isLargeText = A11yAuditLib.isLargeText(el);
      const ratio = A11yAuditLib.getContrastRatio(textColor, bgColor);

      if (!ratio) return; // No se pudo calcular

      const compliance = A11yAuditLib.checkContrastCompliance(ratio, isLargeText);
      const selector = A11yAuditLib.getElementSelector(el);
      const text = el.textContent.trim().substring(0, 50);

      const elInfo = {
        numero: index + 1,
        selector: selector,
        tipo: el.tagName.toLowerCase(),
        texto: text,
        ratio: parseFloat(ratio),
        textoGrande: isLargeText,
        wcagAA: compliance.AA,
        wcagAAA: compliance.AAA,
        colorTexto: textColor,
        colorFondo: bgColor
      };

      elementData.push(elInfo);

      // Validar contraste
      if (!compliance.AA) {
        issues.push({
          type: 'low_contrast',
          severity: 'error',
          title: `Contraste insuficiente: ${ratio}:1`,
          element: selector,
          description: `Elemento ${el.tagName.toLowerCase()}: "${text}". Ratio ${ratio}:1. Requiere mínimo ${isLargeText ? '3' : '4.5'}:1 (WCAG AA).`,
          recommendation: A11yAuditLib.getWcagRecommendation('low_contrast'),
          wcagCriteria: '1.4.3 Contrast (Minimum)'
        });
      }
    });

    // Resultado exitoso si no hay problemas
    if (issues.length === 0 && elementData.length > 0) {
      issues.unshift({
        type: 'contrast_ok',
        severity: 'success',
        title: `✓ Todos los elementos (${elementData.length}) cumplen WCAG AA`,
        description: 'El contraste de texto y elementos es suficiente.',
        wcagCriteria: '1.4.3 Contrast (Minimum)'
      });
    }

    return {
      elementos: elementData,
      issues: issues
    };
  }

  /**
   * Obtiene todos los elementos que contienen texto
   */
  function getAllTextElements() {
    const textElements = [];
    const selector = 'p, h1, h2, h3, h4, h5, h6, span, a, button, label, input, textarea';

    document.querySelectorAll(selector).forEach(el => {
      if (el.textContent.trim().length > 0) {
        textElements.push(el);
      }
    });

    return textElements;
  }

  /**
   * Muestra resultados
   */
  function displayResults(panel, results) {
    panel.addLine(`Elementos analizados: ${results.elementos.length}`, 'a11y-result-desc');
    panel.addLine(`Problemas de contraste: ${results.issues.length}`, 'a11y-result-desc');

    if (results.issues.length === 0) {
      panel.addLine('✓ Contraste adecuado en todos los elementos.', 'a11y-result-success');
    } else {
      results.issues.forEach(issue => {
        panel.addResult(issue, issue.severity);
      });
    }

    // Mostrar muestra de elementos analizados
    if (results.elementos.length > 0) {
      panel.addLine('', '');
      panel.addLine('📊 Primeros 5 elementos analizados:', 'a11y-result-title');
      results.elementos.slice(0, 5).forEach(el => {
        const status = el.wcagAA ? '✓' : '❌';
        panel.addLine(`${status} ${el.tipo.toUpperCase()}: ${el.ratio}:1 - "${el.texto}"`, 'a11y-result-desc');
      });
    }

    // Resaltar elementos con problemas
    results.issues.forEach(issue => {
      if (issue.element && issue.type !== 'contrast_ok') {
        try {
          const el = document.querySelector(issue.element);
          if (el) el.classList.add('a11y-contrast-invalid');
        } catch (e) {}
      }
    });
  }
})();
