/**
 * Bookmarklet: Analizar Formularios
 * Valida labels asociadas correctamente a inputs
 */

(function() {
  'use strict';

  A11yAuditLib.onReady(() => {
    injectStyles();
    const panel = A11yAuditLib.createPanel('📋 Análisis de Formularios');
    const results = analyzeFormAccessibility();
    displayResults(panel, results);

    panel.enableJsonButtons({
      analisis: 'formularios',
      timestamp: new Date().toISOString(),
      urlPagina: window.location.href,
      resumen: {
        formulariosEncontrados: results.formularios.length,
        camposAnalizados: results.campos.length,
        problemasEncontrados: results.issues.length
      },
      campos: results.campos,
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
      .a11y-field-invalid { outline: 3px solid #d32f2f; outline-offset: 2px; }
    `;
  }

  /**
   * Analiza accesibilidad de formularios
   */
  function analyzeFormAccessibility() {
    const forms = Array.from(document.querySelectorAll('form'));
    const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
    const issues = [];
    const campos = [];

    inputs.forEach((input, index) => {
      const selector = A11yAuditLib.getElementSelector(input);
      const inputId = input.getAttribute('id');
      const inputName = input.getAttribute('name');
      const inputType = input.getAttribute('type') || 'text';
      const placeholder = input.getAttribute('placeholder') || '';

      // Buscar label asociada
      let labelText = '';
      let tieneLabel = false;

      if (inputId) {
        const labelElement = document.querySelector(`label[for="${inputId}"]`);
        if (labelElement) {
          labelText = labelElement.textContent.trim();
          tieneLabel = true;
        }
      }

      // También verificar aria-label
      const ariaLabel = input.getAttribute('aria-label');
      if (ariaLabel) {
        tieneLabel = true;
        labelText = labelText || ariaLabel;
      }

      const fieldInfo = {
        numero: index + 1,
        selector: selector,
        tipo: inputType,
        nombre: inputName || '(sin name)',
        labelAsociada: tieneLabel,
        labelTexto: labelText || '(sin label)',
        placeholder: placeholder,
        ariaNombre: ariaLabel || null
      };

      campos.push(fieldInfo);

      // Validaciones
      if (!tieneLabel && !placeholder) {
        issues.push({
          type: 'missing_label',
          severity: 'error',
          title: `Input ${index + 1}: Sin label ni placeholder`,
          element: selector,
          description: `Campo ${inputType}: No tiene label asociada ni placeholder descriptivo.`,
          recommendation: A11yAuditLib.getWcagRecommendation('missing_label'),
          wcagCriteria: '1.3.1 Info and Relationships'
        });
      } else if (!tieneLabel && placeholder) {
        issues.push({
          type: 'placeholder_only',
          severity: 'warning',
          title: `Input ${index + 1}: Solo placeholder, sin label`,
          element: selector,
          description: `Campo ${inputType}: Solo tiene placeholder. Debería tener una <label> visible.`,
          recommendation: 'Añade una <label> visible. El placeholder desaparece cuando escribes.',
          wcagCriteria: '1.3.1 Info and Relationships'
        });
      }

      if (inputId && inputId.startsWith('input') || inputId.startsWith('field') || inputId.match(/^\d+$/)) {
        issues.push({
          type: 'generic_id',
          severity: 'info',
          title: `Input ${index + 1}: ID genérico`,
          element: selector,
          description: `Campo tiene ID genérico: "${inputId}". Usa IDs más descriptivos.`,
          recommendation: 'Usa IDs como: email-input, password-field, etc.',
          wcagCriteria: '1.3.1 Info and Relationships'
        });
      }
    });

    // Verificar fieldsets
    const fieldsets = document.querySelectorAll('fieldset');
    fieldsets.forEach((fs, index) => {
      const legend = fs.querySelector('legend');
      if (!legend) {
        issues.push({
          type: 'missing_legend',
          severity: 'warning',
          title: `Fieldset ${index + 1}: Sin <legend>`,
          description: 'Los fieldsets deben tener un elemento <legend> que describa el grupo.',
          recommendation: 'Añade un <legend> al inicio del <fieldset>.',
          wcagCriteria: '1.3.1 Info and Relationships'
        });
      }
    });

    // Resultado exitoso si todo está bien
    if (issues.length === 0 && campos.length > 0) {
      issues.unshift({
        type: 'forms_ok',
        severity: 'success',
        title: `✓ Todos los campos (${campos.length}) están bien etiquetados`,
        description: 'Las labels están asociadas correctamente a los inputs.',
        wcagCriteria: '1.3.1 Info and Relationships'
      });
    }

    return {
      formularios: forms,
      campos: campos,
      issues: issues
    };
  }

  /**
   * Muestra resultados
   */
  function displayResults(panel, results) {
    panel.addLine(`Formularios: ${results.formularios.length}`, 'a11y-result-desc');
    panel.addLine(`Campos analizados: ${results.campos.length}`, 'a11y-result-desc');
    panel.addLine(`Problemas: ${results.issues.length}`, 'a11y-result-desc');

    if (results.issues.length === 0) {
      panel.addLine('✓ Todos los campos están accesibles.', 'a11y-result-success');
    } else {
      results.issues.forEach(issue => {
        panel.addResult(issue, issue.severity);
      });
    }

    // Detalles de campos
    if (results.campos.length > 0) {
      panel.addLine('', '');
      panel.addLine('📝 Campos encontrados:', 'a11y-result-title');
      results.campos.forEach(campo => {
        const labelStatus = campo.labelAsociada ? '✓' : '❌';
        panel.addLine(
          `${labelStatus} ${campo.tipo.toUpperCase()}: ${campo.nombre} → "${campo.labelTexto.substring(0, 30)}"`,
          'a11y-result-desc'
        );
      });
    }

    // Resaltar campos problemáticos
    results.issues.forEach(issue => {
      if (issue.element && issue.type !== 'forms_ok') {
        try {
          const el = document.querySelector(issue.element);
          if (el) el.classList.add('a11y-field-invalid');
        } catch (e) {}
      }
    });
  }
})();
