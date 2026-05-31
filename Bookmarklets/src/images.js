/**
 * Bookmarklet: Analizar Imágenes
 * Detecta imágenes y valida presencia/calidad de texto alt
 */

(function() {
  'use strict';

  A11yAuditLib.onReady(() => {
    // Inyectar estilos CSS si no están
    injectStyles();

    // Crear panel
    const panel = A11yAuditLib.createPanel('🖼️ Análisis de Imágenes');

    // Ejecutar análisis
    const results = analyzeImages();

    // Mostrar resultados
    displayResults(panel, results);

    // Exportar JSON
    panel.enableJsonButtons({
      analisis: 'imagenes',
      timestamp: new Date().toISOString(),
      urlPagina: window.location.href,
      resumen: {
        totalImagenes: results.imagenes.length,
        problemasEncontrados: results.issues.length,
        imagenesValidas: results.imagenes.filter(i => !results.issues.find(p => p.elemento === i.selector)).length
      },
      imagenes: results.imagenes,
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
      .a11y-image-invalid { outline: 3px solid #d32f2f; outline-offset: 2px; }
      .a11y-image-warning { outline: 3px solid #f57c00; outline-offset: 2px; }
      .a11y-image-valid { outline: 3px solid #388e3c; outline-offset: 2px; }
    `;
  }

  /**
   * Analiza todas las imágenes
   */
  function analyzeImages() {
    const images = Array.from(document.querySelectorAll('img'));
    const issues = [];
    const imageData = [];

    images.forEach((img, index) => {
      const selector = A11yAuditLib.getElementSelector(img);
      const alt = img.getAttribute('alt');
      const src = img.getAttribute('src') || '';
      const hasAlt = img.hasAttribute('alt');
      const isVisible = A11yAuditLib.isElementVisible(img);

      const imgInfo = {
        numero: index + 1,
        src: src.substring(0, 50),
        alt: alt || '(sin alt)',
        selector: selector,
        visible: isVisible,
        altPresente: hasAlt
      };

      imageData.push(imgInfo);

      // Validar si es imagen decorativa o informativa
      if (!hasAlt) {
        issues.push({
          type: 'missing_alt',
          severity: 'error',
          title: 'Imagen sin atributo alt',
          element: selector,
          description: `Imagen ${index + 1}: No tiene atributo alt.`,
          recommendation: A11yAuditLib.getWcagRecommendation('missing_alt'),
          wcagCriteria: '1.1.1 Non-text Content'
        });
      } else if (alt === '') {
        // Alt vacío = decorativa, es válido
        imgInfo.validacion = 'decorativa';
      } else if (isGenericAlt(alt)) {
        issues.push({
          type: 'generic_alt',
          severity: 'warning',
          title: 'Texto alt genérico',
          element: selector,
          description: `Alt genérico: "${alt}". Debería ser más descriptivo.`,
          recommendation: A11yAuditLib.getWcagRecommendation('generic_alt'),
          wcagCriteria: '1.1.1 Non-text Content'
        });
        imgInfo.validacion = 'generico';
      } else if (isFilenameAlt(alt)) {
        issues.push({
          type: 'filename_alt',
          severity: 'warning',
          title: 'Alt es nombre de archivo',
          element: selector,
          description: `Alt parece ser el nombre de archivo: "${alt}". Debería describir el contenido.`,
          recommendation: 'Describe qué se ve en la imagen, no el nombre del archivo.',
          wcagCriteria: '1.1.1 Non-text Content'
        });
        imgInfo.validacion = 'nombrearchivo';
      } else {
        imgInfo.validacion = 'correcto';
      }
    });

    // Si no hay problemas, agregar resultado exitoso
    if (issues.length === 0 && images.length > 0) {
      issues.unshift({
        type: 'images_ok',
        severity: 'success',
        title: `✓ Todas las imágenes (${images.length}) tienen alt válido`,
        description: 'Los atributos alt están presentes y son descriptivos.',
        wcagCriteria: '1.1.1 Non-text Content'
      });
    }

    return {
      imagenes: imageData,
      issues: issues
    };
  }

  function isGenericAlt(alt) {
    const patterns = /^(imagen|photo|pic|image|picture|foto|imagen\d+)$/i;
    return patterns.test(alt);
  }

  function isFilenameAlt(alt) {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(alt) ||
           /^[a-z0-9_-]+\d+$/i.test(alt) ||
           /^img[_\-]?\d+$/i.test(alt);
  }

  /**
   * Muestra resultados
   */
  function displayResults(panel, results) {
    panel.addLine(`Total imágenes: ${results.imagenes.length}`, 'a11y-result-desc');
    panel.addLine(`Problemas: ${results.issues.length}`, 'a11y-result-desc');

    if (results.issues.length === 0) {
      panel.addLine('✓ Todas las imágenes están bien configuradas.', 'a11y-result-success');
    } else {
      results.issues.forEach(issue => {
        panel.addResult(issue, issue.severity);
      });
    }

    // Listar imágenes
    if (results.imagenes.length > 0) {
      panel.addLine('', '');
      panel.addLine('📸 Imágenes encontradas:', 'a11y-result-title');
      results.imagenes.forEach(img => {
        const status = {
          'correcto': '✓',
          'decorativa': '✓ (decorativa)',
          'generico': '⚠️',
          'nombrearchivo': '⚠️'
        }[img.validacion] || '?';
        panel.addLine(`${status} Img ${img.numero}: alt="${img.alt}"`, 'a11y-result-desc');
      });
    }

    // Resaltar imágenes problemáticas
    results.issues.forEach(issue => {
      if (issue.element && issue.type !== 'images_ok') {
        try {
          const el = document.querySelector(issue.element);
          if (el) {
            el.classList.add(issue.severity === 'error' ? 'a11y-image-invalid' : 'a11y-image-warning');
          }
        } catch (e) {}
      }
    });
  }
})();
