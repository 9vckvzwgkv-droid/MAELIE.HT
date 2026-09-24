(() => {
  const boot = () => {
  const grid = document.querySelector("[data-products]");
  if (!grid) return;
  const params = new URLSearchParams(location.search);
  const state = {
    q: params.get("q") || "",
    cat: params.get("cat") || "",
    sale: params.get("sale") === "1",
    newOnly: params.get("new") === "1",
    min: 0,
    max: Number.POSITIVE_INFINITY,
    priceRange: params.get("price") || "all",
    sort: params.get("sort") || "featured",
  };
  const $ = (selector) => document.querySelector(selector);
  const syncUrl = () => {
    const p = new URLSearchParams();
    if (state.q) p.set("q", state.q);
    if (state.cat) p.set("cat", state.cat);
    if (state.sale) p.set("sale", "1");
    if (state.newOnly) p.set("new", "1");
    if (state.priceRange !== "all") p.set("price", state.priceRange);
    if (state.sort !== "featured") p.set("sort", state.sort);
    history.replaceState({}, "", `boutique.html${p.toString() ? "?" + p : ""}`);
  };

  const filterBar = document.createElement("div");
  filterBar.className = "shop-active-filters";
  filterBar.setAttribute("aria-live", "polite");
  const toolbar = document.querySelector(".shop-toolbar");
  if (toolbar) toolbar.after(filterBar);

  const updateFilterSummary = () => {
    const labels = [];
    if (state.cat) labels.push(state.cat);
    if (state.sale) labels.push("Promotion");
    if (state.newOnly) labels.push("Nouveautés");
    const prices = {"under-30":"Moins de 30 €", "30-60":"30 à 60 €", "60-plus":"60 € et plus"};
    if (prices[state.priceRange]) labels.push(prices[state.priceRange]);
    const active = labels.length;
    const trigger = $("[data-shop-filter-open]");
    if (trigger) {
      const span = trigger.querySelector("span");
      if (span) span.textContent = active ? `Filtres (${active})` : "Filtres";
      trigger.setAttribute("aria-label", active ? `${active} filtre${active > 1 ? "s" : ""} actif${active > 1 ? "s" : ""}` : "Ouvrir les filtres");
    }
    filterBar.innerHTML = active
      ? labels.map(label => `<span class="shop-active-chip">${label}</span>`).join("") + `<button type="button" class="shop-reset-inline" data-reset>Réinitialiser</button>`
      : "";
    const reset = filterBar.querySelector(".shop-reset-inline");
    if (reset) reset.setAttribute("aria-label", "Réinitialiser les filtres");
  };
  const render = () => {
    let items = MAELIE_PRODUCTS.filter(
      (p) =>
        (!state.q ||
          MAELIE_MATCH(p, state.q)) &&
        (!state.cat || p.cat === state.cat) &&
        (!state.sale || p.old) &&
        (!state.newOnly || p.new) &&
        p.price >= state.min &&
        p.price <= state.max,
    );
    if (state.sort === "price-asc") items.sort((a, b) => a.price - b.price);
    if (state.sort === "price-desc") items.sort((a, b) => b.price - a.price);
    if (state.sort === "name")
      items.sort((a, b) => a.name.localeCompare(b.name, "fr"));
    if (state.sort === "rating") items.sort((a, b) => b.rating - a.rating);
    if (state.sort === "newest")
      items.sort((a, b) => Number(b.new) - Number(a.new));
    grid.innerHTML = items.length
      ? items.map(MAELIE.card).join("")
      : `<div class="empty shop-empty"><h2>Aucun résultat</h2><p class="muted">Essayez une autre recherche ou réinitialisez vos filtres.</p><button class="btn btn-soft" data-reset type="button">Réinitialiser</button></div>`;
    const count = $("[data-result-count]");
    if (count)
      count.textContent = `${items.length} article${items.length > 1 ? "s" : ""}`;
    updateFilterSummary();
    syncUrl();
  };
  const search = $("[data-shop-search]");
  if (search) {
    search.value = state.q;
    search.oninput = () => {
      state.q = search.value.trim();
      render();
    };
  }
  document.querySelectorAll("[data-cat]").forEach((el) => {
    el.checked = el.value === state.cat;
    el.onchange = () => {
      if (el.checked) state.cat = el.value;
      render();
    };
  });
  const sale = $("[data-sale]");
  if (sale)
    sale.onchange = () => {
      state.sale = sale.checked;
      render();
    };
  const newer = $("[data-new]");
  if (newer)
    newer.onchange = () => {
      state.newOnly = newer.checked;
      render();
    };
  const priceRanges = document.querySelectorAll("[data-price-range]");
  const priceRangeValue = $("[data-price-range-value]");
  const applyPriceRange = (value) => {
    state.priceRange = value || "all";
    if (state.priceRange === "under-30") { state.min = 0; state.max = 29.99; }
    else if (state.priceRange === "30-60") { state.min = 30; state.max = 60; }
    else if (state.priceRange === "60-plus") { state.min = 60; state.max = Number.POSITIVE_INFINITY; }
    else { state.min = 0; state.max = Number.POSITIVE_INFINITY; }
    priceRanges.forEach((button) => {
      const active = button.dataset.priceRange === state.priceRange;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    if (priceRangeValue) {
      priceRangeValue.textContent = {
        all: "Tout le catalogue, prenez le temps de choisir.",
        "under-30": "Petits prix · moins de 30 €",
        "30-60": "Entre 30 et 60 €",
        "60-plus": "À partir de 60 €"
      }[state.priceRange];
    }
    render();
  };
  priceRanges.forEach((button) => {
    button.addEventListener("click", () => applyPriceRange(button.dataset.priceRange));
  });
  applyPriceRange(state.priceRange);
  if (sale) sale.checked = state.sale;
  if (newer) newer.checked = state.newOnly;
  const sort = $("[data-sort]");
  if (sort) {
    sort.value = state.sort;
    if (![...sort.options].some(option => option.value === state.sort)) state.sort = "featured";
    sort.onchange = () => {
      state.sort = sort.value;
      render();
    };
  }
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-reset]")) {
      state.q = "";
      state.cat = "";
      state.sale = false;
      state.newOnly = false;
      state.min = 0;
      state.max = Number.POSITIVE_INFINITY;
      state.priceRange = "all";
      if (search) search.value = "";
      if (sale) sale.checked = false;
      if (newer) newer.checked = false;
      applyPriceRange("all");
      document
        .querySelectorAll("[data-cat]")
        .forEach((x) => (x.checked = x.value === ""));
      render();
    }
  });
  render();
  };
  (window.MAELIE_PRODUCTS_READY || Promise.resolve()).then(boot);
})();
