
/* =========================================================
   MAELIE V2 — progressive enhancement layer
   ========================================================= */
(() => {
  "use strict";

  document.documentElement.classList.add("maelie-v2");
  document.body?.classList.add("maelie-v2");

  const $all = (selector, root = document) => [...root.querySelectorAll(selector)];

  /* Reveal sections/cards as they enter the viewport. */
  const revealTargets = $all(
    "main > section, main > article, .product-card, .card, [class*='product-card'], .section-title, .section-heading"
  );

  revealTargets.forEach((el, i) => {
    if (el.classList.contains("maelie-reveal")) return;
    el.classList.add("maelie-reveal");
    if (i < 8) el.style.setProperty("--maelie-delay", `${Math.min(i * 45, 220)}ms`);
  });

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -7% 0px" });

    revealTargets.forEach(el => io.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add("is-visible"));
  }

  /* Add subtle section title line where appropriate. */
  $all(".section-title, .section-heading, h2").forEach(el => {
    if (!el.classList.contains("maelie-line-reveal")) {
      el.classList.add("maelie-line-reveal");
    }
  });

  /* Image fade-in after load. */
  $all("img").forEach(img => {
    img.classList.add("maelie-loading");
    const done = () => {
      img.classList.remove("maelie-loading");
      img.classList.add("maelie-loaded");
    };
    if (img.complete) done();
    else img.addEventListener("load", done, { once: true });
  });

  /* Favoris: animate the clicked control without changing existing behavior. */
  document.addEventListener("click", e => {
    const favorite = e.target.closest(
      "[data-favorite], [data-fav], .favorite, .wishlist, .fav-btn"
    );
    if (favorite) {
      favorite.classList.remove("maelie-fav-pop");
      void favorite.offsetWidth;
      favorite.classList.add("maelie-fav-pop");
    }
  });

  /* Cart counter: pulse after common cart interactions. */
  document.addEventListener("click", e => {
    const add = e.target.closest(
      "[data-add-to-cart], [data-cart-add], .add-to-cart, .btn-cart, [data-action='add-cart']"
    );
    if (!add) return;
    setTimeout(() => {
      const counters = $all(
        "[data-cart-count], .cart-count, .cart-badge, [class*='cart-count']"
      );
      counters.forEach(counter => {
        counter.classList.remove("maelie-cart-pulse");
        void counter.offsetWidth;
        counter.classList.add("maelie-cart-pulse");
      });
    }, 80);
  });

  /* Tiny parallax for explicitly marked hero ornaments, respecting reduced motion. */
  const orbs = $all(".maelie-orb");
  if (orbs.length && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let raf = 0;
    window.addEventListener("pointermove", e => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - .5);
        const y = (e.clientY / window.innerHeight - .5);
        orbs.forEach((orb, i) => {
          const factor = i ? 7 : 5;
          orb.style.transform = `translate3d(${x * factor}px, ${y * factor}px, 0)`;
        });
      });
    }, { passive: true });
  }
})();
