/**
 * A11Y AUDITOR — Overlays
 * Coloca badges e indicadores visuales sobre los elementos de la página.
 */

var A11yOverlay = (function () {
  var badges = [];
  var highlights = [];
  var elementMap = [];
  var queue = []; // overlays pendientes hasta que el panel llame flush()
  var RUN_ATTR = 'data-a11y-bid';
  var runId = String(Date.now());

  var COLORS = {
    error:   { outline: '#ef4444' },
    warning: { outline: '#f97316' },
    pass:    { outline: '#22c55e' }
  };

  /**
   * Encola un overlay. Se aplica al DOM cuando el panel llame flush().
   */
  function add(index, element, type, label) {
    if (!element || !document.body.contains(element)) return;
    queue.push({ index: index, element: element, type: type, label: label });
  }

  /**
   * Aplica todos los overlays encolados. Llamado por A11yPanel.create() tras montar el panel.
   */
  function flush() {
    queue.forEach(function (item) {
      _apply(item.index, item.element, item.type, item.label);
    });
    queue = [];
  }

  function _apply(index, element, type, label) {
    var color = COLORS[type] || COLORS.pass;
    var origOutline = element.style.outline;
    var origOutlineOffset = element.style.outlineOffset;

    element.style.setProperty('outline', '1px solid ' + color.outline, 'important');
    element.style.setProperty('outline-offset', '2px', 'important');
    element.setAttribute(RUN_ATTR, runId);
    element.classList.add('a11y-overlay-highlight', type);
    highlights.push({ el: element, type: type, origOutline: origOutline, origOutlineOffset: origOutlineOffset });
    elementMap[index] = element;

    var badge = document.createElement('div');
    badge.className = 'a11y-overlay-badge ' + type;
    badge.textContent = label;
    badge.setAttribute('aria-hidden', 'true');
    badge.setAttribute(RUN_ATTR, runId);
    positionBadge(badge, element);
    document.body.appendChild(badge);
    badges.push(badge);

    var reposition = function () { positionBadge(badge, element); };
    window.addEventListener('scroll', reposition, { passive: true });
    window.addEventListener('resize', reposition, { passive: true });
  }

  /**
   * Limpia badges y outlines de runs anteriores que quedaron huérfanos.
   */
  function cleanupOldRuns() {
    document.querySelectorAll('[' + RUN_ATTR + ']').forEach(function (el) {
      if (el.getAttribute(RUN_ATTR) === runId) return;
      el.style.removeProperty('outline');
      el.style.removeProperty('outline-offset');
      if (el.getAttribute('style') === '') el.removeAttribute('style');
      el.classList.remove('a11y-overlay-highlight', 'error', 'warning', 'pass');
      if (el.getAttribute('class') === '') el.removeAttribute('class');
      el.removeAttribute(RUN_ATTR);
      el.remove(); // si es badge
    });
  }

  /**
   * Elimina todos los overlays del DOM directamente (robusto ante re-ejecuciones).
   */
  function clearAll() {
    // Limpiar badges directamente del DOM
    document.querySelectorAll('.a11y-overlay-badge').forEach(function (b) { b.remove(); });
    // Limpiar outlines directamente del DOM
    document.querySelectorAll('.a11y-overlay-highlight').forEach(function (el) {
      el.style.removeProperty('outline');
      el.style.removeProperty('outline-offset');
      // Eliminar atributos residuales vacíos para no contaminar el HTML reportado por axe
      if (el.getAttribute('style') === '') el.removeAttribute('style');
      el.classList.remove('a11y-overlay-highlight', 'a11y-overlay-hover', 'error', 'warning', 'pass');
      if (el.getAttribute('class') === '') el.removeAttribute('class');
      el.removeAttribute(RUN_ATTR);
    });
    badges = [];
    highlights = [];
    elementMap = [];
    // No limpiamos queue: contiene los overlays del scan actual pendientes de flush()
  }

  /**
   * Muestra u oculta todos los badges.
   */
  function toggle(visible) {
    badges.forEach(function (b) {
      b.style.display = visible ? '' : 'none';
    });
    highlights.forEach(function (h) {
      var color = COLORS[h.type] || COLORS.pass;
      if (visible) {
        h.el.style.setProperty('outline', '3px solid ' + color.outline, 'important');
        h.el.style.setProperty('outline-offset', '2px', 'important');
      } else {
        if (h.origOutline) {
          h.el.style.outline = h.origOutline;
        } else {
          h.el.style.removeProperty('outline');
        }
        if (h.origOutlineOffset) {
          h.el.style.outlineOffset = h.origOutlineOffset;
        } else {
          h.el.style.removeProperty('outline-offset');
        }
        if (h.el.getAttribute('style') === '') h.el.removeAttribute('style');
      }
    });
  }

  function highlight(index, active) {
    var el = elementMap[index];
    if (!el) return;
    if (active) { el.classList.add('a11y-overlay-hover'); }
    else { el.classList.remove('a11y-overlay-hover'); }
  }

  function scrollTo(index) {
    var el = elementMap[index];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    highlight(index, true);
    setTimeout(function () { highlight(index, false); }, 1500);
  }

  function positionBadge(badge, element) {
    var rect = element.getBoundingClientRect();
    var scrollX = window.scrollX || window.pageXOffset;
    var scrollY = window.scrollY || window.pageYOffset;
    badge.style.position = 'absolute';
    badge.style.top = (rect.top + scrollY) + 'px';
    badge.style.left = (rect.left + scrollX) + 'px';
  }

  return { add: add, flush: flush, clearAll: clearAll, cleanupOldRuns: cleanupOldRuns, toggle: toggle, highlight: highlight, scrollTo: scrollTo };
})();
