(() => {
  const root = document.querySelector("[data-account]");
  if (!root) return;
  const token = () => localStorage.getItem("maelie_token");
  const api = async (path, opt = {}) => {
    const r = await fetch("/api" + path, {
      ...opt,
      headers: { "Content-Type": "application/json", ...(token() ? { Authorization: "Bearer " + token() } : {}) },
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw Error(d.error || "Une erreur est survenue");
    return d;
  };
  const login = () => {
    root.innerHTML = `<div class="auth-grid">
      <div class="auth-intro">
        <span class="eyebrow">L'univers MAELIE</span>
        <h2>Votre espace, en toute simplicité.</h2>
        <p>Retrouvez vos commandes, vos informations et vos coups de cœur au même endroit.</p>
        <div class="auth-points">
          <div class="auth-point"><b>✓</b><span>Suivez facilement vos commandes</span></div>
          <div class="auth-point"><b>♡</b><span>Conservez vos pièces préférées</span></div>
          <div class="auth-point"><b>✦</b><span>Gagnez du temps lors de vos prochains achats</span></div>
        </div>
      </div>
      <div class="form-card">
        <span class="eyebrow">Déjà cliente ?</span><h2>Se connecter</h2>
        <form class="form" data-login>
          <div class="field"><label>E-mail</label><input name="email" type="email" autocomplete="email" required></div>
          <div class="field"><label>Mot de passe</label><input name="password" type="password" autocomplete="current-password" required></div>
          <button class="btn btn-primary">Se connecter</button><button type="button" class="btn btn-soft" data-forgot>Mot de passe oublié ?</button>
        </form>
        <div style="height:1px;background:var(--line);margin:25px 0"></div>
        <span class="eyebrow">Première visite</span><h2>Créer mon compte</h2>
        <form class="form" data-register>
          <div class="field"><label>Prénom</label><input name="firstName" autocomplete="given-name" required></div>
          <div class="field"><label>Nom</label><input name="lastName" autocomplete="family-name"></div>
          <div class="field"><label>E-mail</label><input name="email" type="email" autocomplete="email" required></div>
          <div class="field"><label>Mot de passe</label><input name="password" type="password" minlength="8" autocomplete="new-password" required></div>
          <div class="field"><label>Confirmation</label><input name="confirm" type="password" minlength="8" autocomplete="new-password" required></div>
          <button class="btn btn-soft">Créer mon compte</button>
        </form>
      </div>
    </div>`;
  };
  const esc = (value) => String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c]));
  const status = (s) => String(s || "En préparation").replace(/[-_]/g, " ");

  const resetView = () => {
    const tokenValue = new URLSearchParams(location.search).get("reset");
    if (!tokenValue) return false;
    root.innerHTML = `<div class="form-card" style="max-width:520px;margin:auto"><span class="eyebrow">Sécurité du compte</span><h2>Nouveau mot de passe</h2><form class="form" data-reset><input type="hidden" name="token" value="${esc(tokenValue)}"><div class="field"><label>Nouveau mot de passe</label><input name="password" type="password" minlength="8" autocomplete="new-password" required></div><div class="field"><label>Confirmation</label><input name="confirm" type="password" minlength="8" autocomplete="new-password" required></div><button class="btn btn-primary">Enregistrer</button></form></div>`;
    return true;
  };
  if (resetView()) {
    document.addEventListener("submit", async (e) => { if(!e.target.matches("[data-reset]")) return; e.preventDefault(); const d=Object.fromEntries(new FormData(e.target)); if(d.password!==d.confirm) return MAELIE.toast("Les mots de passe ne correspondent pas."); try { const r=await fetch("/api/auth/reset-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:d.token,password:d.password})}); const out=await r.json().catch(()=>({})); if(!r.ok) throw Error(out.error||"Réinitialisation impossible."); history.replaceState({},document.title,location.pathname); MAELIE.toast("Mot de passe modifié. Vous pouvez vous connecter."); render(); } catch(err){ MAELIE.toast(err.message); } }, {once:false});
  }
  async function render() {
    if (!token()) { login(); return; }
    try {
      const [u, orders] = await Promise.all([api("/me"), api("/orders")]);
      const safeFirst = esc(u.firstName || u.email.split("@")[0]);
      const safeLast = esc(u.lastName || "");
      const safeEmail = esc(u.email);
      const favCount = MAELIE.favs().length;
      const cartCount = MAELIE.cart().reduce((sum, x) => sum + x.quantity, 0);
      root.innerHTML = `<div class="account-page-wrap"><div class="account-dashboard">
        <section class="account-welcome"><div><span class="eyebrow">Espace personnel</span><h2>Bonjour ${safeFirst} ✨</h2><p class="muted">Tout ce dont vous avez besoin pour profiter pleinement de votre expérience MAELIE.</p></div><button class="btn btn-outline" data-logout>Se déconnecter</button></section>
        <section class="account-stats">
          <div class="account-stat"><span>Commandes</span><strong>${orders.length}</strong><span>dans votre historique</span></div>
          <div class="account-stat"><span>Favoris</span><strong>${favCount}</strong><span>pièce${favCount > 1 ? "s" : ""} enregistrée${favCount > 1 ? "s" : ""}</span></div>
          <div class="account-stat"><span>Panier</span><strong>${cartCount}</strong><span>article${cartCount > 1 ? "s" : ""} actuellement</span></div>
        </section>
        <section class="account-layout">
          <div class="account-card"><div class="account-card-head"><div><span class="eyebrow">Votre profil</span><h2>Mes informations</h2></div><span class="pill">Compte actif</span></div>
            <div class="account-info"><div class="account-info-item"><small>Prénom</small><strong>${safeFirst}</strong></div><div class="account-info-item"><small>Nom</small><strong>${safeLast || "Non renseigné"}</strong></div><div class="account-info-item" style="grid-column:1/-1"><small>E-mail</small><strong>${safeEmail}</strong></div></div>
          </div>
          <aside class="account-card"><div class="account-card-head"><div><span class="eyebrow">Accès rapide</span><h2>Mon espace</h2></div></div><div class="account-actions">
            <a class="account-action" href="favoris.html"><span class="account-action-icon">♡</span><span><strong>Mes favoris</strong><small>${favCount} sélection${favCount > 1 ? "s" : ""}</small></span></a>
            <a class="account-action" href="panier.html"><span class="account-action-icon">🛍</span><span><strong>Mon panier</strong><small>${cartCount} article${cartCount > 1 ? "s" : ""}</small></span></a>
            <a class="account-action" href="boutique.html"><span class="account-action-icon">✦</span><span><strong>Continuer mes achats</strong><small>Découvrir la boutique</small></span></a>
          </div></aside>
          <div class="account-card" style="grid-column:1/-1"><div class="account-card-head"><div><span class="eyebrow">Votre activité</span><h2>Mes commandes</h2></div><span class="muted" style="font-size:.8rem">${orders.length} commande${orders.length > 1 ? "s" : ""}</span></div>
            ${orders.length ? `<div class="order-list">${orders.map(o => `<div class="order-card"><span><strong>${esc(o.number)}</strong><br><small class="muted">${new Date(o.createdAt).toLocaleDateString("fr-FR")}</small><br><span class="order-status">${esc(status(o.status))}</span></span><strong>${MAELIE.money(o.totalCents / 100)}</strong></div>`).join("")}</div>` : `<div class="fav-empty"><div class="empty-heart">✦</div><h2>Votre première commande vous attend</h2><p class="muted">Découvrez nos essentiels et créez une sélection qui vous ressemble.</p><a class="btn btn-primary" href="boutique.html">Explorer la boutique</a></div>`}
          </div>
        </section>
      </div></div>`;
      root.querySelector("[data-logout]").onclick = () => { localStorage.removeItem("maelie_token"); MAELIE.toast("Vous êtes déconnectée"); render(); };
    } catch { localStorage.removeItem("maelie_token"); login(); }
  }
  if (!new URLSearchParams(location.search).get("reset")) render();
  const paidOrder = new URLSearchParams(location.search).get("order");
  if (new URLSearchParams(location.search).get("paid") === "1") {
    setTimeout(() => MAELIE.toast(paidOrder ? `Paiement confirmé pour ${paidOrder}.` : "Paiement confirmé."), 250);
    history.replaceState({}, document.title, location.pathname);
  }
  document.addEventListener("submit", async (e) => {
    if (!e.target.matches("[data-login],[data-register]")) return;
    e.preventDefault();
    const f = e.target, d = Object.fromEntries(new FormData(f));
    try {
      if (f.matches("[data-register]")) {
        if (d.password !== d.confirm) throw Error("Les mots de passe ne correspondent pas");
        delete d.confirm;
        const r = await api("/auth/register", { method: "POST", body: JSON.stringify(d) });
        localStorage.setItem("maelie_token", r.token);
      } else {
        const r = await api("/auth/login", { method: "POST", body: JSON.stringify(d) });
        localStorage.setItem("maelie_token", r.token);
      }
      MAELIE.toast("Bienvenue chez MAELIE"); render();
    } catch (x) { MAELIE.toast(x.message); }
  });
  document.addEventListener("click", async (e) => {
    if (!e.target.closest("[data-forgot]")) return;
    const email = prompt("Entrez votre adresse e-mail :"); if (!email) return;
    try { const r=await fetch("/api/auth/forgot-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})}); const d=await r.json().catch(()=>({})); if(!r.ok) throw Error(d.error||"Demande impossible."); MAELIE.toast(d.message || "Si cette adresse existe, un lien a été envoyé."); } catch(err){ MAELIE.toast(err.message); }
  });
})();
