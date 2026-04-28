/* Heidi product tabs — Scribe / Comms / Evidence.
 * Hash-synced: /heidi.html#evidence opens that panel.
 * Arrow-key navigation per WAI-ARIA tab pattern.
 *
 * Panel IDs are prefixed (panel-scribe, panel-comms, panel-evidence) so the
 * browser never finds a matching anchor to scroll to on hash navigation.
 * Hash ↔ tab mapping is handled via data-hash on each tab button.
 */
(function () {
  const tablists = document.querySelectorAll('[role="tablist"]');
  if (!tablists.length) return;

  tablists.forEach((tablist) => {
    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
    const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));

    const activate = (i, focus = false, writeHash = true) => {
      tabs.forEach((tab, idx) => {
        const isActive = idx === i;
        tab.setAttribute('aria-selected', String(isActive));
        tab.tabIndex = isActive ? 0 : -1;
        if (panels[idx]) panels[idx].classList.toggle('is-active', isActive);
      });
      if (focus) tabs[i].focus();
      if (writeHash && history.replaceState) {
        const hash = tabs[i].dataset.hash;
        if (hash) history.replaceState(null, '', '#' + hash);
      }
    };

    // Click
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        activate(i, false, true);
      });
    });

    // Keyboard (arrow keys + Home/End)
    tablist.addEventListener('keydown', (e) => {
      const current = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
      let next = current;
      if (e.key === 'ArrowRight') next = (current + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      else return;
      e.preventDefault();
      activate(next, true, true);
    });

    // Initial selection from URL hash (via data-hash), fallback to first tab.
    // Do NOT write hash on load — the hash is already in the URL if present,
    // and panel IDs don't match hash values so the browser won't anchor-scroll.
    const hash = (location.hash || '').replace(/^#/, '');
    const idx = tabs.findIndex((t) => t.dataset.hash === hash);
    activate(idx >= 0 ? idx : 0, false, false);
  });

  // Respond to in-page hash changes (e.g. browser back/forward)
  window.addEventListener('hashchange', () => {
    const hash = (location.hash || '').replace(/^#/, '');
    if (!hash) return;
    const tab = document.querySelector(`[role="tab"][data-hash="${hash}"]`);
    if (tab) {
      const i = Array.from(tab.parentElement.querySelectorAll('[role="tab"]')).indexOf(tab);
      if (i >= 0) tab.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
  });
})();
