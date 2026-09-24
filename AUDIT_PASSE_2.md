# MAELIE — Audit complet, seconde passe

Date : 22 septembre 2026

## Étape 1 — Structure et intégrité
- 18 pages HTML présentes, dont la page 404.
- Vérification des références locales `href`/`src` : aucune ressource locale manquante détectée.
- Vérification des identifiants HTML dupliqués : aucun doublon détecté.
- Syntaxe `server.js` et de tous les fichiers JavaScript contrôlée avec `node --check`.
- Favicon ajouté à toutes les pages HTML.

## Étape 2 — Sécurité serveur
- Correction d'un double incrément du compteur de limitation des tentatives d'authentification.
- Validation renforcée des modifications de produits dans l'API administrateur : id, nom, prix, ancien prix, stock et longueurs de champs.
- Une modification d'un produit inexistant renvoie désormais 404.
- Route de suivi publique ajoutée avec validation du numéro de commande et de l'e-mail.
- La route de suivi ne renvoie que le statut, le numéro et la date de la commande.
- Les protections admin existantes ont été conservées.

## Étape 3 — Parcours commande
- Contrôle des calculs serveur : prix, stock, remise MAELIE10 et seuil de livraison gratuite.
- Contrôle du paiement Stripe : la validation finale du stock reste côté serveur/webhook.
- Protection contre le double traitement d'un webhook déjà payé conservée.
- Le parcours local sans Stripe reste disponible pour les tests de démonstration.

## Étape 4 — Produit / UX
- Une URL produit inconnue n'affiche plus silencieusement le premier produit du catalogue : une page "Produit introuvable" est maintenant affichée.
- Les valeurs dynamiques affichées dans la fiche produit sont échappées avant insertion HTML.
- La recherche globale échappe déjà correctement les données affichées.

## Étape 5 — Suivi de commande
- La page `suivi-commande.html` appelait une API absente : `/api/orders/track` a été ajoutée.
- Recherche par numéro de commande + e-mail.
- Gestion des commandes inexistantes.

## Étape 6 — SEO / qualité générale
- Favicon ajouté à l'ensemble des pages.
- `robots.txt` ajouté avec exclusion de l'administration, des API et du dossier de données.
- Meta descriptions déjà présentes sur les pages et vérifiées.
- Page 404 déjà présente et utilisée par Express.

## Étape 7 — Tests techniques
- Syntaxe JavaScript : OK.
- Ressources locales : 0 manquante détectée.
- Pages HTML inspectées : 18.
- Favicon : 18/18 pages.
- Installation des dépendances npm tentée pour lancer un test serveur réel, mais le téléchargement des dépendances a dépassé le délai de l'environnement. Aucun faux résultat de test navigateur/serveur n'est donc déclaré.

## Points restant volontairement dépendants de tes informations
1. Remplacer les placeholders des mentions légales/CGV/confidentialité par les informations réelles de l'entreprise.
2. Configurer les vraies variables Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, éventuellement `STRIPE_COUPON_ID`, `PUBLIC_URL`).
3. Faire un test Stripe réel en mode test dans un environnement où les dépendances npm sont installées.
4. Le catalogue affiché côté navigateur repose encore sur `js/data.js` : les modifications faites depuis le back-office ne mettent pas automatiquement à jour ce fichier statique. Pour une boutique réellement administrable en production, la prochaine amélioration serait de faire consommer le catalogue par le front directement depuis `/api/products`.
5. Le formulaire de contact et la newsletter sont actuellement des interactions front-end de démonstration ; aucun envoi d'e-mail réel n'est configuré.

## Verdict de la seconde passe
La base est cohérente pour une démonstration e-commerce et plusieurs failles/ruptures fonctionnelles évidentes ont été corrigées. Le projet n'est pas déclaré "prêt pour production" tant que les informations légales, les secrets de production, Stripe réel et les derniers tests d'intégration ne sont pas configurés.
