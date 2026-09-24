(() => {
  const render = () => {

  const g = document.querySelector("[data-home-products]");
  if (g) g.innerHTML = MAELIE_PRODUCTS.slice(0, 4).map(MAELIE.card).join("");
  const cats = document.querySelector("[data-home-cats]");
  if (cats)
    cats.innerHTML = [
      ["Mode", "Silhouettes pensées pour vous", "Mode"],
      ["Bijoux", "Les détails qui changent tout", "Bijoux"],
      ["Maison", "Créer une ambiance douce", "Maison"],
      ["Coffrets", "À offrir, à partager, à aimer", "Coffrets"],
    ]
      .map(
        (x, i) =>
          `<a class="category" href="boutique.html?cat=${encodeURIComponent(x[2])}"><span class="eyebrow">0${i + 1}</span><h3>${x[0]}</h3><span>${x[1]}</span></a>`,
      )
      .join("");
  };
  (window.MAELIE_PRODUCTS_READY || Promise.resolve()).then(render);
})();
