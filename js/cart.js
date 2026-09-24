(() => {
  const root = document.querySelector("[data-cart]");
  if (!root) return;

  const getCoupon = () =>
    localStorage.getItem(MAELIE.COUPON) === "MAELIE10" ? "MAELIE10" : "";

  const money = (value) => MAELIE.money(value);
  const stars = (rating) => {
    const n = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
    return "★".repeat(n) + "☆".repeat(5 - n);
  };

  const renderRecommendations = (items) => {
    const recommendations = document.querySelector("[data-cart-recommendations]");
    if (!recommendations) return;

    const inCart = new Set(items.map((item) => Number(item.id)));
    const candidates = (window.MAELIE_PRODUCTS || [])
      .filter((product) => !inCart.has(Number(product.id)))
      .sort((a, b) => Number(Boolean(b.new)) - Number(Boolean(a.new)) || Number(b.rating || 0) - Number(a.rating || 0))
      .slice(0, 8);

    recommendations.innerHTML = candidates.length
      ? candidates.map((product) => MAELIE.card(product)).join("")
      : '<p class="muted cart-recommendations-empty">Découvrez toute la sélection dans la boutique.</p>';
  };

  const render = () => {
    const items = MAELIE.cart();
    const layout = document.querySelector(".cart-layout");
    const summary = document.querySelector("[data-summary]");
    const label = document.querySelector("[data-cart-label]");
    const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

    if (label) {
      label.textContent = `${totalQuantity} article${totalQuantity > 1 ? "s" : ""}`;
    }

    if (!items.length) {
      root.innerHTML = `
        <div class="cart-empty-state">
          <div class="cart-empty-state__icon" aria-hidden="true">♡</div>
          <span class="eyebrow">Votre sélection</span>
          <h2>Votre panier est vide</h2>
          <p class="muted">Découvrez les pièces MAELIE et composez une sélection qui vous ressemble.</p>
          <a class="btn btn-primary" href="boutique.html">Découvrir la boutique</a>
        </div>`;

      if (summary) {
        summary.innerHTML = `
          <span class="eyebrow">Votre panier</span>
          <h2>Prête à être rempli</h2>
          <p class="muted">Ajoutez vos coups de cœur pour retrouver ici votre récapitulatif et les avantages de livraison.</p>
          <a class="btn btn-primary cart-summary-empty-button" href="boutique.html">Explorer la boutique</a>`;
      }
      renderRecommendations([]);
      return;
    }

    root.innerHTML = items.map((item) => {
      const product = MAELIE.product(item.id);
      if (!product) return "";
      const active = MAELIE.favs().includes(Number(product.id));
      return `
        <article class="cart-product-card">
          <div class="cart-product-card__media product-media">
            <a href="product.html?slug=${encodeURIComponent(product.slug)}" aria-label="Voir ${product.name}">
              <img src="${product.img}" alt="${product.name}" loading="lazy" decoding="async">
            </a>
            ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ""}
            <button class="wish ${active ? "active" : ""}" data-fav="${product.id}" type="button" aria-label="${active ? "Retirer des favoris" : "Ajouter aux favoris"}">${active ? "♥" : "♡"}</button>
          </div>
          <div class="cart-product-card__info product-info">
            <div class="product-meta">
              <div><span class="stars" aria-label="Note ${product.rating || 0} sur 5">${stars(product.rating)}</span> <small class="muted">(${product.reviews || 0})</small></div>
              <span class="muted">${product.cat}</span>
            </div>
            <h3><a href="product.html?slug=${encodeURIComponent(product.slug)}">${product.name}</a></h3>
            ${item.size ? `<div class="cart-product-card__size">Taille : <strong>${item.size}</strong></div>` : ''}
            <div class="cart-product-card__price-line">
              <span class="price">${money(product.price)}</span>
              ${product.old ? `<span class="old">${money(product.old)}</span>` : ""}
            </div>
            <div class="cart-product-card__controls">
              <div class="quantity cart-quantity" aria-label="Quantité de ${product.name}">
                <button data-minus="${product.id}" type="button" aria-label="Diminuer la quantité">−</button>
                <span>${item.quantity}</span>
                <button data-plus="${product.id}" type="button" aria-label="Augmenter la quantité">+</button>
              </div>
              <strong class="cart-product-card__total">${money(product.price * item.quantity)}</strong>
            </div>
            <div class="cart-product-card__actions">
              <button class="cart-link-action" data-fav="${product.id}" type="button">${active ? "♥ Retirer des favoris" : "♡ Ajouter aux favoris"}</button>
              <button class="cart-link-action cart-link-action--remove" data-remove="${product.id}" type="button">Supprimer</button>
            </div>
          </div>
        </article>`;
    }).join("");

    const sub = items.reduce(
      (sum, item) => sum + MAELIE.product(item.id).price * item.quantity,
      0,
    );
    const coupon = getCoupon();
    const discount = coupon ? sub * 0.1 : 0;
    const afterDiscount = sub - discount;
    const shippingThreshold = 80;
    const shipping = afterDiscount >= shippingThreshold ? 0 : 4.9;
    const total = afterDiscount + shipping;
    const remaining = Math.max(0, shippingThreshold - afterDiscount);
    const progress = Math.min(100, (afterDiscount / shippingThreshold) * 100);

    if (summary) {
      summary.innerHTML = `
        <div class="cart-summary-head">
          <span class="eyebrow">Récapitulatif</span>
          <h2>Votre commande</h2>
        </div>
        <div class="cart-shipping-progress">
          <div class="cart-shipping-progress__text">
            <span>${remaining > 0 ? `Plus que <strong>${money(remaining)}</strong> pour la livraison offerte` : "Livraison offerte pour votre commande"}</span>
            <span>${Math.round(progress)}%</span>
          </div>
          <div class="cart-shipping-progress__bar"><span style="width:${progress}%"></span></div>
        </div>
        <div class="coupon cart-coupon">
          <input data-coupon placeholder="Code promo" value="${coupon}" aria-label="Code promo">
          <button class="btn btn-soft" data-apply type="button">Appliquer</button>
        </div>
        ${coupon ? '<small class="cart-coupon-success">Code MAELIE10 appliqué · -10 %</small>' : '<small class="muted cart-coupon-hint">Profitez de -10 % sur votre première commande avec MAELIE10.</small>'}
        <div class="cart-summary-lines">
          <div class="summary-row"><span>Sous-total</span><strong>${money(sub)}</strong></div>
          ${discount ? `<div class="summary-row cart-discount"><span>Réduction</span><strong>-${money(discount)}</strong></div>` : ""}
          <div class="summary-row"><span>Livraison</span><strong>${shipping ? "4,90 €" : "Offerte"}</strong></div>
          <div class="summary-row summary-total"><span>Total</span><strong>${money(total)}</strong></div>
        </div>
        <a class="btn btn-primary cart-checkout-button" href="commande.html">Passer à la commande</a>
        <div class="cart-trust-row">
          <span>♢ Paiement sécurisé</span>
          <span>♡ Retours 14 jours</span>
        </div>`;
    }

    renderRecommendations(items);
  };

  document.addEventListener("click", (event) => {
    const plus = event.target.closest("[data-plus]");
    const minus = event.target.closest("[data-minus]");
    const remove = event.target.closest("[data-remove]");
    const apply = event.target.closest("[data-apply]");

    if (plus) {
      const row = MAELIE.cart().find((item) => item.id === Number(plus.dataset.plus));
      if (row) MAELIE.qty(row.id, row.quantity + 1);
      render();
      return;
    }

    if (minus) {
      const row = MAELIE.cart().find((item) => item.id === Number(minus.dataset.minus));
      if (row) MAELIE.qty(row.id, row.quantity - 1);
      render();
      return;
    }

    if (remove) {
      MAELIE.remove(remove.dataset.remove);
      render();
      return;
    }

    if (apply) {
      const input = document.querySelector("[data-coupon]");
      const value = input.value.trim().toUpperCase();
      if (value && value !== "MAELIE10") {
        MAELIE.toast("Code promo invalide.");
        return;
      }
      if (value) localStorage.setItem(MAELIE.COUPON, value);
      else localStorage.removeItem(MAELIE.COUPON);
      render();
      MAELIE.toast(value ? "Code promo appliqué." : "Code promo retiré.");
    }
  });

  window.addEventListener("maelie:cart", render);
  render();
})();
