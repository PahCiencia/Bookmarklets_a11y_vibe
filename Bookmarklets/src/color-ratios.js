/**
 * Bookmarklet: Analizar Ratios de Color WCAG
 * Análisis detallado de ratios de color con tabla comparativa
 */

(function() {
  'use strict';

  A11yAuditLib.onReady(() => {
    injectStyles();
    const panel = A11yAuditLib.createPanel('🎨 Análisis Detallado Ratios WCAG');
    const results = analyzeColorRatios();
    displayResults(panel, results);

    panel.enableJsonButtons({
      analisis: 'ratios-color-wcag',
      timestamp: new Date().toISOString(),
      urlPagina: window.location.href,
      resumen: {
        elementosAnalizados: results.elementos.length,
        cumplenAA: results.elementos.filter(e => e.wcagAA).length,
        cumplenAAA: results.elementos.filter(e => e.wcagAAA).length,
        fallan: results.elementos.filter(e => !e.wcagAA).length
      },
      elementosPorRatio: results.ratios,
      problematicos: results.elementosProblematicos,
      criteriosWCAG: {
        AA_texto_normal: '4.5:1',
        AA_texto_grande: '3:1',
        AAA_texto_normal: '7:1',
        AAA_texto_grande: '4.5:1'
      }
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
      .a11y-ratio-table { font-size: 12px; margin-top: 8px; }
      .a11y-ratio-row { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 4px; border-bottom: 1px solid #e0e0e0; }
      .a11y-ratio-label { font-weight: 500; }
      .a11y-color-swatch {
        display: inline-block; width: 12px; height: 12px; border-radius: 2px;
        border: 1px solid #999; margin-right: 4px; vertical-align: middle;
      }
    `;
  }

  /**
   * Analiza ratios de color en detalle
   */
  function analyzeColorRatios() {
    const elements = getAllVisibleTextElements();
    const elementos = [];
    const ratios = {};
    const elementosProblematicos = [];

    elements.forEach((el, index) => {
      const textColor = A11yAuditLib.getComputedColor(el, 'color');
      const bgColor = A11yAuditLib.getComputedColor(el, 'backgroundColor');
      const isLargeText = A11yAuditLib.isLargeText(el);
      const ratio = A11yAuditLib.getContrastRatio(textColor, bgColor);

      if (!ratio) return;

      const compliance = A11yAuditLib.checkContrastCompliance(ratio, isLargeText);
      const selector = A11yAuditLib.getElementSelector(el);
      const text = el.textContent.trim().substring(0, 40);

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
        colorFondo: bgColor,
        requisito: isLargeText ? 'AA: 3:1, AAA: 4.5:1' : 'AA: 4.5:1, AAA: 7:1'
      };

      elementos.push(elInfo);

      // Agrupar por ratio
      const ratioKey = ratio;
      if (!ratios[ratioKey]) {
        ratios[ratioKey] = [];
      }
      ratios[ratioKey].push(elInfo);

      // Registrar problemas
      if (!compliance.AA) {
        elementosProblematicos.push({
          selector: selector,
          ratio: parseFloat(ratio),
          requisito: isLargeText ? 3 : 4.5,
          tipo: el.tagName.toLowerCase(),
          texto: text
        });
      }
    });

    // Ordenar ratios
    const ratiosOrdenados = Object.keys(ratios)
      .sort((a, b) => parseFloat(b) - parseFloat(a))
      .reduce((obj, key) => {
        obj[key] = ratios[key];
        return obj;
      }, {});

    return {
      elementos: elementos.sort((a, b) => b.ratio - a.ratio),
      ratios: ratiosOrdenados,
      elementosProblematicos: elementosProblematicos
    };
  }

  /**
   * Obtiene todos los elementos de texto visibles
   */
  function getAllVisibleTextElements() {
    const textElements = [];
    const selector = 'p, h1, h2, h3, h4, h5, h6, span, a, button, label, li, td, th, div';

    document.querySelectorAll(selector).forEach(el => {
      if (A11yAuditLib.isElementVisible(el) && el.textContent.trim().length > 0) {
        textElements.push(el);
      }
    });

    return textElements;
  }

  /**
   * Muestra resultados
   */
  function displayResults(panel, results) {
    const { elementos, ratios, elementosProblematicos } = results;

    // Estadísticas
    const cumplenAA = elementos.filter(e => e.wcagAA).length;
    const cumplenAAA = elementos.filter(e => e.wcagAAA).length;

    panel.addLine(`Elementos analizados: ${elementos.length}`, 'a11y-result-desc');
    panel.addLine(`✓ Cumplen WCAG AA: ${cumplenAA}`, 'a11y-result-desc');
    panel.addLine(`✓ Cumplen WCAG AAA: ${cumplenAAA}`, 'a11y-result-desc');
    panel.addLine(`❌ Fallan: ${elementosProblematicos.length}`, 'a11y-result-desc');

    // Tabla de ratios únicos
    panel.addLine('', '');
    panel.addLine('📊 Ratios encontrados:', 'a11y-result-title');

    Object.keys(ratios).slice(0, 8).forEach(ratioKey => {
      const count = ratios[ratioKey].length;
      const ratio = parseFloat(ratioKey);
      let status = '❌';
      
      if (ratio >= 7) status = '✓✓ AAA';
      else if (ratio >= 4.5) status = '✓ AA';
      else if (ratio >= 3) status = '⚠️ Large';
      
      panel.addLine(`${status} ${ratio}:1 (${count} elementos)`, 'a11y-result-desc');
    });

    // Elementos problemáticos
    if (elementosProblematicos.length > 0) {
      panel.addLine('', '');
      panel.addLine('❌ Elementos que fallan WCAG AA:', 'a11y-result-title');
      elementosProblematicos.slice(0, 5).forEach(el => {
        panel.addLine(
          `${el.tipo.toUpperCase()}: ${el.ratio}:1 (necesita ${el.requisito}:1)`,
          'a11y-result-desc'
        );
      });

      if (elementosProblematicos.length > 5) {
        panel.addLine(`... y ${elementosProblematicos.length - 5} más`, 'a11y-result-desc');
      }
    } else {
      panel.addLine('✓ Todos los elementos cumplen WCAG AA', 'a11y-result-success');
    }

    // Referencia WCAG
    panel.addLine('', '');
    panel.addLine('📋 Estándares WCAG 2.2:', 'a11y-result-title');
    panel.addLine('Texto normal: AA 4.5:1, AAA 7:1', 'a11y-result-desc');
    panel.addLine('Texto grande (24px+): AA 3:1, AAA 4.5:1', 'a11y-result-desc');
    panel.addLine('UI componentes: AA 3:1', 'a11y-result-desc');
  }
})();
