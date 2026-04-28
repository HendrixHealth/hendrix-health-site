/* Sticky-header shadow + mobile sheet toggle.
 * No dependencies. Loaded with `defer`.
 */
(function () {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.site-header__toggle');
  const sheet  = document.querySelector('.mobile-sheet');
  const body   = document.body;

  // Sticky header — flip class once user scrolls past hero
  if (header) {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        header.classList.toggle('is-scrolled', window.scrollY > 8);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Mobile sheet
  if (toggle && sheet) {
    const setExpanded = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      sheet.classList.toggle('is-open', open);
      body.classList.toggle('is-locked', open);
      if (open) {
        const firstLink = sheet.querySelector('a, button');
        if (firstLink) firstLink.focus();
      } else {
        toggle.focus();
      }
    };

    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      setExpanded(open);
    });

    // Close on link click (assume in-page navigation)
    sheet.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setExpanded(false));
    });

    // ESC closes
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sheet.classList.contains('is-open')) {
        setExpanded(false);
      }
    });

    // Close on resize to desktop
    const mql = window.matchMedia('(min-width: 1024px)');
    mql.addEventListener('change', (ev) => {
      if (ev.matches && sheet.classList.contains('is-open')) setExpanded(false);
    });
  }
})();
