(() => {
  const root = document.querySelector("[data-checkout]");
  if (!root) return;
  const token = localStorage.getItem("maelie_token");
  const cart = MAELIE.cart();
  if (!cart.length) {
    root.innerHTML =
      '<div class="empty"><h2>Votre panier est vide</h2><a class="btn btn-primary" href="boutique.html">Retour à la boutique</a></div>';
    return;
  }
  if (!token) {
    root.innerHTML =
      '<div class="empty"><h2>Connectez-vous pour commander</h2><p class="muted">Votre panier est conservé.</p><a class="btn btn-primary" href="compte.html">Accéder à mon compte</a></div>';
    return;
  }
  const sub = cart.reduce(
      (s, x) => s + MAELIE.product(x.id).price * x.quantity,
      0,
    ),
    discount =
      localStorage.getItem(MAELIE.COUPON) === "MAELIE10" ? sub * 0.1 : 0,
    ship = sub - discount >= 80 ? 0 : 4.9;
  root.innerHTML = `<div class="checkout-shell">
    <div class="checkout-main">
      <div class="checkout-steps" aria-label="Étapes de commande"><span class="is-current"><b>1</b> Livraison</span><span><b>2</b> Paiement</span><span><b>3</b> Confirmation</span></div>
      <div class="form-card checkout-form-card">
        <div class="checkout-card-head"><span class="eyebrow">Livraison</span><h2>Où souhaitez-vous recevoir votre commande ?</h2><p class="muted">Vos informations sont utilisées uniquement pour préparer et livrer votre commande.</p></div>
        <form class="form" data-order>
          <div class="field"><label for="checkout-email">E-mail</label><input id="checkout-email" name="email" type="email" autocomplete="email" inputmode="email" required></div>
          <div class="checkout-two-fields"><div class="field"><label for="checkout-name">Nom complet</label><input id="checkout-name" name="name" autocomplete="name" required></div><div class="field"><label for="checkout-phone">Téléphone</label><input id="checkout-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" required></div></div>
          <div class="field"><label for="checkout-address">Adresse</label><input id="checkout-address" name="address" autocomplete="street-address" required></div>
          <div class="checkout-two-fields checkout-two-fields--city"><div class="field"><label for="checkout-zip">Code postal</label><input id="checkout-zip" name="zip" inputmode="numeric" autocomplete="postal-code" required></div><div class="field"><label for="checkout-city">Ville</label><input id="checkout-city" name="city" autocomplete="address-level2" required></div></div>
          <div class="checkout-note"><span aria-hidden="true">♡</span><span>Paiement sécurisé · Livraison offerte dès 80 € · Retours sous 14 jours</span></div>
          <button class="btn btn-primary checkout-submit" type="submit" data-order-submit>Continuer vers le paiement</button>
          <a class="checkout-back" href="panier.html">← Retour au panier</a>
        </form>
      </div>
    </div>
    <aside class="summary checkout-summary">
      <span class="eyebrow">Votre sélection</span><h2>Récapitulatif</h2>
      <div class="checkout-items">${cart.map((x)=>{const p=MAELIE.product(x.id); return `<div class="checkout-item"><img src="${p.img}" alt="" loading="lazy" decoding="async"><div><strong>${p.name}</strong><span>Quantité · ${x.quantity}</span></div><b>${MAELIE.money(p.price*x.quantity)}</b></div>`;}).join('')}</div>
      <div class="summary-row"><span>Sous-total</span><strong>${MAELIE.money(sub)}</strong></div>
      ${discount ? `<div class="summary-row cart-discount"><span>Réduction</span><strong>-${MAELIE.money(discount)}</strong></div>` : ''}
      <div class="summary-row"><span>Livraison</span><strong>${ship ? MAELIE.money(ship) : 'Offerte'}</strong></div>
      <div class="summary-row summary-total"><span>Total</span><strong>${MAELIE.money(sub-discount+ship)}</strong></div>
    </aside>
  </div>`;
  root.querySelector("[data-order]").onsubmit = async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target));
    const submit = e.target.querySelector("[data-order-submit]");
    submit.disabled = true;
    submit.textContent = "Vérification…";
    try {
      const payload = {
        items: cart,
        address: { email: fd.email, name: fd.name, phone: fd.phone, address: fd.address, zip: fd.zip, city: fd.city },
        coupon: localStorage.getItem(MAELIE.COUPON) || null,
      };
      const config = await fetch("/api/config").then((r) => r.json());
      const endpoint = config.stripeEnabled ? "/api/payment/checkout" : "/api/orders";
      submit.textContent = config.stripeEnabled ? "Redirection vers le paiement…" : "Validation…";
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify(payload),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw Error(d.error || "Impossible de finaliser la commande.");
      if (config.stripeEnabled && d.url) {
        window.location.href = d.url;
        return;
      }
      MAELIE.setCart([]);
      localStorage.removeItem(MAELIE.COUPON);
      root.innerHTML = `<div class="success"><div class="check">✓</div><span class="eyebrow">Merci pour votre confiance</span><h1>Commande confirmée</h1><p>Votre commande <strong>${String(d.number).replace(/[<>]/g, "")}</strong> a bien été enregistrée.</p><p class="muted">Retrouvez son statut depuis votre espace personnel.</p><a class="btn btn-primary" href="compte.html">Voir mon compte</a></div>`;
    } catch (x) {
      submit.disabled = false;
      submit.textContent = "Confirmer ma commande";
      MAELIE.toast(x.message);
    }
  };
})();
