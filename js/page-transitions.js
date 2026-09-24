/* MAELIE — transitions de pages
   Une transition courte et éditoriale, sans ralentir la navigation. */
(() => {
  "use strict";

  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  const body = document.body;
  if (!body) return;

  const veil = document.createElement("div");
  veil.className = "ma-page-transition";
  veil.setAttribute("aria-hidden", "true");
  veil.innerHTML = `
    <div class="ma-page-transition__petal ma-page-transition__petal--a"></div>
    <div class="ma-page-transition__petal ma-page-transition__petal--b"></div>
    <div class="ma-page-transition__mark" aria-hidden="true">M</div>
    <div class="ma-page-transition__word">MAELIE</div>
  `;
  body.appendChild(veil);

  const reveal = () => {
    root.classList.remove("ma-page-leaving");
    root.classList.add("ma-page-ready");
    window.setTimeout(() => root.classList.remove("ma-page-ready"), reduce ? 0 : 520);
  };

  // Entrée de page : très légère pour éviter l'effet "site qui charge".
  if (reduce) reveal();
  else requestAnimationFrame(() => requestAnimationFrame(reveal));

  const isLocalNavigation = (link) => {
    if (!link || link.target === "_blank" || link.hasAttribute("download")) return false;
    if (link.dataset.noTransition !== undefined) return false;
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return false;
    let url;
    try { url = new URL(href, location.href); } catch { return false; }
    return url.origin === location.origin && url.pathname !== location.pathname || (url.origin === location.origin && url.pathname === location.pathname && url.search !== location.search);
  };

  const closeDrawers = () => {
    window.MAELIE?.closeAccountDrawer?.();
    window.MAELIE?.closeCartDrawer?.();
    window.MAELIE_NAV?.close?.();
    document.querySelector("[data-shop-filter-close]")?.click();
  };

  document.addEventListener("click", (event) => {
    const drawerTrigger = event.target.closest("[data-cart-open], [data-account-open], [data-menu], [data-shop-filter-open], [data-nav-close], [data-cart-drawer-close], [data-account-close], [data-shop-filter-close]");
    if (drawerTrigger) return;
    const link = event.target.closest("a");
    const pageButton = event.target.closest("[data-page-nav]");
    if (!link && !pageButton) return;
    if (link && !isLocalNavigation(link) && !pageButton) return;
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const source = link || pageButton;
    if (source.closest(".ma-nav-drawer, .ma-account-drawer, .ma-cart-drawer")) closeDrawers();

    event.preventDefault();
    const href = link ? link.href : new URL(pageButton.dataset.pageNav, location.href).href;
    if (reduce) {
      location.href = href;
      return;
    }

    root.classList.add("ma-page-leaving");
    veil.classList.add("is-active");
    window.setTimeout(() => { location.href = href; }, 340);
  }, true);

  window.addEventListener("pageshow", () => {
    veil.classList.remove("is-active");
    reveal();
  });
})();
