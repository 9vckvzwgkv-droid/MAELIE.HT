(() => {
  const boot = () => {
  const root = document.querySelector('[data-favorites]');
  if (!root || !window.MAELIE || !window.MAELIE_PRODUCTS) return;

  let filter = 'Tous';

  const getItems = () => {
    const ids = MAELIE.favs();
    return MAELIE_PRODUCTS.filter((p) => ids.includes(Number(p.id)));
  };

  const getRecommendations = (items) => {
    const favoriteIds = new Set(items.map((p) => Number(p.id)));
    const favoriteCats = new Set(items.map((p) => p.cat));
    return MAELIE_PRODUCTS
      .filter((p) => !favoriteIds.has(Number(p.id)))
      .sort((a, b) => Number(favoriteCats.has(b.cat)) - Number(favoriteCats.has(a.cat)))
      .slice(0, 4);
  };

  const renderCardGrid = (items, emptyMessage = '') => {
    if (!items.length) {
      return `<div class="fav-empty-inline">
        <span class="fav-empty-inline-icon">♡</span>
        <strong>${emptyMessage || 'Aucune pièce dans cette catégorie'}</strong>
        <span>Choisissez une autre catégorie ou découvrez nos collections.</span>
      </div>`;
    }
    return `<div class="product-grid fav-products-scroll">${items.map((p) => MAELIE.card(p)).join('')}</div>`;
  };

  const render = () => {
    const items = getItems();
    const categories = ['Tous', ...new Set(items.map((p) => p.cat))];
    if (!categories.includes(filter)) filter = 'Tous';
    const visible = filter === 'Tous' ? items : items.filter((p) => p.cat === filter);
    const recommendations = getRecommendations(items);
    const totalValue = items.reduce((sum, p) => sum + Number(p.price || 0), 0);

    root.innerHTML = `
      <div class="fav-page" data-favorites-page>
        <div class="fav-intro">
          <div>
            <span class="eyebrow">Votre sélection personnelle</span>
            <h2>Les pièces que vous aimez.</h2>
            <p>Retrouvez ici vos coups de cœur et gardez-les de côté avant de vous décider.</p>
          </div>
          <div class="fav-intro-mark" aria-hidden="true">♡</div>
        </div>

        <div class="fav-overview">
          <div class="fav-overview-item"><span>Favoris</span><strong>${items.length}</strong></div>
          <div class="fav-overview-item"><span>Catégories</span><strong>${new Set(items.map((p) => p.cat)).size}</strong></div>
          <div class="fav-overview-item"><span>Valeur de la sélection</span><strong>${MAELIE.money(totalValue)}</strong></div>
        </div>

        <div class="fav-toolbar-new">
          <div class="fav-filters" role="tablist" aria-label="Filtrer les favoris">
            ${categories.map((cat) => `<button type="button" class="fav-filter-btn ${filter === cat ? 'active' : ''}" data-filter="${cat}">${cat}</button>`).join('')}
          </div>
          ${items.length ? `<div class="fav-toolbar-actions">
            <button class="btn btn-soft" type="button" data-add-all>Ajouter les disponibles au panier</button>
            <button class="fav-clear" type="button" data-clear-favs>Vider les favoris</button>
          </div>` : ''}
        </div>

        <section class="fav-section">
          <div class="fav-section-heading">
            <div><span class="eyebrow">Ma sélection</span><h2>${filter === 'Tous' ? 'Mes coups de cœur' : filter}</h2></div>
            <span class="fav-result-count">${visible.length} ${visible.length > 1 ? 'pièces' : 'pièce'}</span>
          </div>
          ${items.length ? renderCardGrid(visible, 'Aucune pièce dans cette catégorie') : `
            <div class="fav-empty-main">
              <div class="fav-empty-art">♡</div>
              <span class="eyebrow">Votre sélection est vide</span>
              <h2>Commencez votre liste de favoris</h2>
              <p>Lorsque vous trouverez une pièce qui vous plaît, appuyez sur le cœur pour la conserver ici.</p>
              <a class="btn btn-primary" href="boutique.html">Découvrir la boutique</a>
            </div>`}
        </section>

        <section class="fav-discovery">
          <div class="fav-section-heading">
            <div><span class="eyebrow">À découvrir</span><h2>${items.length ? 'Dans le même esprit' : 'Quelques idées pour vous'}</h2></div>
            <a class="fav-see-all" href="boutique.html">Voir toute la boutique →</a>
          </div>
          ${renderCardGrid(recommendations)}
        </section>
      </div>`;
  };

  root.addEventListener('click', (event) => {
    const filterButton = event.target.closest('[data-filter]');
    if (filterButton) {
      filter = filterButton.dataset.filter;
      render();
      return;
    }
    if (event.target.closest('[data-clear-favs]')) {
      MAELIE.setFavs([]);
      filter = 'Tous';
      MAELIE.toast('Vos favoris ont été vidés.');
      return;
    }
    if (event.target.closest('[data-add-all]')) {
      const items = getItems();
      const available = items.filter((p) => Number(p.stock) > 0);
      available.forEach((p) => MAELIE.add(p.id));
      if (!items.length) return;
      const unavailable = items.length - available.length;
      MAELIE.toast(unavailable ? `${available.length} pièce${available.length > 1 ? 's' : ''} ajoutée${available.length > 1 ? 's' : ''} · ${unavailable} indisponible${unavailable > 1 ? 's' : ''}.` : `${available.length} pièce${available.length > 1 ? 's' : ''} ajoutée${available.length > 1 ? 's' : ''} au panier.`);
    }
  });

  window.addEventListener('maelie:favs', render);
  render();
  };
  (window.MAELIE_PRODUCTS_READY || Promise.resolve()).then(boot);
})();
