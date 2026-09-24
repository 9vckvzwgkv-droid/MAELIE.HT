# MAELIE — Étape 10 : sécurité & stabilité

- En-têtes HTTP de sécurité renforcés : `Cross-Origin-Resource-Policy` et `Cross-Origin-Opener-Policy`.
- Réponses `/api/*` marquées `Cache-Control: no-store` afin d'éviter la mise en cache de données de compte, panier, commande ou administration.
- Limitation de débit ajoutée sur le suivi de commande, la création de commande et l'initialisation Stripe.
- Endpoint `/api/health` moins bavard en production : les indicateurs Stripe/SMTP/environnement ne sont exposés qu'en développement.
- Vérification syntaxique de `server.js` : OK.
- Vérification syntaxique des scripts navigateur : OK.
- Les tests d'exécution HTTP du serveur nécessitent l'installation des dépendances npm (`npm install`) et n'ont pas été exécutés dans l'environnement de build.
