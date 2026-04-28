/* Scroll-reveal: fades elements in as they enter the viewport.
 *
 * No translateY — elements are always at their final position, so there
 * is never a layout jump on first paint (including incognito). Only
 * opacity changes, making a missed JS frame invisible to the user.
 *
 * The `reveals-off` class on <html> (set by an inline script in each
 * page <head> for repeat visits within the same session) skips all
 * animation so same-session navigation is instant.
 */
(function () {
  const root = document.documentElement;
  if (root.classList.contains('reveals-off')) {
    document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('is-revealed'));
    return;
  }

  const items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-revealed'));
    return;
  }

  // Elements already in the viewport on load: reveal instantly (no fade).
  const vh = window.innerHeight;
  items.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < vh * 0.95) {
      el.classList.add('reveal-instant', 'is-revealed');
      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.classList.remove('reveal-instant');
      }));
    }
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const delay = entry.target.dataset.revealDelay || 0;
      setTimeout(() => entry.target.classList.add('is-revealed'), Number(delay));
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px 30% 0px', threshold: 0.01 });

  items.forEach((el) => {
    if (!el.classList.contains('is-revealed')) io.observe(el);
  });

  // Safety net: reveal anything still hidden after 600ms.
  setTimeout(() => items.forEach((el) => el.classList.add('is-revealed')), 600);
})();
