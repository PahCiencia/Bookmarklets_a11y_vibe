/**
 * Bookmarklet: Analizar Texto Alt (Análisis Profundo)
 * Evalúa calidad del texto alt en imágenes
 */

(function() {
  'use strict';

  A11yAuditLib.onReady(() => {
    injectStyles();
    const panel = A11yAuditLib.createPanel('📝 Análisis de Texto Alt');
    const results = analyzeAltText();
    displayResults(panel, results);

    panel.enableJsonButtons({
      analisis: 'texto-alt',
      timestamp: new Date().toISOString(),
      urlPagina: window.location.href,
      resumen: {
        totalImagenes: results.imagenes.length,
        problemasEncontrados: results.issues.length,
        calificacionPromedio: (results.imagenes.reduce((sum, img) => sum + img.puntuacion, 0) / results.imagenes.length).toFixed(1)
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
    `;
  }

  /**
   * Analiza la calidad del texto alt
   */
  function analyzeAltText() {
    const images = Array.from(document.querySelectorAll('img'));
    const issues = [];
    const imageData = [];

    images.forEach((img, index) => {
      const alt = img.getAttribute('alt') || '';
      const src = img.getAttribute('src') || '';
      const selector = A11yAuditLib.getElementSelector(img);

      // Evaluar puntuación del alt
      let puntuacion = 0;
      let problemas = [];

      if (!img.hasAttribute('alt')) {
        puntuacion = 0;
        problemas.push('falta-alt');
      } else if (alt === '') {
        puntuacion = 10; // Decorativa, válido pero sin puntuación
        problemas.push('decorativa');
      } else {
        // Evaluar calidad del alt
        if (alt.length < 5) {
          puntuacion -= 20;
          problemas.push('muy-corto');
        } else if (alt.length < 20) {
          puntuacion += 5;
        } else if (alt.length < 125) {
          puntuacion += 10;
        } else {
          puntuacion -= 10; // Muy largo
          problemas.push('muy-largo');
        }

        // Detectar patrones débiles
        if (/^(imagen|photo|pic|image|picture|foto)$/i.test(alt)) {
          puntuacion -= 10;
          problemas.push('generico');
        }

        if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(alt)) {
          puntuacion -= 15;
          problemas.push('nombre-archivo');
        }

        if (/^img[_\-]?\d+$/i.test(alt)) {
          puntuacion -= 15;
          problemas.push('nombre-auto');
        }

        if (/^image\s+\d+$/i.test(alt) || /^foto\s+\d+$/i.test(alt)) {
          puntuacion -= 15;
          problemas.push('numerado');
        }

        // Bonificación por palabras clave de calidad
        if (/describe|muestra|representa|contiene/i.test(alt)) {
          puntuacion += 5;
        }
      }

      puntuacion = Math.max(0, Math.min(100, puntuacion));

      const imgInfo = {
        numero: index + 1,
        src: src.substring(0, 40),
        alt: alt || '(vacío/decorativa)',
        selector: selector,
        puntuacion: puntuacion,
        problemas: problemas,
        calidad: puntuacion >= 80 ? 'excelente' : puntuacion >= 60 ? 'buena' : puntuacion >= 40 ? 'regular' : 'pobre'
      };

      imageData.push(imgInfo);

      // Agregar como issue si tiene problemas
      if (problemas.length > 0 && !problemas.includes('decorativa')) {
        const severity = puntuacion < 40 ? 'error' : 'warning';
        issues.push({
          type: 'poor_alt_quality',
          severity: severity,
          title: `Calidad de alt baja: ${puntuacion}/100`,
          element: selector,
          description: `Imagen ${index + 1}: "${alt.substring(0, 50)}"`,
          problemas: problemas.map(p => ({
            'falta-alt': 'Falta atributo alt',
            'muy-corto': 'Alt demasiado corto (menos de 5 caracteres)',
            'muy-largo': 'Alt demasiado largo (más de 125 caracteres)',
            'generico': 'Alt genérico (imagen, foto, etc)',
            'nombre-archivo': 'Alt es nombre de archivo',
            'nombre-auto': 'Alt generado automáticamente',
            'numerado': 'Alt solo tiene números'
          }[p] || p)).join(', '),
          recommendation: 'Describe qué contiene o representa la imagen. Usa 20-125 caracteres. Evita decir "imagen de" o nombres de archivo.',
          wcagCriteria: '1.1.1 Non-text Content'
        });
      }
    });

    return {
      imagenes: imageData,
      issues: issues
    };
  }

  /**
   * Muestra resultados
   */
  function displayResults(panel, results) {
    const totalImages = results.imagenes.length;
    const promedio = totalImages > 0 
      ? (results.imagenes.reduce((sum, img) => sum + img.puntuacion, 0) / totalImages).toFixed(1)
      : 0;

    panel.addLine(`Total imágenes: ${totalImages}`, 'a11y-result-desc');
    panel.addLine(`Puntuación promedio: ${promedio}/100`, 'a11y-result-desc');
    panel.addLine(`Problemas: ${results.issues.length}`, 'a11y-result-desc');

    if (results.issues.length === 0 && totalImages > 0) {
      panel.addLine('✓ Todos los alts tienen buena calidad.', 'a11y-result-success');
    } else if (results.issues.length > 0) {
      panel.addLine('', '');
      results.issues.forEach(issue => {
        panel.addResult(issue, issue.severity);
      });
    }

    // Detalles por imagen
    if (results.imagenes.length > 0) {
      panel.addLine('', '');
      panel.addLine('📸 Análisis detallado:', 'a11y-result-title');
      results.imagenes.forEach(img => {
        const emoji = {
          'excelente': '⭐',
          'buena': '✓',
          'regular': '⚠️',
          'pobre': '❌'
        }[img.calidad] || '?';
        
        panel.addLine(
          `${emoji} Img ${img.numero} (${img.puntuacion}/100): "${img.alt.substring(0, 40)}"`,
          'a11y-result-desc'
        );
      });
    }
  }
})();
