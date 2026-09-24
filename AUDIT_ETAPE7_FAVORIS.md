# MAELIE — Étape 7 — Favoris premium

## Réalisé
- Page favoris renforcée : résumé, filtres, sélection, recommandations.
- Filtres horizontaux sur mobile, sans barre de défilement visible.
- Bouton d'ajout groupé limité aux produits disponibles.
- Cartes favoris adaptées aux petits écrans.
- Micro-interactions et survols conservant `prefers-reduced-motion`.
- Correction d'un défaut dans `MAELIE.qty()` qui utilisait une variable produit non définie.
- Ajout d'un garde-fou : un produit épuisé ne peut plus être ajouté au panier via `MAELIE.add()`.

## Contrôles
- `node --check js/core.js` : OK
- `node --check js/favorites.js` : OK
- `node --check maelie-v2.js` : OK
