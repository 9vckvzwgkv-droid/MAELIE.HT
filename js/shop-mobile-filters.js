/* MAELIE — filtres latéraux boutique */
(() => {
  "use strict";
  const layout = document.querySelector(".shop-layout");
  const openButton = document.querySelector("[data-shop-filter-open]");
  const overlay = document.querySelector("[data-shop-filter-overlay]");
  const closeButton = document.querySelector("[data-shop-filter-close]");
  const filters = document.querySelector(".filters");
  if (!layout || !openButton || !overlay || !filters) return;

  filters.classList.add("ma-filter-drawer");
  if (!filters.querySelector(".ma-filter-intro")) {
    const intro = document.createElement("div");
    intro.className = "ma-filter-intro";
    intro.innerHTML = `
      <div class="ma-filter-intro__seal">✦</div>
      <div><span class="ma-drawer-eyebrow">La sélection MAELIE</span><h2>Choisir en douceur</h2><p>Quelques envies suffisent pour trouver la pièce qui vous ressemble.</p></div>`;
    filters.insertBefore(intro, filters.firstChild);
  }
  if (!filters.querySelector(".ma-filter-note")) {
    const note = document.createElement("div");
    note.className = "ma-float-note ma-float-note--filter";
    note.innerHTML = "<span>♡</span> Prenez le temps de choisir";
    filters.appendChild(note);
  }

  const isDrawerViewport = () => window.matchMedia("(max-width: 1024px)").matches;
  let scrollY = 0;

  const setOpen = (open) => {
    if (!isDrawerViewport()) open = false;
    if (open) {
      window.dispatchEvent(new CustomEvent("maelie:drawer-before-open", { detail: "filters" }));
      scrollY = window.scrollY;
      document.body.style.top = `-${scrollY}px`;
      document.body.classList.add("ma-drawer-lock");
    } else {
      document.body.classList.remove("ma-drawer-lock");
      document.body.style.top = "";
      if (layout.classList.contains("filter-drawer-open")) window.scrollTo(0, scrollY);
    }
    layout.classList.toggle("filter-drawer-open", open);
    openButton.setAttribute("aria-expanded", String(open));
    overlay.setAttribute("aria-hidden", String(!open));
  };

  openButton.addEventListener("click", () => setOpen(true));
  closeButton?.addEventListener("click", () => setOpen(false));
  overlay.addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") setOpen(false); });
  window.addEventListener("resize", () => { if (!isDrawerViewport()) setOpen(false); });
  filters.querySelectorAll("input").forEach((input) => input.addEventListener("change", () => { if (isDrawerViewport()) setOpen(false); }));
  filters.querySelectorAll("[data-price-range]").forEach((button) => button.addEventListener("click", () => { if (isDrawerViewport()) setOpen(false); }));

  window.addEventListener("maelie:drawer-before-open", (event) => {
    if (event.detail !== "filters" && layout.classList.contains("filter-drawer-open")) setOpen(false);
  });
})();
