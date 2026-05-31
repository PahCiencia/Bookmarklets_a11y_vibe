/**
 * Bookmarklet: Analizar Estructura Semántica HTML
 * Valida uso de elementos semánticos: nav, main, section, article, etc.
 */

(function() {
  'use strict';

  A11yAuditLib.onReady(() => {
    injectStyles();
    const panel = A11yAuditLib.createPanel('🏗️ Análisis Semántico HTML');
    const results = analyzeSemanticsStructure();
    displayResults(panel, results);

    panel.enableJsonButtons({
      analisis: 'semantica-html',
      timestamp: new Date().toISOString(),
      urlPagina: window.location.href,
      resumen: {
        tienenLangAttribute: results.tienenLang,
        elementosSemanticsEncontrados: results.elementosSemanticsUsados.length,
        problemasEncontrados: results.issues.length
      },
      elementosEncontrados: results.elementosSemanticsUsados,
      estructura: results.estructura,
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
    `;
  }

  /**
   * Analiza estructura semántica
   */
  function analyzeSemanticsStructure() {
    const issues = [];
    const elementosSemanticsUsados = [];
    const estructura = {};

    // Verificar lang attribute
    const htmlElement = document.documentElement;
    const tienenLang = htmlElement.hasAttribute('lang');

    if (!tienenLang) {
      issues.push({
        type: 'missing_lang',
        severity: 'error',
        title: 'Falta atributo lang en <html>',
        element: '<html>',
        description: 'El elemento <html> debe tener un atributo lang que indique el idioma de la página.',
        recommendation: 'Añade lang="es" (o el idioma correspondiente) al elemento <html>',
        wcagCriteria: '3.1.1 Language of Page'
      });
    }

    // Elementos semánticos a buscar
    const semanticElements = ['header', 'nav', 'main', 'section', 'article', 'aside', 'footer'];

    semanticElements.forEach(tag => {
      const elements = document.querySelectorAll(tag);
      if (elements.length > 0) {
        elementosSemanticsUsados.push({
          elemento: tag,
          cantidad: elements.length
        });
        estructura[tag] = elements.length;
      }
    });

    // Verificar si hay al menos un <main>
    const mainElements = document.querySelectorAll('main');
    if (mainElements.length === 0) {
      issues.push({
        type: 'missing_main',
        severity: 'warning',
        title: 'Falta elemento <main>',
        description: 'No hay elemento <main> en la página. Debería haber exactamente uno.',
        recommendation: 'Envuelve el contenido principal de la página en un elemento <main>.',
        wcagCriteria: '1.3.1 Info and Relationships'
      });
    } else if (mainElements.length > 1) {
      issues.push({
        type: 'multiple_main',
        severity: 'error',
        title: `${mainElements.length} elementos <main> encontrados`,
        description: 'Solo debe haber un elemento <main> por página.',
        recommendation: 'Usa solo un <main> para el contenido principal.',
        wcagCriteria: '1.3.1 Info and Relationships'
      });
    } else {
      // main existe y es único - bien
    }

    // Verificar si hay navegación
    const navElements = document.querySelectorAll('nav');
    if (navElements.length === 0) {
      issues.push({
        type: 'missing_nav',
        severity: 'warning',
        title: 'No hay elemento <nav>',
        description: 'No se encontró un elemento <nav> para la navegación.',
        recommendation: 'Si hay un menú de navegación, envuélvelo en un elemento <nav>.',
        wcagCriteria: '1.3.1 Info and Relationships'
      });
    }

    // Verificar si hay footer
    const footerElements = document.querySelectorAll('footer');
    if (footerElements.length === 0) {
      issues.push({
        type: 'missing_footer',
        severity: 'info',
        title: 'No hay elemento <footer>',
        description: 'No se encontró un elemento <footer>.',
        recommendation: 'Si hay contenido de pie de página, considera usar <footer>.',
        wcagCriteria: '1.3.1 Info and Relationships'
      });
    }

    // Verificar divitis (abuso de divs)
    const allDivs = document.querySelectorAll('div');
    const allSemanticElements = document.querySelectorAll('header, nav, main, section, article, aside, footer');

    if (allDivs.length > allSemanticElements.length * 3) {
      issues.push({
        type: 'divitis',
        severity: 'warning',
        title: 'Exceso de elementos <div>',
        description: `Hay ${allDivs.length} divs vs ${allSemanticElements.length} elementos semánticos. Considera usar más elementos semánticos.`,
        recommendation: A11yAuditLib.getWcagRecommendation('missing_semantic'),
        wcagCriteria: '1.3.1 Info and Relationships'
      });
    }

    // Si hay elementos semánticos y no hay problemas, mostrar éxito
    if (issues.length === 0 && elementosSemanticsUsados.length > 3) {
      issues.unshift({
        type: 'semantics_ok',
        severity: 'success',
        title: '✓ Estructura semántica correcta',
        description: `Se encontraron elementos semánticos: ${elementosSemanticsUsados.map(e => `<${e.elemento}>`).join(', ')}`,
        wcagCriteria: '1.3.1 Info and Relationships'
      });
    }

    return {
      tienenLang,
      elementosSemanticsUsados,
      estructura,
      issues
    };
  }

  /**
   * Muestra resultados
   */
  function displayResults(panel, results) {
    panel.addLine(`Idioma detectado: ${results.tienenLang ? 'Sí' : 'No'}`, 'a11y-result-desc');
    panel.addLine(`Elementos semánticos: ${results.elementosSemanticsUsados.length}`, 'a11y-result-desc');
    panel.addLine(`Problemas: ${results.issues.length}`, 'a11y-result-desc');

    if (results.issues.length === 0) {
      panel.addLine('✓ Estructura semántica es sólida.', 'a11y-result-success');
    } else {
      results.issues.forEach(issue => {
        panel.addResult(issue, issue.severity);
      });
    }

    // Mostrar elementos semánticos encontrados
    if (results.elementosSemanticsUsados.length > 0) {
      panel.addLine('', '');
      panel.addLine('✓ Elementos semánticos encontrados:', 'a11y-result-title');
      results.elementosSemanticsUsados.forEach(el => {
        panel.addLine(`  <${el.elemento}> (${el.cantidad})`, 'a11y-result-desc');
      });
    }

    // Mostrar estructura esperada
    panel.addLine('', '');
    panel.addLine('📋 Estructura recomendada:', 'a11y-result-title');
    panel.addLine('<html lang="es">', 'a11y-result-desc');
    panel.addLine('  <header>...logo, navegación...</header>', 'a11y-result-desc');
    panel.addLine('  <nav>...enlaces principales...</nav>', 'a11y-result-desc');
    panel.addLine('  <main>...contenido principal...</main>', 'a11y-result-desc');
    panel.addLine('  <footer>...contacto, enlaces...</footer>', 'a11y-result-desc');
  }
})();
