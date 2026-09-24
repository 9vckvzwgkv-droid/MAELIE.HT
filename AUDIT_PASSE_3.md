# MAELIE — Passe 3

## Corrections et ajouts

- Catalogue frontend synchronisé avec `/api/products` / SQLite, avec fallback statique hors serveur.
- Correction du seed `porte-cartes`.
- Réservation de stock pour les paiements Stripe, restauration sur session expirée/échouée et traitement webhook idempotent.
- Endpoints contact et newsletter avec stockage SQLite et envoi SMTP optionnel.
- Réinitialisation de mot de passe avec token hashé, expiration 30 min et réponse anti-énumération.
- Recherche accent-insensible et tolérante aux petites fautes.
- Affichage du stock sur les fiches produits et blocage de l’ajout si épuisé.
- Produits récemment consultés.
- Focus clavier visible, `prefers-reduced-motion`, états disabled.
- Favicon/theme-color contrôlés sur les pages.
- Variables SMTP ajoutées à `.env.example`.
- Dépendance `nodemailer` ajoutée.

## À configurer avant production

- `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- Stripe : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_COUPON_ID`
- E-mails : `SMTP_*`, `MAIL_FROM`, `CONTACT_EMAIL`
- `PUBLIC_URL`
- Informations légales réelles

## Tests statiques

- Tous les JS sont re-vérifiés par `node --check`.
- Les liens vers fichiers locaux sont contrôlés.
- Les doublons d'ID sont contrôlés.
- Le serveur doit être lancé avec `npm install` puis `npm start` pour les tests d'intégration navigateur/API.

- Historique des statuts de commande ajouté.
- E-mails transactionnels de changement de statut ajoutés (SMTP optionnel).
- Script de sauvegarde SQLite `npm run backup` ajouté.
- `sitemap.xml` ajouté avec placeholder de domaine à remplacer.
