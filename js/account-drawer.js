/* MAELIE — espace compte latéral */
(() => {
  "use strict";

  const init = () => {
    if (document.querySelector(".ma-account-drawer")) return;

    const trigger = document.querySelector("[data-account-open]");
    if (!trigger) return;

    const overlay = document.createElement("div");
    overlay.className = "ma-account-overlay";
    overlay.setAttribute("aria-hidden", "true");

    const drawer = document.createElement("aside");
    drawer.className = "ma-account-drawer";
    drawer.setAttribute("aria-hidden", "true");
    drawer.setAttribute("aria-label", "Mon espace MAELIE");
    drawer.innerHTML = `
      <header class="ma-account-header">
        <div>
          <span class="ma-account-eyebrow">MAELIE</span>
          <h2 class="ma-account-title">Mon espace</h2>
          <p class="ma-account-subtitle">Vos envies, vos commandes et vos petits coups de cœur, réunis dans un espace pensé pour vous.</p>
        </div>
        <button type="button" class="ma-account-close" data-account-close aria-label="Fermer mon espace">×</button>
      </header>

      <div class="ma-account-content">
        <div class="ma-float-note ma-float-note--account"><span>✧</span> Un espace rien qu’à vous</div>

        <section class="ma-account-intro">
          <div class="ma-account-intro-icon" aria-hidden="true">♡</div>
          <div>
            <span class="ma-account-card-label" data-account-state>Votre espace personnel</span>
            <h3 data-account-heading>Tout MAELIE, au même endroit.</h3>
            <p data-account-description>Connectez-vous pour retrouver vos informations et suivre vos commandes.</p>
          </div>
        </section>

        <nav class="ma-account-links" aria-label="Accès rapides">
          <a class="ma-account-link" href="compte.html" data-account-close-link>
            <span class="ma-account-link-icon">◎</span>
            <span><strong>Mon compte</strong><small>Informations et commandes</small></span>
            <span class="ma-account-arrow" aria-hidden="true">→</span>
          </a>
          <a class="ma-account-link" href="favoris.html" data-account-close-link>
            <span class="ma-account-link-icon">♡</span>
            <span><strong>Mes favoris</strong><small><b data-drawer-fav-count>0</b> sélection(s)</small></span>
            <span class="ma-account-arrow" aria-hidden="true">→</span>
          </a>
          <a class="ma-account-link" href="panier.html" data-account-close-link>
            <span class="ma-account-link-icon">▢</span>
            <span><strong>Mon panier</strong><small><b data-drawer-cart-count>0</b> article(s)</small></span>
            <span class="ma-account-arrow" aria-hidden="true">→</span>
          </a>
        </nav>

        <div class="ma-account-separator"><span>AVEC DOUCEUR</span></div>

        <a class="ma-account-shop" href="boutique.html" data-account-close-link>
          <span><small>Une envie de douceur ?</small><strong>Découvrir la boutique</strong><em>Chaque pièce raconte un petit moment MAELIE.</em></span>
          <span aria-hidden="true">↗</span>
        </a>
      </div>

      <footer class="ma-account-footer">
        <a class="ma-account-footer-link" href="contact.html" data-account-close-link>Besoin d'aide ? Contactez-nous</a>
        <span class="ma-account-secure">Paiement sécurisé · Retours sous 14 jours</span>
      </footer>`;

    document.body.append(overlay, drawer);

    let lastFocus = null;
    let scrollY = 0;

    const refresh = () => {
      const cart = window.MAELIE?.cart?.() || [];
      const favs = window.MAELIE?.favs?.() || [];
      const cartCount = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      drawer.querySelector("[data-drawer-cart-count]").textContent = cartCount;
      drawer.querySelector("[data-drawer-fav-count]").textContent = favs.length;

      const connected = Boolean(localStorage.getItem("maelie_token"));
      drawer.classList.toggle("is-connected", connected);
      drawer.querySelector("[data-account-state]").textContent = connected ? "Compte connecté" : "Votre espace personnel";
      drawer.querySelector("[data-account-heading]").textContent = connected ? "Ravie de vous retrouver." : "Tout MAELIE, au même endroit.";
      drawer.querySelector("[data-account-description]").textContent = connected
        ? "Retrouvez vos commandes, vos favoris et vos informations personnelles."
        : "Connectez-vous pour retrouver vos informations et suivre vos commandes.";
    };

    const setOpen = (open) => {
      if (open) {
        window.dispatchEvent(new CustomEvent("maelie:drawer-before-open", { detail: "account" }));
        refresh();
        lastFocus = document.activeElement;
        scrollY = window.scrollY;
        drawer.classList.add("is-open");
        overlay.classList.add("is-open");
        drawer.setAttribute("aria-hidden", "false");
        overlay.setAttribute("aria-hidden", "false");
        trigger.setAttribute("aria-expanded", "true");
        document.body.classList.add("ma-account-lock");
        document.body.style.top = `-${scrollY}px`;
        requestAnimationFrame(() => drawer.querySelector("[data-account-close]")?.focus());
      } else {
        drawer.classList.remove("is-open");
        overlay.classList.remove("is-open");
        drawer.setAttribute("aria-hidden", "true");
        overlay.setAttribute("aria-hidden", "true");
        trigger.setAttribute("aria-expanded", "false");
        document.body.classList.remove("ma-account-lock");
        document.body.style.top = "";
        if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
        window.scrollTo(0, scrollY);
      }
    };

    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      setOpen(!drawer.classList.contains("is-open"));
    });

    drawer.addEventListener("click", (event) => {
      if (event.target.closest("[data-account-close]")) setOpen(false);
      if (event.target.closest("[data-account-close-link]")) setOpen(false);
    });
    overlay.addEventListener("click", () => setOpen(false));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && drawer.classList.contains("is-open")) setOpen(false);
    });

    window.addEventListener("maelie:drawer-before-open", (event) => {
      if (event.detail !== "account" && drawer.classList.contains("is-open")) setOpen(false);
    });
    window.addEventListener("maelie:cart", refresh);
    window.addEventListener("maelie:favs", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("pageshow", refresh);

    refresh();
    window.MAELIE = window.MAELIE || {};
    window.MAELIE.openAccountDrawer = () => setOpen(true);
    window.MAELIE.closeAccountDrawer = () => setOpen(false);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
