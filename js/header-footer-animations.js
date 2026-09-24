/* MAELIE — micro-interactions header/footer. */
(function () {
  'use strict';

  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('.site-header');
  const footer = document.querySelector('.site-footer');

  if (!reduce && header) {
    const links = header.querySelectorAll('.nav-links a');
    links.forEach((link, i) => {
      link.style.animation = `maelieNavIn .55s cubic-bezier(.22,.8,.2,1) ${0.18 + i * 0.07}s both`;
    });
  }

  if (!reduce && footer && 'IntersectionObserver' in window) {
    footer.classList.add('ma-footer-ready');
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        footer.classList.add('ma-footer-visible');
        obs.unobserve(footer);
      });
    }, { threshold: 0.12 });
    observer.observe(footer);
  }



  // Finition mobile : compacte le header après quelques pixels de défilement.
  const mobileHeader = document.querySelector('.site-header');
  const mobileQuery = window.matchMedia ? window.matchMedia('(max-width: 700px)') : null;
  if (mobileHeader && mobileQuery && mobileQuery.matches) {
    const updateMobileHeader = () => {
      mobileHeader.classList.toggle('is-mobile-scrolled', window.scrollY > 12);
    };
    updateMobileHeader();
    window.addEventListener('scroll', updateMobileHeader, { passive: true });
    mobileQuery.addEventListener?.('change', updateMobileHeader);
  }

  // Footer mobile : un seul panneau ouvert à la fois.
  const mobileFooter = document.querySelector('.footer-mobile-layout');
  if (!mobileFooter) return;

  const toggles = mobileFooter.querySelectorAll('.footer-mobile-toggle');
  toggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const panelId = toggle.getAttribute('aria-controls');
      const panel = panelId ? mobileFooter.querySelector('#' + CSS.escape(panelId)) : null;
      if (!panel) return;

      const willOpen = toggle.getAttribute('aria-expanded') !== 'true';

      toggles.forEach(other => {
        const otherId = other.getAttribute('aria-controls');
        const otherPanel = otherId ? mobileFooter.querySelector('#' + CSS.escape(otherId)) : null;
        other.setAttribute('aria-expanded', 'false');
        if (otherPanel) otherPanel.hidden = true;
      });

      toggle.setAttribute('aria-expanded', String(willOpen));
      panel.hidden = !willOpen;
    });
  });
})();
