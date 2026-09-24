# Audit et corrections MAELIE — 22/09/2026

## Étape 1 — Structure et intégrité
- 17 pages existantes contrôlées.
- Références HTML locales contrôlées : aucune ressource locale manquante détectée.
- JavaScript contrôlé avec `node --check` : aucune erreur de syntaxe détectée.
- Double `id="top"` supprimé sur les pages concernées.
- Catalogue statique et catalogue serveur comparés : 18 produits cohérents.
- Entrée serveur `Porte-cartes Nacre` corrigée.

## Étape 2 — Header, navigation et recherche
- Mise en évidence automatique de la page active dans la navigation.
- `aria-current="page"` ajouté automatiquement à la page courante.
- Recherche globale conservée et contrôlée statiquement.
- Compteurs panier/favoris conservés.

## Étape 3 — Boutique, produit, panier et favoris
- Structure et scripts contrôlés.
- Panier : validation serveur des produits, quantités et stocks déjà présente.
- Code `MAELIE10` recalculé côté serveur pour les commandes directes.
- Aucun lien local manquant détecté.

## Étape 4 — Commande et paiement
- Endpoint public `/api/config` ajouté pour détecter Stripe.
- Checkout Stripe rendu optionnel : si Stripe est configuré, le client est redirigé vers Stripe Checkout ; sinon le mode de commande local continue de fonctionner.
- Commandes Stripe créées en attente et confirmées par webhook avant décrément du stock.
- Webhook `checkout.session.completed` rendu fonctionnel et idempotent pour les commandes déjà payées.
- `STRIPE_COUPON_ID` ajouté pour synchroniser le code `MAELIE10` avec Stripe.

## Étape 5 — Compte et suivi
- Compte client conservé avec JWT/bcrypt.
- Endpoint `/api/orders/track` ajouté.
- Page de suivi connectée à la base de commandes.
- Sorties du suivi échappées pour éviter l'injection HTML.
- Retour après paiement Stripe pris en compte sur le compte client.

## Étape 6 — Administration et sécurité
- Validation plus stricte de la création des produits admin.
- Mise à jour du statut d'une commande inexistante renvoie maintenant une erreur 404.
- Sorties admin échappées avant insertion dans le HTML.
- Headers de sécurité existants conservés.
- Rate limiting de l'authentification conservé.
- Route 404 ajoutée pour les pages et l'API.

## Étape 7 — Pages secondaires et SEO
- Meta descriptions ajoutées aux pages qui en étaient dépourvues.
- Page 404 ajoutée.
- Footer légal et bouton « Retour en haut » présents sur les pages contrôlées.
- README mis à jour pour supprimer l'ancienne mention d'un script `db:seed` inexistant.

## Étape 8 — Pages légales
Les pages existent, mais les informations d'identification du vendeur/hébergeur sont volontairement laissées à compléter : elles dépendent de données réelles qui ne peuvent pas être inventées (identité, adresse, SIREN/SIRET, RCS, hébergeur, etc.).

## Étape 9 — Responsive
La structure CSS responsive existante a été conservée sans refonte visuelle destructive. Une validation pixel-perfect sur navigateur réel reste à faire après installation des dépendances, car l'environnement d'analyse ne dispose pas des dépendances npm du projet.

## Étape 10 — Validation finale
- Syntaxe JS : OK.
- Références locales : OK.
- Cohérence catalogue statique/serveur : OK.
- Installation/runtime complet : non exécuté ici, car `npm install` a dépassé le délai disponible dans l'environnement d'analyse.
- Stripe réel : nécessite les clés Stripe et le secret webhook réels.
- Données légales : nécessitent les informations réelles du propriétaire de MAELIE.

### Avant mise en ligne réelle
1. Remplir les mentions légales/CGV/confidentialité avec les vraies informations.
2. Créer un `.env` à partir de `.env.example` avec des secrets réels et ne jamais le publier.
3. Tester Stripe en mode test avec son webhook HTTPS.
4. Effectuer une recette navigateur sur mobile et desktop.
5. Sauvegarder régulièrement `data/maelie.sqlite` en production.
