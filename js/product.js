(() => {
  const boot = () => {
    const root = document.querySelector('[data-product-page]');
    if (!root) return;
    const slug = new URLSearchParams(location.search).get('slug') || 'robe-eclat';
    const p = MAELIE_PRODUCTS.find(x => x.slug === slug);
    const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
    if (!p) {
      root.innerHTML = '<div class="empty"><h1>Produit introuvable</h1><p class="muted">Ce produit n’existe plus ou n’est plus disponible.</p><a class="btn btn-primary" href="boutique.html">Retour à la boutique</a></div>';
      return;
    }

    const safeName = esc(p.name), safeCat = esc(p.cat), safeBadge = esc(p.badge), safeDesc = esc(p.desc);
    const stock = Number.isFinite(Number(p.stock)) ? Number(p.stock) : 0;
    document.title = `${safeName} — MAELIE`;
    const productDescription = `${p.desc} Prix : ${MAELIE.money(p.price)}.`;
    const setMeta = (selector, attr, value) => { const el = document.querySelector(selector); if (el) el.setAttribute(attr, value); };
    setMeta('meta[name="description"]', 'content', productDescription);
    setMeta('meta[property="og:title"]', 'content', document.title);
    setMeta('meta[property="og:description"]', 'content', productDescription);
    setMeta('meta[name="twitter:title"]', 'content', document.title);
    setMeta('meta[name="twitter:description"]', 'content', productDescription);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', `product.html?slug=${encodeURIComponent(p.slug)}`);

    let productSchema = document.getElementById('maelie-product-schema');
    if (!productSchema) {
      productSchema = document.createElement('script');
      productSchema.type = 'application/ld+json';
      productSchema.id = 'maelie-product-schema';
      document.head.appendChild(productSchema);
    }
    productSchema.textContent = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.desc,
      image: [p.img], sku: String(p.id), category: p.cat,
      aggregateRating: p.rating && p.reviews ? {'@type':'AggregateRating', ratingValue:p.rating, reviewCount:p.reviews} : undefined,
      offers: {'@type':'Offer', priceCurrency:'EUR', price:Number(p.price).toFixed(2), availability: stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'}
    });

    const safeImg = encodeURI(p.img);
    const favActive = MAELIE.favs().includes(p.id);
    const stockLabel = stock <= 0 ? 'Épuisé' : stock <= 3 ? `Plus que ${stock} en stock` : 'En stock';
    const stockClass = stock <= 0 ? 'is-out' : stock <= 3 ? 'is-low' : 'is-ok';
    const modeInfo = p.cat === 'Mode' ? `
      <div class="product-size-picker" data-size-picker>
        <div class="product-size-head"><span>Taille</span><a class="product-detail-link" href="guide-tailles.html">Guide des tailles →</a></div>
        <div class="product-size-options" role="radiogroup" aria-label="Choisir une taille">
          ${['XS','S','M','L','XL'].map(size => `<button type="button" class="product-size-btn" data-size="${size}" role="radio" aria-checked="false">${size}</button>`).join('')}
        </div>
        <p class="product-size-hint" data-size-hint>Choisissez votre taille avant d’ajouter cette pièce au panier.</p>
      </div>` : '';

    root.innerHTML = `<div class="breadcrumbs"><a href="index.html">Accueil</a><span>›</span><a href="boutique.html">Boutique</a><span>›</span><span>${safeName}</span></div>
      <div class="product-detail">
        <div class="product-visual-wrap">
          <div class="product-visual" data-product-zoom>
            <img src="${safeImg}" alt="${safeName}" decoding="async" fetchpriority="high">
            <button class="product-zoom-btn" type="button" data-product-zoom-open aria-label="Voir ${safeName} en grand">⤢</button>
            ${p.badge ? `<span class="product-visual-badge">${safeBadge}</span>` : ''}
          </div>
          <p class="product-image-caption">Touchez l’image pour l’agrandir</p>
        </div>
        <div class="product-copy">
          <span class="eyebrow">${safeCat}${p.badge ? ` · ${safeBadge}` : ''}</span>
          <h1>${safeName}</h1>
          <div class="stars" aria-label="Note ${p.rating} sur 5">${MAELIE.stars(p.rating)} <span class="muted">${p.rating}/5 · ${p.reviews} avis</span></div>
          <div class="detail-stock ${stockClass}" aria-live="polite">${stockLabel}</div>
          <div class="detail-price">${MAELIE.money(p.price)} ${p.old ? `<span class="old">${MAELIE.money(p.old)}</span>` : ''}</div>
          <p class="detail-desc">${safeDesc}</p>
          ${modeInfo}
          <div class="detail-actions" data-product-actions>
            <div class="quantity" aria-label="Quantité">
              <button data-dec type="button" aria-label="Diminuer la quantité">−</button><span data-q>1</span><button data-inc type="button" aria-label="Augmenter la quantité">+</button>
            </div>
            <button class="btn btn-primary" data-add-product type="button" ${stock < 1 ? 'disabled' : ''}>${stock < 1 ? 'Produit épuisé' : 'Ajouter au panier'}</button>
            <button class="icon-btn product-fav-btn ${favActive ? 'is-active' : ''}" data-fav="${p.id}" type="button" aria-pressed="${favActive}" aria-label="${favActive ? 'Retirer des favoris' : 'Ajouter aux favoris'}">${favActive ? '♥' : '♡'}</button>
          </div>
          <div class="product-assurance" aria-label="Informations produit">
            <div><span>♡</span><strong>Retours 14 jours</strong><small>Simple et transparent</small></div>
            <div><span>⌁</span><strong>Livraison 3 à 5 jours</strong><small>Offerte dès 80 €</small></div>
            <div><span>✦</span><strong>Préparé avec soin</strong><small>Emballage MAELIE</small></div>
          </div>
          <div class="product-accordions">
            <details open><summary>Description &amp; détails</summary><div class="accordion-content"><p>${safeDesc}</p><ul><li>Pièce sélectionnée avec soin par MAELIE.</li><li>Présentation soignée, pensée pour offrir ou se faire plaisir.</li><li>Disponibilité mise à jour selon le stock.</li></ul></div></details>
            <details><summary>Livraison &amp; retours</summary><div class="accordion-content"><p>Livraison estimée sous 3 à 5 jours ouvrés. Les retours sont possibles sous 14 jours selon les conditions de la boutique.</p><a class="product-detail-link" href="aide.html">Voir l’aide et les conditions →</a></div></details>
            <details><summary>Besoin d’aide ?</summary><div class="accordion-content"><p>Une question sur cette pièce ou votre commande ? L’équipe MAELIE peut vous accompagner.</p><a class="product-detail-link" href="contact.html">Nous contacter →</a></div></details>
          </div>
        </div>
      </div>
      <div class="product-mobile-sticky" data-product-sticky>
        <div><strong>${MAELIE.money(p.price)}</strong><span>${stockLabel}</span></div>
        <button class="btn btn-primary" type="button" data-sticky-add ${stock < 1 ? 'disabled' : ''}>${stock < 1 ? 'Épuisé' : 'Ajouter au panier'}</button>
      </div>
      <div class="product-lightbox" data-product-lightbox hidden aria-hidden="true" role="dialog" aria-modal="true" aria-label="Image de ${safeName}">
        <button type="button" class="product-lightbox-close" data-product-zoom-close aria-label="Fermer l’image">×</button>
        <img src="${safeImg}" alt="${safeName}">
      </div>
      <section class="section related"><div class="section-head"><div><span class="eyebrow">Vous aimerez aussi</span><h2>Dans le même esprit</h2></div><a class="btn btn-outline" href="boutique.html?cat=${encodeURIComponent(p.cat)}">Voir la catégorie</a></div><div class="product-grid">${MAELIE_PRODUCTS.filter(x=>x.id!==p.id&&x.cat===p.cat).slice(0,4).map(MAELIE.card).join('')}</div></section>
      <section class="section"><div class="section-head"><div><span class="eyebrow">Votre navigation</span><h2>Récemment consultés</h2></div></div><div class="product-grid" data-recent-products></div></section>`;

    try {
      const viewed = JSON.parse(localStorage.getItem('maelie_recent') || '[]').map(Number).filter(Boolean);
      const next = [p.id, ...viewed.filter(id => id !== p.id)].slice(0, 6);
      localStorage.setItem('maelie_recent', JSON.stringify(next));
    } catch {}
    const recentRoot = root.querySelector('[data-recent-products]');
    if (recentRoot) {
      try {
        const ids = JSON.parse(localStorage.getItem('maelie_recent') || '[]').map(Number).filter(id => id !== p.id);
        recentRoot.innerHTML = MAELIE_PRODUCTS.filter(x => ids.includes(Number(x.id))).slice(0,4).map(MAELIE.card).join('') || '<p class="muted">Découvrez d’autres pièces dans la boutique.</p>';
      } catch {}
    }

    let q = 1;
    let selectedSize = '';
    const qRoot = root.querySelector('[data-q]');
    const sizeButtons = [...root.querySelectorAll('[data-size]')];
    const sizeHint = root.querySelector('[data-size-hint]');
    sizeButtons.forEach((button) => button.addEventListener('click', () => {
      selectedSize = button.dataset.size || '';
      sizeButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle('is-selected', active);
        item.setAttribute('aria-checked', String(active));
      });
      if (sizeHint) {
        sizeHint.textContent = `Taille ${selectedSize} sélectionnée.`;
        sizeHint.classList.remove('is-error');
      }
    }));
    const syncQ = () => { qRoot.textContent = q; };
    root.querySelector('[data-inc]').onclick = () => { q = Math.min(stock > 0 ? stock : 99, q + 1); syncQ(); };
    root.querySelector('[data-dec]').onclick = () => { q = Math.max(1, q - 1); syncQ(); };
    const add = () => {
      if (stock < 1) return;
      if (p.cat === 'Mode' && !selectedSize) {
        if (sizeHint) {
          sizeHint.textContent = 'Veuillez choisir une taille.';
          sizeHint.classList.add('is-error');
        }
        sizeButtons[0]?.focus();
        return;
      }
      MAELIE.add(p.id, Math.min(q, stock), selectedSize);
    };
    root.querySelector('[data-add-product]').onclick = add;
    root.querySelector('[data-sticky-add]').onclick = add;

    const favBtn = root.querySelector('[data-fav]');
    if (favBtn) favBtn.addEventListener('click', (event) => {
      // Évite le double traitement avec le gestionnaire global des cartes produit.
      event.stopPropagation();
      const active = favBtn.getAttribute('aria-pressed') === 'true';
      const next = !active;
      favBtn.setAttribute('aria-pressed', String(next));
      favBtn.classList.toggle('is-active', next);
      favBtn.classList.remove('fav-adding', 'fav-removing');
      void favBtn.offsetWidth;
      favBtn.classList.add(next ? 'fav-adding' : 'fav-removing');
      favBtn.textContent = next ? '♥' : '♡';
      favBtn.setAttribute('aria-label', next ? 'Retirer des favoris' : 'Ajouter aux favoris');
      if (typeof MAELIE.toggleFav === 'function') MAELIE.toggleFav(p.id);
      else if (typeof MAELIE.fav === 'function') MAELIE.fav(p.id);
      if (typeof MAELIE.toast === 'function') MAELIE.toast(next ? `${p.name} a été ajouté aux favoris.` : `${p.name} a été retiré des favoris.`);
    });

    const lightbox = root.querySelector('[data-product-lightbox]');
    const openLightbox = () => { lightbox.hidden = false; lightbox.setAttribute('aria-hidden','false'); document.body.classList.add('product-lightbox-open'); root.querySelector('[data-product-zoom-close]').focus(); };
    const closeLightbox = () => { lightbox.hidden = true; lightbox.setAttribute('aria-hidden','true'); document.body.classList.remove('product-lightbox-open'); };
    root.querySelector('[data-product-zoom-open]').onclick = openLightbox;
    root.querySelector('[data-product-zoom]').querySelector('img').onclick = openLightbox;
    root.querySelector('[data-product-zoom-close]').onclick = closeLightbox;
    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !lightbox.hidden) closeLightbox(); }, { once: false });
  };
  (window.MAELIE_PRODUCTS_READY || Promise.resolve()).then(boot);
})();
