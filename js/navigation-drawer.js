/* MAELIE — navigation mobile : drawer clair et compact */
(() => {
  "use strict";

  const init = () => {
    const button = document.querySelector("[data-menu]");
    const source = document.querySelector(".nav-links");
    if (!button || !source || document.querySelector(".ma-nav-drawer")) return;

    const overlay = document.createElement("div");
    overlay.className = "ma-drawer-overlay ma-nav-overlay";
    overlay.setAttribute("aria-hidden", "true");

    const drawer = document.createElement("aside");
    drawer.className = "ma-drawer ma-nav-drawer";
    drawer.setAttribute("aria-hidden", "true");
    drawer.setAttribute("aria-label", "Menu MAELIE");
    drawer.innerHTML = `
      <header class="ma-drawer-header ma-nav-header">
        <div class="ma-nav-topline">
          <div class="ma-drawer-brandline"><span>Maison MAELIE</span></div>
          <button type="button" class="ma-drawer-close ma-nav-close" data-nav-close aria-label="Fermer le menu">×</button>
        </div>
      </header>
      <div class="ma-drawer-content ma-nav-content">
        <div class="ma-nav-section-label">Explorer</div>
        <nav class="ma-nav-links" aria-label="Navigation principale"></nav>
        <div class="ma-nav-section-label ma-nav-section-label--account">Mon espace</div>
        <div class="ma-nav-account-links">
          <a href="compte.html"><span>Mon compte</span><span aria-hidden="true">›</span></a>
          <a href="commande.html"><span>Mes commandes</span><span aria-hidden="true">›</span></a>
          <a href="aide.html"><span>Aide &amp; FAQ</span><span aria-hidden="true">›</span></a>
          <a href="contact.html"><span>Contact</span><span aria-hidden="true">›</span></a>
        </div>
      </div>
      <footer class="ma-drawer-footer ma-nav-footer">
        <a class="ma-nav-footer-link" href="boutique.html">Découvrir la sélection <span>↗</span></a>
      </footer>`;

    const nav = drawer.querySelector(".ma-nav-links");

    const icon = (name) => {
      const icons = {
        home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3.5 10.5 8.5-7 8.5 7"></path><path d="M5.5 9.5V20h13V9.5"></path><path d="M9.5 20v-5h5v5"></path></svg>',
        spark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"></path></svg>',
        grid: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1"></rect><rect x="14" y="4" width="6" height="6" rx="1"></rect><rect x="4" y="14" width="6" height="6" rx="1"></rect><rect x="14" y="14" width="6" height="6" rx="1"></rect></svg>',
        collection: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v14H5z"></path><path d="M8 9h8M8 13h5"></path></svg>',
        dress: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4c.8 1.8 1.8 2.8 3 2.8S14.2 5.8 15 4"></path><path d="M9 6.5 6 10l2 2-1 7h10l-1-7 2-2-3-3.5"></path></svg>',
        jewelry: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 4 7 5-7 11L5 9l7-5Z"></path><path d="m5 9 7 2 7-2M12 11v9"></path></svg>',
        tag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5v6l9 9 7-7-9-9H5a1 1 0 0 0-1 1Z"></path><circle cx="8" cy="8" r="1"></circle></svg>'
      };
      return icons[name] || icons.grid;
    };

    const links = [
      ["Accueil", "index.html", "home"],
      ["Nouveautés", "boutique.html?filter=nouveautes", "spark"],
      ["Tous les produits", "boutique.html", "grid"],
      ["Collections", "collections.html", "collection"],
      ["Mode", "boutique.html?cat=Mode", "dress"],
      ["Bijoux", "boutique.html?cat=Bijoux", "jewelry"],
      ["Promotions", "boutique.html?filter=promotions", "tag"]
    ];

    links.forEach(([label, href, iconName]) => {
      const a = document.createElement("a");
      a.href = href;
      a.className = "ma-nav-link";
      a.innerHTML = `${icon(iconName)}<span class="ma-nav-link__label">${label}</span><span class="ma-nav-link__arrow" aria-hidden="true">›</span>`;
      nav.appendChild(a);
    });

    document.body.append(overlay, drawer);

    const focusable = () => Array.from(drawer.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((el) => el.offsetParent !== null);
    const syncActiveLinks = () => {
      const current = (location.pathname.split("/").pop() || "index.html").toLowerCase();
      drawer.querySelectorAll("a[href]").forEach((link) => {
        const href = link.getAttribute("href") || "";
        let active = false;
        try {
          const url = new URL(href, location.href);
          const target = (url.pathname.split("/").pop() || "index.html").toLowerCase();
          active = target === current;
          if (active && target === "boutique.html") {
            const targetParams = url.searchParams;
            const currentParams = new URLSearchParams(location.search);
            const keys = ["cat", "filter"];
            active = keys.every((key) => (targetParams.get(key) || "") === (currentParams.get(key) || ""));
          }
        } catch {}
        link.classList.toggle("is-current", active);
        if (active) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
    };
    syncActiveLinks();

    let lastFocus = null;
    let scrollY = 0;
    let touchStartX = 0;
    let touchStartY = 0;

    const lock = () => {
      scrollY = window.scrollY;
      document.body.style.top = `-${scrollY}px`;
      document.body.classList.add("ma-drawer-lock");
    };
    const unlock = () => {
      document.body.classList.remove("ma-drawer-lock");
      document.body.style.top = "";
      window.scrollTo(0, scrollY);
    };

    const setOpen = (open) => {
      if (open) {
        syncActiveLinks();
        window.dispatchEvent(new CustomEvent("maelie:drawer-before-open", { detail: "navigation" }));
        lastFocus = document.activeElement;
        lock();
        drawer.classList.add("is-open");
        overlay.classList.add("is-open");
        drawer.setAttribute("aria-hidden", "false");
        overlay.setAttribute("aria-hidden", "false");
        button.setAttribute("aria-expanded", "true");
        window.setTimeout(() => drawer.querySelector("[data-nav-close]")?.focus(), 150);
      } else {
        drawer.classList.remove("is-open");
        overlay.classList.remove("is-open");
        drawer.setAttribute("aria-hidden", "true");
        overlay.setAttribute("aria-hidden", "true");
        button.setAttribute("aria-expanded", "false");
        unlock();
        if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
      }
    };

    button.setAttribute("aria-expanded", "false");
    button.addEventListener("click", (event) => {
      event.preventDefault();
      setOpen(!drawer.classList.contains("is-open"));
    });

    overlay.addEventListener("click", () => setOpen(false));

    drawer.addEventListener("click", (event) => {
      if (event.target.closest("[data-nav-close]")) {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (event.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", (event) => {
      if (!drawer.classList.contains("is-open")) return;
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    drawer.addEventListener("touchstart", (event) => {
      const touch = event.changedTouches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    }, { passive: true });
    drawer.addEventListener("touchend", (event) => {
      const touch = event.changedTouches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;
      if (dx > 70 && Math.abs(dx) > Math.abs(dy) * 1.25) setOpen(false);
    }, { passive: true });

    window.addEventListener("maelie:drawer-before-open", (event) => {
      if (event.detail !== "navigation" && drawer.classList.contains("is-open")) setOpen(false);
    });

    window.MAELIE_NAV = { open: () => setOpen(true), close: () => setOpen(false) };
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
