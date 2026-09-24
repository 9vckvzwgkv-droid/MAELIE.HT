# MAELIE — Version finale

Boutique e-commerce full-stack conservant l'identité MAELIE : rose poudré, beige, blanc, formes douces et expérience élégante.

## Inclus

- Accueil éditorial et catalogue enrichi
- Boutique avec recherche, filtres et tri
- Fiches produits
- Panier et favoris persistants
- Compte client + historique des commandes
- Checkout avec validation serveur
- Livraison gratuite dès 80 € et code MAELIE10
- API REST Express + SQLite
- Stock vérifié côté serveur
- Administration produits, stocks et commandes
- Stripe Checkout optionnel + webhook de confirmation
- Sécurité de base : JWT, bcrypt, validation, rate limiting, headers

## Installation

Node.js 20+ recommandé.

```bash
npm install
cp .env.example .env
npm start
```

Puis : http://localhost:3000

## Admin

Configurez `ADMIN_EMAIL` et `ADMIN_PASSWORD` dans `.env`.

## Stripe

Renseignez `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` et `PUBLIC_URL`. Le paiement utilise Stripe Checkout. En production, le webhook `/api/stripe/webhook` doit être exposé en HTTPS.

## Mise en production

Utiliser HTTPS, un secret JWT long et aléatoire, un vrai mot de passe admin, sauvegarder la base SQLite et placer l'application derrière un reverse proxy.


## Version nettoyée / responsive

Cette version regroupe les styles dans `css/maelie.css` et applique une stratégie responsive explicite pour desktop, tablette et mobile. Les scripts JavaScript restent séparés par fonctionnalité pour faciliter la maintenance.

### Structure
- `css/maelie.css` : styles consolidés + responsive
- `js/core.js` : panier, favoris, utilitaires communs
- `js/data.js` : catalogue de démonstration
- `js/shop.js` : boutique, recherche, filtres et tri
- `js/product.js` : fiche produit
- `js/cart.js` / `js/checkout.js` : panier et commande
- `js/account.js` / `js/admin.js` : compte et administration
- `js/navigation-drawer.js` : navigation mobile

### Vérifications techniques
Le catalogue de démonstration est initialisé automatiquement par `server.js` lors de la première création de la base SQLite. Il n'existe donc pas de commande `db:seed` dans le `package.json`.

## Nouvelles pages et fonctionnalités
- `aide.html` — aide et FAQ
- `collections.html` — univers et collections
- `blog.html` — journal éditorial MAELIE
- `suivi-commande.html` — interface de suivi de commande
- `cadeaux-personnalises.html` — personnalisation cadeau avec aperçu
- Recherche globale en temps réel dans l'en-tête, avec panneau latéral sur ordinateur et résultats intégrés sur mobile.


## Test production
Consultez `PRODUCTION_CHECKLIST.md` avant toute mise en ligne.
