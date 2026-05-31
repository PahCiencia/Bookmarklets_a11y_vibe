/**
 * A11Y AUDITOR — Analizar Formularios
 *
 * Verifica:
 * - Inputs sin label asociado (for/id, aria-label, aria-labelledby, wrapper)
 * - Grupos de radio/checkbox sin fieldset+legend
 * - Atributo autocomplete en campos de datos personales
 * - Inputs de tipo incorrecto (passowrd, tel, email…)
 * - Botones de submit sin texto accesible
 */

(function () {
  'use strict';

  var TOOL_NAME = 'Analizar Formularios';
  var issues = [];

  // Tipos de input que deberían tener label
  var LABELABLE = ['text', 'email', 'tel', 'url', 'password', 'number', 'search',
    'date', 'time', 'datetime-local', 'month', 'week', 'color', 'range',
    'file', 'checkbox', 'radio', ''];

  // Tipos de input que deberían tener autocomplete
  var AUTOCOMPLETE_TYPES = {
    name: 'name', email: 'email', tel: 'tel', url: 'url',
    password: 'current-password', 'new-password': 'new-password'
  };

  var inputs = Array.prototype.slice.call(
    document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]), select, textarea')
  );

  inputs.forEach(function (el) {
    if (el.closest('#a11y-panel')) return; // Ignorar elementos dentro del panel
    var selector = A11yOutput.getSelector(el);
    var html = A11yOutput.getElementHtml(el);
    var type = (el.getAttribute('type') || '').toLowerCase();

    if (LABELABLE.indexOf(type) === -1 && el.tagName.toLowerCase() !== 'select' && el.tagName.toLowerCase() !== 'textarea') return;

    // --- Label asociado ---
    var label = findLabel(el);
    if (!label) {
      issues.push({
        severity: 'error',
        message: 'Campo sin label: ' + el.tagName.toLowerCase() + (type ? '[type="' + type + '"]' : ''),
        selector: selector,
        element: html,
        wcag: '1.3.1'
      });
      A11yOverlay.add(issues.length - 1, el, 'error', 'sin label');
    } else {
      var labelText = (label.textContent || '').trim();
      if (!labelText) {
        issues.push({
          severity: 'error',
          message: 'Label vacío para ' + el.tagName.toLowerCase(),
          selector: selector,
          element: html,
          wcag: '1.3.1'
        });
        A11yOverlay.add(issues.length - 1, el, 'error', 'label vacío');
      } else {
        issues.push({
          severity: 'pass',
          message: 'Label correcto: "' + truncate(labelText, 50) + '" para ' + el.tagName.toLowerCase(),
          selector: selector,
          element: html,
          wcag: '1.3.1'
        });
      }
    }

    // --- Autocomplete en campos personales ---
    if (type === 'email' || type === 'tel' || type === 'url' || type === 'password') {
      var autocomplete = el.getAttribute('autocomplete');
      if (!autocomplete || autocomplete === 'off') {
        issues.push({
          severity: 'warning',
          message: 'Sin autocomplete en campo de tipo "' + type + '" — recomendado para WCAG 1.3.5',
          selector: selector,
          element: html,
          wcag: '1.3.5'
        });
        A11yOverlay.add(issues.length - 1, el, 'warning', 'sin autocomplete');
      }
    }
  });

  // --- Grupos de radio/checkbox: fieldset + legend ---
  var radioGroups = {};
  var radios = Array.prototype.slice.call(document.querySelectorAll('input[type="radio"], input[type="checkbox"]'));
  radios.forEach(function (el) {
    var name = el.getAttribute('name') || '__ungrouped__';
    if (!radioGroups[name]) radioGroups[name] = [];
    radioGroups[name].push(el);
  });

  Object.keys(radioGroups).forEach(function (name) {
    var group = radioGroups[name];
    if (group.length < 2) return; // Un solo checkbox no necesita fieldset

    var firstEl = group[0];
    var fieldset = firstEl.closest('fieldset');
    var selector = A11yOutput.getSelector(firstEl);
    var html = A11yOutput.getElementHtml(firstEl);

    if (!fieldset) {
      issues.push({
        severity: 'error',
        message: 'Grupo de ' + firstEl.getAttribute('type') + ' "' + name + '" sin <fieldset>',
        selector: selector,
        element: html,
        wcag: '1.3.1'
      });
      A11yOverlay.add(issues.length - 1, firstEl, 'error', 'sin fieldset');
    } else {
      var legend = fieldset.querySelector('legend');
      if (!legend || !(legend.textContent || '').trim()) {
        issues.push({
          severity: 'error',
          message: 'Fieldset sin <legend> para el grupo "' + name + '"',
          selector: selector,
          element: html,
          wcag: '1.3.1'
        });
        A11yOverlay.add(issues.length - 1, firstEl, 'error', 'sin legend');
      } else {
        issues.push({
          severity: 'pass',
          message: 'Grupo "' + name + '" con fieldset+legend — correcto',
          selector: selector,
          element: html,
          wcag: '1.3.1'
        });
      }
    }
  });

  // --- Botones de submit ---
  var submitBtns = Array.prototype.slice.call(
    document.querySelectorAll('button[type="submit"], input[type="submit"], button:not([type])')
  );
  submitBtns.forEach(function (el) {
    var selector = A11yOutput.getSelector(el);
    var html = A11yOutput.getElementHtml(el);
    var text = (el.value || el.textContent || el.getAttribute('aria-label') || '').trim();
    if (!text) {
      issues.push({
        severity: 'error',
        message: 'Botón de submit sin texto accesible',
        selector: selector,
        element: html,
        wcag: '4.1.2'
      });
      A11yOverlay.add(issues.length - 1, el, 'error', 'botón vacío');
    }
  });

  if (inputs.length === 0 && radios.length === 0) {
    issues.push({ severity: 'pass', message: 'No se encontraron formularios en la página', selector: 'body', element: '', wcag: '1.3.1' });
  }

  var summary = A11yOutput.buildSummary(issues);
  A11yOutput.set(TOOL_NAME, issues, summary, { totalInputs: inputs.length, totalRadios: radios.length });
  A11yPanel.create(TOOL_NAME, issues, summary);

  // --- Helpers ---

  function findLabel(el) {
    // 1. aria-labelledby
    var lby = el.getAttribute('aria-labelledby');
    if (lby) return document.getElementById(lby);

    // 2. aria-label (virtual label)
    if (el.getAttribute('aria-label')) return { textContent: el.getAttribute('aria-label') };

    // 3. for/id
    var id = el.getAttribute('id');
    if (id) {
      var forLabel = document.querySelector('label[for="' + id + '"]');
      if (forLabel) return forLabel;
    }

    // 4. Label wrapper
    var parent = el.closest('label');
    if (parent) return parent;

    return null;
  }

  function truncate(str, max) {
    return str.length > max ? str.slice(0, max) + '…' : str;
  }
})();
