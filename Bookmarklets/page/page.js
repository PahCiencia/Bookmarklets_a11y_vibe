/**
 * A11Y Auditor — Página: renderiza las tarjetas de bookmarklets
 * Consume window.A11Y_BOOKMARKLETS generado por build.js
 */

(function () {
  'use strict';

  var grid = document.getElementById('tools-grid');
  var fallback = document.getElementById('fallback-msg');

  if (!window.A11Y_BOOKMARKLETS || window.A11Y_BOOKMARKLETS.length === 0) {
    if (grid) grid.innerHTML = '';
    if (fallback) fallback.hidden = false;
    return;
  }

  var html = '';
  window.A11Y_BOOKMARKLETS.forEach(function (tool) {
    var label = escapeHtml(tool.label);
    var copyAriaLabel = 'Copiar código del bookmarklet: ' + label;
    var svgCopy =
      '<svg aria-hidden="true" focusable="false" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
        '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>' +
        '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>' +
      '</svg>';

    html +=
      '<article class="tool-card" role="listitem">' +
        '<div class="card-header">' +
          '<div class="card-icon" aria-hidden="true">' + escapeHtml(tool.icon || '◈') + '</div>' +
          '<h3 class="card-title">' + label + '</h3>' +
          '<button class="copy-btn" ' +
            'data-url="' + tool.url + '" ' +
            'data-original-label="' + copyAriaLabel + '" ' +
            'aria-label="' + copyAriaLabel + '" ' +
            'data-tooltip="Copiar código">' +
            svgCopy +
          '</button>' +
        '</div>' +
        '<p class="card-description">' + escapeHtml(tool.description) + '</p>' +
        '<a href="' + tool.url + '" class="bookmarklet-link" ' +
           'draggable="true" ' +
           'title="Arrastra este enlace a tu barra de favoritos para instalar: ' + escapeHtml(tool.label) + '" ' +
           'aria-label="Instalar bookmarklet: ' + escapeHtml(tool.label) + ' (arrastra a favoritos)">' +
          '<span class="link-drag-icon" aria-hidden="true">⊕</span>' +
          escapeHtml(tool.label) +
        '</a>' +
        '<span class="drag-hint" aria-hidden="true">← arrastra a favoritos</span>' +
      '</article>';
  });

  grid.innerHTML = html;

  grid.addEventListener('click', function (e) {
    var btn = e.target.closest('.copy-btn');
    if (!btn) return;
    copyToClipboard(btn.getAttribute('data-url'), btn);
  });

  function copyToClipboard(text, btn) {
    var onSuccess = function () { showCopied(btn); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(onSuccess).catch(function () {});
    } else {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none;top:0;left:0;';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); onSuccess(); } catch (err) {}
      document.body.removeChild(ta);
    }
  }

  function showCopied(btn) {
    btn.setAttribute('data-tooltip', '¡Copiado!');
    btn.setAttribute('aria-label', '¡Copiado!');
    btn.classList.add('copy-btn--copied');
    setTimeout(function () {
      btn.setAttribute('data-tooltip', 'Copiar código');
      btn.setAttribute('aria-label', btn.getAttribute('data-original-label'));
      btn.classList.remove('copy-btn--copied');
    }, 2000);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();
