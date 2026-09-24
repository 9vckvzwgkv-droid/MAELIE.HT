(() => {
  const root = document.querySelector("[data-admin]");
  if (!root) return;
  const token = localStorage.getItem("maelie_token");
  const esc = (value) => String(value ?? "").replace(/[&<>\"]/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;" }[c]));
  const api = async (p, o = {}) => {
    const r = await fetch("/api" + p, { ...o, headers: { "Content-Type": "application/json", Authorization: "Bearer " + token, ...(o.headers || {}) } });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw Error(d.error || "Erreur");
    return d;
  };
  const statuses = ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"];
  const transitions = { pending:["paid","cancelled"], paid:["processing","cancelled","refunded"], processing:["shipped","cancelled","refunded"], shipped:["delivered","refunded"], delivered:["refunded"], cancelled:[], refunded:[] };
  const revenueStatuses = new Set(["paid","processing","shipped","delivered"]);

  async function render() {
    try {
      const [ps, os, messages] = await Promise.all([api("/admin/products"), api("/admin/orders"), api("/admin/messages")]);
      const revenue = os.filter(o => revenueStatuses.has(o.status)).reduce((s,o) => s + Number(o.total_cents || 0), 0);
      const refunded = os.filter(o => o.status === "refunded").reduce((s,o) => s + Number(o.total_cents || 0), 0);
      const pending = os.filter(o => o.status === "pending").length;
      const unread = messages.filter(m => m.status === "new").length;
      root.innerHTML = `<div class="admin-shell">
        <div class="account-head"><div><span class="eyebrow">Back-office</span><h1>MAELIE Admin</h1><p class="muted">Pilotez votre catalogue, vos stocks, vos commandes et vos messages.</p></div><a class="btn btn-outline" href="index.html">Voir le site</a></div>
        <div class="admin-grid">
          <div class="stat"><span class="muted">Produits actifs</span><strong>${ps.filter(p=>p.active).length}/${ps.length}</strong></div>
          <div class="stat"><span class="muted">Commandes</span><strong>${os.length}</strong></div>
          <div class="stat"><span class="muted">CA encaissé</span><strong>${MAELIE.money(revenue / 100)}</strong></div>
          <div class="stat"><span class="muted">Remboursé</span><strong>${MAELIE.money(refunded / 100)}</strong></div>
          <div class="stat"><span class="muted">En attente</span><strong>${pending}</strong></div>
          <div class="stat"><span class="muted">Messages non lus</span><strong>${unread}</strong></div>
        </div>
        <div class="form-card"><h2>Commandes</h2><div style="overflow:auto"><table class="admin-table"><thead><tr><th>Commande</th><th>Email</th><th>Total</th><th>Statut</th><th>Date</th></tr></thead><tbody>${os.map(o=>{
          const allowed = [o.status, ...(transitions[o.status]||[])];
          return `<tr><td><strong>${esc(o.number)}</strong></td><td>${esc(o.email)}</td><td>${MAELIE.money(o.total_cents/100)}</td><td><select data-status data-id="${o.id}" ${allowed.length===1?'disabled':''}>${statuses.filter(s=>allowed.includes(s)).map(s=>`<option value="${s}" ${o.status===s?'selected':''}>${s}</option>`).join("")}</select></td><td>${new Date(o.created_at).toLocaleDateString("fr-FR")}</td></tr>`;
        }).join("")}</tbody></table></div></div>
        <div class="form-card" style="margin-top:20px"><h2>Catalogue & stocks</h2><p class="muted">Les modifications sont enregistrées directement dans la base utilisée par la boutique.</p><div style="overflow:auto"><table class="admin-table"><thead><tr><th>Produit</th><th>Catégorie</th><th>Prix</th><th>Stock</th><th>État</th><th>Action</th></tr></thead><tbody>${ps.map(p=>`<tr>
          <td><input data-p-name="${p.id}" value="${esc(p.name)}" maxlength="120"></td>
          <td><input data-p-cat="${p.id}" value="${esc(p.category)}" maxlength="60"></td>
          <td><input data-p-price="${p.id}" type="number" min="0" step="0.01" value="${(p.price_cents/100).toFixed(2)}"></td>
          <td><input data-p-stock="${p.id}" type="number" min="0" step="1" value="${p.stock}"></td>
          <td><label><input data-p-active="${p.id}" type="checkbox" ${p.active?'checked':''}> Actif</label></td>
          <td><button class="btn btn-outline" type="button" data-save-product="${p.id}">Enregistrer</button></td>
        </tr>`).join("")}</tbody></table></div></div>
        <div class="form-card" style="margin-top:20px"><h2>Messages de contact</h2><div style="overflow:auto"><table class="admin-table"><thead><tr><th>Date</th><th>Nom</th><th>Email</th><th>Sujet</th><th>État</th><th>Action</th></tr></thead><tbody>${messages.map(m=>`<tr><td>${new Date(m.created_at).toLocaleDateString("fr-FR")}</td><td>${esc(m.name)}</td><td>${esc(m.email)}</td><td>${esc(m.subject)}</td><td>${esc(m.status)}</td><td><select data-message-status data-id="${m.id}">${["new","read","archived"].map(s=>`<option value="${s}" ${m.status===s?'selected':''}>${s}</option>`).join("")}</select></td></tr>`).join("") || '<tr><td colspan="6">Aucun message.</td></tr>'}</tbody></table></div></div>
      </div>`;

      root.querySelectorAll("[data-status]").forEach(s => s.onchange = async () => {
        try { await api("/admin/orders/"+s.dataset.id,{method:"PATCH",body:JSON.stringify({status:s.value})}); MAELIE.toast("Statut mis à jour"); render(); }
        catch(e){ MAELIE.toast(e.message); render(); }
      });
      root.querySelectorAll("[data-save-product]").forEach(btn => btn.onclick = async () => {
        const id=btn.dataset.saveProduct;
        try {
          await api("/admin/products/"+id,{method:"PATCH",body:JSON.stringify({
            name:root.querySelector(`[data-p-name="${id}"]`).value,
            category:root.querySelector(`[data-p-cat="${id}"]`).value,
            price:Number(root.querySelector(`[data-p-price="${id}"]`).value),
            stock:Number(root.querySelector(`[data-p-stock="${id}"]`).value),
            active:root.querySelector(`[data-p-active="${id}"]`).checked
          })});
          MAELIE.toast("Produit mis à jour"); render();
        } catch(e){ MAELIE.toast(e.message); }
      });
      root.querySelectorAll("[data-message-status]").forEach(s => s.onchange = async () => {
        try { await api("/admin/messages/"+s.dataset.id,{method:"PATCH",body:JSON.stringify({status:s.value})}); MAELIE.toast("Message mis à jour"); }
        catch(e){ MAELIE.toast(e.message); render(); }
      });
    } catch (e) {
      root.innerHTML = `<div class="empty"><h2>Accès administrateur requis</h2><p class="muted">Connectez-vous avec un compte administrateur.</p><a class="btn btn-primary" href="compte.html">Se connecter</a></div>`;
    }
  }
  render();
})();
