/**
 * Librería compartida para bookmarklets de auditoría de accesibilidad
 * Proporciona: panel flotante, exportación JSON, utilidades DOM, recomendaciones WCAG
 */

const A11yAuditLib = (() => {
  // ============================================================================
  // PANEL FLOTANTE - Interfaz de usuario accesible
  // ============================================================================

  /**
   * Crea un panel flotante accesible para mostrar resultados
   * @param {string} title - Título del análisis
   * @returns {Object} - Objeto con métodos para controlar el panel
   */
  function createPanel(title) {
    // Remover panel existente si hay
    const existing = document.getElementById('a11y-audit-panel');
    if (existing) existing.remove();

    // Crear contenedor principal (role="complementary" para panel auxiliar)
    const panel = document.createElement('aside');
    panel.id = 'a11y-audit-panel';
    panel.className = 'a11y-panel';
    panel.setAttribute('role', 'complementary');
    panel.setAttribute('aria-label', `Panel de auditoría: ${title}`);

    // Header con título y botón cerrar
    const header = document.createElement('div');
    header.className = 'a11y-panel-header';
    header.setAttribute('role', 'banner');

    const titleEl = document.createElement('h2');
    titleEl.className = 'a11y-panel-title';
    titleEl.textContent = title;
    titleEl.id = 'a11y-panel-title';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'a11y-panel-close';
    closeBtn.setAttribute('aria-label', 'Cerrar panel de auditoría');
    closeBtn.innerHTML = '✕';
    closeBtn.addEventListener('click', () => {
      panel.remove();
      console.log('[A11y Audit] Panel cerrado');
    });

    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    // Contenedor de contenido (con scroll)
    const content = document.createElement('div');
    content.className = 'a11y-panel-content';
    content.setAttribute('role', 'region');
    content.setAttribute('aria-live', 'polite');
    content.setAttribute('aria-labelledby', 'a11y-panel-title');

    // Footer con botones de acción
    const footer = document.createElement('div');
    footer.className = 'a11y-panel-footer';
    footer.setAttribute('role', 'toolbar');
    footer.setAttribute('aria-label', 'Acciones del panel');

    const copyBtn = document.createElement('button');
    copyBtn.className = 'a11y-panel-btn a11y-panel-btn-copy';
    copyBtn.setAttribute('aria-label', 'Copiar resultados en JSON al portapapeles');
    copyBtn.textContent = '📋 Copiar JSON';
    copyBtn.disabled = true;
    copyBtn.id = 'a11y-copy-btn';

    const consoleBtn = document.createElement('button');
    consoleBtn.className = 'a11y-panel-btn a11y-panel-btn-console';
    consoleBtn.setAttribute('aria-label', 'Ver resultados JSON en consola del navegador (F12)');
    consoleBtn.textContent = '🖥️ Ver en consola';
    consoleBtn.disabled = true;
    consoleBtn.id = 'a11y-console-btn';

    footer.appendChild(consoleBtn);
    footer.appendChild(copyBtn);

    // Armar panel completo
    panel.appendChild(header);
    panel.appendChild(content);
    panel.appendChild(footer);

    document.body.appendChild(panel);

    return {
      panel,
      content,
      copyBtn,
      consoleBtn,
      setContent(html) {
        content.innerHTML = html;
      },
      addLine(text, className = '') {
        const line = document.createElement('p');
        if (className) line.className = className;
        line.textContent = text;
        content.appendChild(line);
      },
      addResult(result, level = 'info') {
        const item = document.createElement('div');
        item.className = `a11y-result a11y-result-${level}`;
        
        const levelEmoji = {
          error: '❌',
          warning: '⚠️',
          success: '✅',
          info: 'ℹ️'
        }[level] || 'ℹ️';

        item.innerHTML = `
          <div class="a11y-result-level">${levelEmoji}</div>
          <div class="a11y-result-body">
            <p class="a11y-result-title">${result.title || 'Sin título'}</p>
            ${result.description ? `<p class="a11y-result-desc">${result.description}</p>` : ''}
            ${result.element ? `<p class="a11y-result-element"><code>${escapeHtml(result.element)}</code></p>` : ''}
            ${result.recommendation ? `<p class="a11y-result-rec"><strong>Recomendación:</strong> ${result.recommendation}</p>` : ''}
          </div>
        `;
        
        content.appendChild(item);
      },
      enableJsonButtons(jsonData) {
        const jsonStr = JSON.stringify(jsonData, null, 2);
        
        copyBtn.disabled = false;
        consoleBtn.disabled = false;

        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(jsonStr).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✓ Copiado';
            setTimeout(() => {
              copyBtn.textContent = originalText;
            }, 2000);
          }).catch(err => {
            console.error('[A11y Audit] Error al copiar:', err);
            alert('No se pudo copiar al portapapeles');
          });
        });

        consoleBtn.addEventListener('click', () => {
          console.log('[A11y Audit] Resultados JSON:', jsonData);
          const originalText = consoleBtn.textContent;
          consoleBtn.textContent = '✓ Mostrado en consola';
          setTimeout(() => {
            consoleBtn.textContent = originalText;
          }, 2000);
        });

        // También mostrar en consola automáticamente
        console.log('[A11y Audit] Resultados JSON:', jsonData);
      },
      highlight(element, color = '#ffeb3b', opacity = 0.3) {
        if (!element) return;
        element.style.outline = `3px solid ${color}`;
        element.style.backgroundColor = adjustOpacity(color, opacity);
      },
      unhighlight(element) {
        if (!element) return;
        element.style.outline = '';
        element.style.backgroundColor = '';
      }
    };
  }

  // ============================================================================
  // UTILIDADES DOM
  // ============================================================================

  /**
   * Obtiene selector CSS único para un elemento
   */
  function getElementSelector(element) {
    if (element.id) return `#${element.id}`;
    
    let path = [];
    while (element.parentElement) {
      let selector = element.tagName.toLowerCase();
      if (element.id) {
        selector += `#${element.id}`;
        path.unshift(selector);
        break;
      } else {
        const siblings = element.parentElement.querySelectorAll(selector);
        if (siblings.length > 1) {
          const index = Array.from(siblings).indexOf(element) + 1;
          selector += `:nth-of-type(${index})`;
        }
        path.unshift(selector);
      }
      element = element.parentElement;
    }
    
    return path.join(' > ');
  }

  /**
   * Obtiene coordenadas visuales de un elemento
   */
  function getElementPosition(element) {
    const rect = element.getBoundingClientRect();
    return {
      top: Math.round(rect.top),
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    };
  }

  /**
   * Escapa caracteres HTML para mostrar de forma segura
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Obtiene el texto legible de un elemento
   */
  function getAccessibleName(element) {
    // 1. aria-label
    if (element.hasAttribute('aria-label')) {
      return element.getAttribute('aria-label').trim();
    }

    // 2. aria-labelledby
    if (element.hasAttribute('aria-labelledby')) {
      const ids = element.getAttribute('aria-labelledby').split(' ');
      return ids
        .map(id => document.getElementById(id)?.textContent?.trim())
        .filter(Boolean)
        .join(' ');
    }

    // 3. label asociada (para inputs)
    if (element.id && element.tagName === 'INPUT') {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) return label.textContent.trim();
    }

    // 4. Texto visible directo
    if (element.textContent) {
      const text = element.textContent.trim();
      if (text) return text.substring(0, 100); // Limitar a 100 caracteres
    }

    // 5. placeholder
    if (element.hasAttribute('placeholder')) {
      return element.getAttribute('placeholder').trim();
    }

    return '(Sin nombre accesible)';
  }

  /**
   * Obtiene el color computado
   */
  function getComputedColor(element, property = 'color') {
    return window.getComputedStyle(element)[property];
  }

  // ============================================================================
  // CÁLCULO DE CONTRASTE
  // ============================================================================

  /**
   * Convierte color RGB a valores individuales
   */
  function parseRgb(rgbString) {
    const match = rgbString.match(/\d+/g);
    if (!match || match.length < 3) return null;
    return {
      r: parseInt(match[0]),
      g: parseInt(match[1]),
      b: parseInt(match[2])
    };
  }

  /**
   * Calcula luminancia relativa según WCAG
   * https://www.w3.org/TR/WCAG20/#relativeluminancedef
   */
  function getLuminance(rgb) {
    if (!rgb) return null;
    
    let r = rgb.r / 255;
    let g = rgb.g / 255;
    let b = rgb.b / 255;

    r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Calcula ratio de contraste entre dos colores
   */
  function getContrastRatio(color1, color2) {
    const rgb1 = parseRgb(color1);
    const rgb2 = parseRgb(color2);
    
    if (!rgb1 || !rgb2) return null;

    const l1 = getLuminance(rgb1);
    const l2 = getLuminance(rgb2);

    if (l1 === null || l2 === null) return null;

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return ((lighter + 0.05) / (darker + 0.05)).toFixed(2);
  }

  /**
   * Determina si contraste cumple WCAG AA/AAA
   */
  function checkContrastCompliance(ratio, isLargeText = false) {
    const ratioNum = parseFloat(ratio);
    
    return {
      AA: isLargeText ? ratioNum >= 3 : ratioNum >= 4.5,
      AAA: isLargeText ? ratioNum >= 4.5 : ratioNum >= 7,
      ratio: ratioNum
    };
  }

  /**
   * Obtiene tamaño de fuente y determina si es "large text"
   */
  function isLargeText(element) {
    const fontSize = parseInt(window.getComputedStyle(element).fontSize);
    const fontWeight = window.getComputedStyle(element).fontWeight;
    
    // 24px regular o 18.66px bold (18px * 1.03666)
    const isBold = parseInt(fontWeight) >= 700;
    const threshold = isBold ? 18.66 : 24;
    
    return fontSize >= threshold;
  }

  // ============================================================================
  // RECOMENDACIONES WCAG
  // ============================================================================

  /**
   * Retorna recomendaciones de arreglo basadas en el tipo de problema
   */
  function getWcagRecommendation(issueType) {
    const recommendations = {
      missing_alt: 'Añade un atributo alt descriptivo a la imagen. Para imágenes decorativas, usa alt="".',
      empty_alt: 'El alt está vacío. Describe el contenido/función de la imagen.',
      generic_alt: 'El alt es genérico (ej: "imagen", "foto"). Describe específicamente qué se ve o qué hace.',
      missing_heading: 'Añade un encabezado (h1-h6) en la página para estructura clara.',
      heading_skip: 'No saltes niveles de encabezado. Después de h1, usa h2; después de h2, usa h3, etc.',
      low_contrast: 'Aumenta el contraste entre texto y fondo. Usa colores más claros/oscuros o fuentes más grandes.',
      missing_label: 'Asocia un <label> con este input usando: <label for="id">Texto</label>',
      invalid_label_for: 'El atributo for de la label no coincide con ningún input. Verifica los IDs.',
      missing_semantic: 'Usa elementos semánticos como <nav>, <main>, <section>, <article> en lugar de solo divs.',
      no_lang_attribute: 'Añade lang="es" al elemento <html> para indicar el idioma de la página.',
      inaccessible_form: 'Los campos de formulario necesitan labels visibles y asociadas correctamente.',
      icon_only: 'Si este elemento solo contiene un icono, añade aria-label con el nombre de la acción.'
    };

    return recommendations[issueType] || 'Revisa esta sección según WCAG 2.2.';
  }

  // ============================================================================
  // UTILIDADES AUXILIARES
  // ============================================================================

  /**
   * Ajusta opacidad de un color hex/rgb
   */
  function adjustOpacity(color, opacity) {
    const rgb = parseRgb(color);
    if (!rgb) return color;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
  }

  /**
   * Genera un ID único
   */
  function generateId(prefix = 'a11y') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Comprueba si un elemento es visible en pantalla
   */
  function isElementVisible(element) {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      rect.width > 0 &&
      rect.height > 0
    );
  }

  /**
   * Espera a que el DOM esté listo
   */
  function onReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  // ============================================================================
  // EXPORTAR API PÚBLICA
  // ============================================================================

  return {
    createPanel,
    getElementSelector,
    getElementPosition,
    escapeHtml,
    getAccessibleName,
    getComputedColor,
    parseRgb,
    getLuminance,
    getContrastRatio,
    checkContrastCompliance,
    isLargeText,
    getWcagRecommendation,
    adjustOpacity,
    generateId,
    isElementVisible,
    onReady
  };
})();

// ============================================================================
// HACER LIBRERÍA DISPONIBLE GLOBALMENTE
// ============================================================================
window.A11yAuditLib = A11yAuditLib;

console.log('[A11y Audit Lib] Cargada correctamente. Disponible como window.A11yAuditLib');
