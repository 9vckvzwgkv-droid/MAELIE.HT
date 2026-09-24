(() => {
  const KEY = "maelie_cart";
  const FAV = "maelie_favs";
  const COUPON = "maelie_coupon";
  const money = (n) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(Number(n) || 0);
  const read = (key, fallback = []) => {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return v ?? fallback;
    } catch {
      return fallback;
    }
  };
  const write = (key, value) =>
    localStorage.setItem(key, JSON.stringify(value));
  const product = (id) =>
    window.MAELIE_PRODUCTS.find((p) => p.id === Number(id));
  const cart = () => read(KEY, []).filter((x) => product(x.id));
  const favs = () =>
    read(FAV, [])
      .map(Number)
      .filter((id) => product(id));
  const setCart = (value) => {
    write(KEY, value);
    refreshCounts();
    window.dispatchEvent(new CustomEvent("maelie:cart"));
  };
  const setFavs = (value) => {
    write(FAV, value);
    refreshCounts();
    window.dispatchEvent(new CustomEvent("maelie:favs"));
  };
  const add = (id, quantity = 1, size = "") => {
    const p = product(id);
    if (!p || Number(p.stock) < 1) {
      if (p) toast(`${p.name} est actuellement indisponible.`);
      return;
    }
    const c = cart();
    const q = Math.max(1, Math.min(99, Number(quantity) || 1));
    const normalizedSize = String(size || "").trim();
    const row = c.find((x) => x.id === p.id && String(x.size || "") === normalizedSize);
    if (row) {
      const maxStock = Math.max(1, Number(p.stock) || 99);
      row.quantity = Math.min(99, maxStock, row.quantity + q);
    }
    else c.push({ id: p.id, quantity: q, ...(normalizedSize ? { size: normalizedSize } : {}) });
    setCart(c);
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.classList.remove('is-bumping');
      void el.offsetWidth;
      el.classList.add('is-bumping');
    });
    document.querySelectorAll(`[data-add="${p.id}"]`).forEach((button) => {
      if (button.disabled) return;
      const original = button.textContent;
      button.textContent = 'Ajouté ✓';
      button.classList.add('is-added');
      setTimeout(() => {
        button.textContent = original;
        button.classList.remove('is-added');
      }, 1100);
    });
    toast(`${p.name} a été ajouté au panier.`);
  };
  const remove = (id) => setCart(cart().filter((x) => x.id !== Number(id)));
  const qty = (id, quantity) => {
    const c = cart();
    const row = c.find((x) => x.id === Number(id));
    if (!row) return;
    if (Number(quantity) <= 0) return remove(id);
    const requested = Number(quantity) || 1;
    const p = product(id);
    if (!p) return;
    const maxStock = Math.max(1, Number(p.stock) || 99);
    row.quantity = Math.max(1, Math.min(99, maxStock, requested));
    setCart(c);
  };
  const toggleFav = (id) => {
    const n = Number(id),
      f = favs(),
      i = f.indexOf(n);
    if (i >= 0) f.splice(i, 1);
    else f.push(n);
    setFavs(f);
    return f.includes(n);
  };
  const refreshCounts = () => {
    const total = cart().reduce((sum, x) => sum + x.quantity, 0);
    document
      .querySelectorAll("[data-cart-count]")
      .forEach((el) => (el.textContent = total));
    document
      .querySelectorAll("[data-fav-count]")
      .forEach((el) => (el.textContent = favs().length));
  };
  const toast = (message) => {
    let el = document.querySelector(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove("show"), 2400);
  };
  const stars = (rating) => {
    const n = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
    return "★".repeat(n) + "☆".repeat(5 - n);
  };
  const card = (p) => {
    const active = favs().includes(p.id);
    return `<article class="product-card">
      <div class="product-media">
        <a href="product.html?slug=${encodeURIComponent(p.slug)}" aria-label="Voir ${p.name}"><img src="${p.img}" alt="${p.name}" loading="lazy" decoding="async"></a>
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ""}
        <button class="wish ${active ? "active" : ""}" data-fav="${p.id}" type="button" aria-label="${active ? "Retirer des favoris" : "Ajouter aux favoris"}">${active ? "♥" : "♡"}</button>
      </div>
      <div class="product-info">
        <div class="product-meta"><div><span class="stars" aria-label="Note ${p.rating} sur 5">${stars(p.rating)}</span> <small class="muted">(${p.reviews})</small></div><span class="muted">${p.cat}</span></div>
        <h3><a href="product.html?slug=${encodeURIComponent(p.slug)}">${p.name}</a></h3>
        <div><span class="price">${money(p.price)}</span>${p.old ? `<span class="old">${money(p.old)}</span>` : ""}</div>
        <div class="product-stock ${p.stock < 1 ? "is-out" : p.stock <= 3 ? "is-low" : ""}">${p.stock < 1 ? "Épuisé" : p.stock <= 3 ? `Plus que ${p.stock} en stock` : "En stock"}</div>
        <button class="quick-add" data-add="${p.id}" type="button" ${p.stock < 1 ? "disabled" : ""}>${p.stock < 1 ? "Épuisé" : "Ajouter au panier"}</button>
      </div>
    </article>`;
  };
  const bind = () => {
    document.addEventListener("click", (event) => {
      const addButton = event.target.closest("[data-add]");
      if (addButton) {
        event.preventDefault();
        add(addButton.dataset.add);
        return;
      }
      const favButton = event.target.closest("[data-fav]");
      if (favButton) {
        event.preventDefault();
        const active = toggleFav(favButton.dataset.fav);
        favButton.classList.toggle("active", active);
        favButton.textContent = active ? "♥" : "♡";
        favButton.classList.remove("is-popping");
        void favButton.offsetWidth;
        favButton.classList.add("is-popping");
        if (active) toast(`${MAELIE.product(favButton.dataset.fav)?.name || 'Cette pièce'} a été ajoutée aux favoris.`);
        else toast('Pièce retirée de vos favoris.');
        favButton.setAttribute(
          "aria-label",
          active ? "Retirer des favoris" : "Ajouter aux favoris",
        );
        return;
      }
    });
    const search = document.querySelector("[data-global-search]");
    if (search)
      search.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && search.value.trim())
          location.href = `boutique.html?q=${encodeURIComponent(search.value.trim())}`;
      });
    const newsletter = document.querySelector("[data-newsletter]");
    if (newsletter) newsletter.addEventListener("submit", async (e) => {
      e.preventDefault(); const button = newsletter.querySelector("button"); if(button) button.disabled=true;
      try { const r=await fetch("/api/newsletter",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:newsletter.querySelector("[name=email]")?.value})}); const d=await r.json().catch(()=>({})); if(!r.ok) throw Error(d.error||"Inscription impossible."); toast("Merci ! Vous êtes inscrite à la newsletter MAELIE."); newsletter.reset(); } catch(err){ toast(err.message); } finally { if(button) button.disabled=false; }
    });
    refreshCounts();
    // Met en évidence automatiquement la page actuellement consultée.
    const currentFile = (location.pathname.split("/").pop() || "index.html").split("?")[0] || "index.html";
    document.querySelectorAll(".site-header .nav-links a[href]").forEach((link) => {
      const href = link.getAttribute("href") || "";
      const file = href.split("/").pop().split("?")[0] || "index.html";
      const active = file === currentFile;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  };
  window.MAELIE = {
    KEY,
    COUPON,
    money,
    read,
    write,
    product,
    cart,
    favs,
    setCart,
    setFavs,
    add,
    remove,
    qty,
    toggleFav,
    refreshCounts,
    toast,
    stars,
    card,
  };
  document.addEventListener("DOMContentLoaded", bind);
})();
