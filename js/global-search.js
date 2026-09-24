(() => {
  "use strict";

  const init = () => {
    const input = document.querySelector("[data-global-search]");
    const aside = document.querySelector("[data-global-search-aside]");
    const overlay = document.querySelector("[data-global-search-overlay]");
    const results = document.querySelector("[data-global-search-results]");
    const mobileResults = document.querySelector("[data-global-search-mobile-results]");
    const clear = document.querySelector("[data-global-search-clear]");
    const current = document.querySelector("[data-global-search-current]");
    const queryLabel = document.querySelector("[data-global-search-query]");
    const header = document.querySelector(".site-header");

    if (mobileResults) {
      mobileResults.setAttribute("aria-hidden", "true");
      mobileResults.setAttribute("aria-live", "polite");
    }

    if (!input || !aside || !window.MAELIE_PRODUCTS) return;

    const isMobile = () => window.matchMedia("(max-width: 700px)").matches;
    const money = n => new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR"
    }).format(n);

    const escapeHtml = value => String(value).replace(/[&<>'"]/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    }[char]));

    const card = (p, mobile = false) => {
      if (mobile) {
        const rating = Number.isFinite(Number(p.rating)) ? Number(p.rating).toFixed(1) : null;
        const reviews = Number.isFinite(Number(p.reviews)) ? Number(p.reviews) : null;
        const stars = rating ? "★★★★★" : "";
        const badge = p.badge ? `<em class="global-result-mobile-badge">${escapeHtml(p.badge)}</em>` : "";
        const oldPrice = p.old ? `<del>${money(p.old)}</del>` : "";
        return `<a class="global-result global-result--mobile" href="product.html?slug=${encodeURIComponent(p.slug)}">
          <span class="global-result-mobile-media">
            <img src="${p.img}" alt="${escapeHtml(p.name)}" loading="lazy" decoding="async">
          </span>
          <span class="global-result-mobile-info">
            <small>${escapeHtml(p.cat)}</small>
            <strong>${escapeHtml(p.name)}</strong>
            ${rating ? `<span class="global-result-mobile-rating"><b>${rating}</b><i aria-hidden="true">${stars}</i>${reviews ? `<small>(${reviews})</small>` : ""}</span>` : ""}
            ${badge}
            <span class="global-result-mobile-price"><b>${money(p.price)}</b>${oldPrice}</span>
          </span>
        </a>`;
      }
      return `<a class="global-result" href="product.html?slug=${encodeURIComponent(p.slug)}">
        <img src="${p.img}" alt="${escapeHtml(p.name)}" loading="lazy" decoding="async">
        <span>
          <small>${escapeHtml(p.cat)}</small>
          <strong>${escapeHtml(p.name)}</strong>
          <b>${money(p.price)}</b>
        </span>
      </a>`;
    };

    const getItems = () => {
      const q = input.value.trim().toLowerCase();
      if (!q) return MAELIE_PRODUCTS.slice(0, 8);
      return MAELIE_PRODUCTS.filter(p => MAELIE_MATCH(p, q)).slice(0, 12);
    };

    // Recherche mobile volontairement stricte : uniquement le nom ou la catégorie.
    // Pas de description, pas de suggestion, pas de correction approximative.
    const getMobileItems = () => {
      const q = window.MAELIE_NORMALIZE(input.value);
      if (!q) return [];
      const tokens = q.split(/\s+/).filter(Boolean);
      return MAELIE_PRODUCTS.filter(p => {
        const hay = window.MAELIE_NORMALIZE(`${p.name} ${p.cat}`);
        return tokens.every(token => hay.includes(token));
      }).slice(0, 12);
    };

    const RECENT_SEARCHES_KEY = "maelie-search-history";
    const LEGACY_RECENT_SEARCHES_KEY = "maelie-mobile-search-history";
    const SEARCH_SUGGESTIONS = ["Robe", "Bijoux", "Sac", "Maison"];

    const getRecentSearches = () => {
      try {
        const current = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
        const legacy = JSON.parse(localStorage.getItem(LEGACY_RECENT_SEARCHES_KEY) || "[]");
        const merged = [
          ...(Array.isArray(current) ? current : []),
          ...(Array.isArray(legacy) ? legacy : [])
        ];
        const unique = merged.filter(Boolean).reduce((list, item) => {
          const normalized = String(item).trim().replace(/\s+/g, " ");
          if (!normalized || list.some(existing => existing.toLowerCase() === normalized.toLowerCase())) return list;
          list.push(normalized);
          return list;
        }, []);
        return unique.slice(0, 5);
      } catch (_) {
        return [];
      }
    };

    const saveRecentSearch = value => {
      const query = String(value || "").trim().replace(/\s+/g, " ");
      if (!query) return;
      try {
        const recent = [query, ...getRecentSearches().filter(item => item.toLowerCase() !== query.toLowerCase())].slice(0, 5);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent));
      } catch (_) {}
    };

    const getMobileShell = () => {
      if (!mobileResults) return null;
      let shell = mobileResults.querySelector(".global-search-mobile-shell");
      if (!shell) {
        mobileResults.innerHTML = `
          <div class="global-search-mobile-shell">
            <div class="global-search-mobile-grid" data-global-search-mobile-grid></div>
          </div>`;
        shell = mobileResults.querySelector(".global-search-mobile-shell");
      }
      return shell;
    };

    const renderMobileEmptyState = grid => {
      const recent = getRecentSearches();
      const recentHtml = recent.length
        ? `<section class="global-search-mobile-suggestions" aria-label="Recherches précédentes">
             <h3>Recherches précédentes</h3>
             <div class="global-search-mobile-chips">${recent.map(item => `<button type="button" class="global-search-mobile-chip" data-search-chip="${escapeHtml(item)}">${escapeHtml(item)}</button>`).join("")}</div>
           </section>`
        : "";
      const suggestionsHtml = `<section class="global-search-mobile-suggestions" aria-label="Suggestions de recherche">
        <h3>Suggestions</h3>
        <div class="global-search-mobile-chips">${SEARCH_SUGGESTIONS.map(item => `<button type="button" class="global-search-mobile-chip" data-search-chip="${escapeHtml(item)}">${escapeHtml(item)}</button>`).join("")}</div>
      </section>`;
      grid.innerHTML = `<div class="global-search-mobile-empty-state">${recentHtml}${suggestionsHtml}</div>`;

      grid.querySelectorAll("[data-search-chip]").forEach(button => {
        button.addEventListener("click", () => {
          input.value = button.getAttribute("data-search-chip") || "";
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.focus({ preventScroll: true });
        });
      });
    };

    const updateMobileTop = () => {
      if (!mobileResults || !header || !isMobile()) return;
      const top = Math.max(0, Math.ceil(header.getBoundingClientRect().bottom));
      mobileResults.style.setProperty("--mobile-search-top", `${top}px`);
    };

    const renderMobile = () => {
      const shell = getMobileShell();
      if (!shell) return;
      const q = input.value.trim();
      const items = getMobileItems();
      const grid = shell.querySelector("[data-global-search-mobile-grid]");

      if (!grid) return;
      if (!q) {
        renderMobileEmptyState(grid);
        return;
      }

      grid.innerHTML = items.length
        ? items.map(p => card(p, true)).join("")
        : `<div class="global-search-empty global-search-empty--mobile">
             <strong>Aucun résultat pour « ${escapeHtml(q)} »</strong>
           </div>`;
    };

    const updateQueryLabel = () => {
      const q = input.value.trim();
      if (!queryLabel) return;
      queryLabel.innerHTML = q
        ? `Résultats pour <strong>« ${escapeHtml(q)} »</strong>`
        : "Découvrez nos pièces et nos attentions.";
    };

    const renderDesktopEmptyState = () => {
      if (!results) return;
      const recent = getRecentSearches();
      const recentHtml = recent.length
        ? `<section class="global-search-suggestions-block" aria-label="Recherches précédentes">
             <div class="global-search-suggestions-title">Recherches précédentes</div>
             <div class="global-search-suggestion-chips">${recent.map(item => `<button type="button" class="global-search-suggestion-chip" data-search-chip="${escapeHtml(item)}">${escapeHtml(item)}</button>`).join("")}</div>
           </section>`
        : "";
      const suggestionsHtml = `<section class="global-search-suggestions-block" aria-label="Suggestions de recherche">
        <div class="global-search-suggestions-title">Suggestions</div>
        <div class="global-search-suggestion-chips">${SEARCH_SUGGESTIONS.map(item => `<button type="button" class="global-search-suggestion-chip" data-search-chip="${escapeHtml(item)}">${escapeHtml(item)}</button>`).join("")}</div>
      </section>`;
      results.innerHTML = `<div class="global-search-suggestions-panel">${recentHtml}${suggestionsHtml}</div>`;

      results.querySelectorAll("[data-search-chip]").forEach(button => {
        button.addEventListener("click", () => {
          input.value = button.getAttribute("data-search-chip") || "";
          saveRecentSearch(input.value);
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.focus({ preventScroll: true });
        });
      });
    };

    const renderDesktop = () => {
      const q = input.value.trim();
      if (!q) {
        if (current) current.textContent = "";
        if (queryLabel) queryLabel.textContent = "";
        renderDesktopEmptyState();
        return;
      }
      const items = getItems();
      if (current) {
        current.innerHTML = q
          ? `Recherche pour <strong>« ${escapeHtml(q)} »</strong>`
          : "Commencez votre recherche…";
      }
      updateQueryLabel();

      const html = items.length
        ? items.map(p => card(p)).join("")
        : `<div class="global-search-empty">
             <span class="global-search-empty-mark">♡</span>
             <strong>Aucun produit trouvé</strong>
             <p>Nous n'avons rien trouvé pour <b>« ${escapeHtml(q)} »</b>.</p>
             <small>Essayez un autre mot-clé ou découvrez nos nouveautés.</small>
           </div>`;

      if (results) results.innerHTML = html;
    };

    const render = () => {
      if (isMobile()) renderMobile();
      else renderDesktop();
    };

    const openMobile = () => {
      updateMobileTop();
      renderMobile();
      mobileResults?.classList.add("is-open");
      mobileResults?.setAttribute("aria-hidden", "false");
      document.body.classList.add("global-search-open");
      input.setAttribute("aria-expanded", "true");
    };

    const openDesktop = () => {
      renderDesktop();
      aside.classList.add("is-open");
      overlay?.classList.add("is-open");
      aside.setAttribute("aria-hidden", "false");
      document.body.classList.add("global-search-open");
    };

    const open = () => isMobile() ? openMobile() : openDesktop();

    function close() {
      mobileResults?.classList.remove("is-open");
      mobileResults?.setAttribute("aria-hidden", "true");
      aside.classList.remove("is-open");
      overlay?.classList.remove("is-open");
      aside.setAttribute("aria-hidden", "true");
      document.body.classList.remove("global-search-open");
      input.setAttribute("aria-expanded", "false");
    }

    input.setAttribute("aria-expanded", "false");
    input.addEventListener("click", open);
    input.addEventListener("focus", open);
    input.addEventListener("input", () => {
      render();
      if (isMobile()) {
        openMobile();
      } else if (!aside.classList.contains("is-open")) {
        openDesktop();
      }
    });

    clear?.addEventListener("click", e => {
      e.preventDefault();
      input.value = "";
      render();
      close();
    });

    document.querySelector("[data-global-search-close]")?.addEventListener("click", close);
    overlay?.addEventListener("click", close);

    input.closest("form")?.addEventListener("submit", e => {
      e.preventDefault();
      const q = input.value.trim();
      if (q) {
        saveRecentSearch(q);
        location.href = `boutique.html?q=${encodeURIComponent(q)}`;
      }
    });

    mobileResults?.addEventListener("click", e => {
      const result = e.target.closest(".global-result--mobile");
      if (result) saveRecentSearch(input.value);
    });

    results?.addEventListener("click", e => {
      const result = e.target.closest(".global-result");
      if (result) saveRecentSearch(input.value);
    });

    document.addEventListener("keydown", e => {
      if (e.key === "Escape") close();
    });

    window.addEventListener("resize", () => {
      if (isMobile()) {
        updateMobileTop();
      } else if (mobileResults?.classList.contains("is-open")) {
        close();
      }
    }, { passive: true });

    window.addEventListener("scroll", () => {
      if (isMobile() && mobileResults?.classList.contains("is-open")) updateMobileTop();
    }, { passive: true });
  };

  const start = () => (window.MAELIE_PRODUCTS_READY || Promise.resolve()).then(init);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true }); else start();
})();
