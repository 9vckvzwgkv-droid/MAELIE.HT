# MAELIE — checklist de test en conditions de production

## 1. Préparation
- [ ] Node.js 20+ installé
- [ ] `npm ci` terminé sans erreur
- [ ] `.env` créé à partir de `.env.example`
- [ ] `NODE_ENV=production`
- [ ] `PUBLIC_URL` utilise HTTPS
- [ ] `JWT_SECRET` aléatoire >= 32 caractères
- [ ] vrai compte administrateur configuré
- [ ] `.env` non versionné

## 2. Base de données
- [ ] démarrage sur une base vierge
- [ ] 18 produits initialisés
- [ ] sauvegarde `npm run backup`
- [ ] rotation des sauvegardes vérifiée
- [ ] restauration d'une copie testée

## 3. Parcours client
- [ ] inscription
- [ ] connexion
- [ ] déconnexion
- [ ] mot de passe oublié
- [ ] recherche
- [ ] fiche produit
- [ ] favori
- [ ] panier
- [ ] coupon MAELIE10
- [ ] livraison gratuite à partir de 80 € après remise
- [ ] checkout

## 4. Stripe
- [ ] clé secrète de test configurée
- [ ] webhook HTTPS configuré
- [ ] signature webhook validée
- [ ] paiement réussi
- [ ] paiement annulé
- [ ] paiement échoué
- [ ] webhook reçu deux fois sans double traitement
- [ ] stock restauré lors d'une expiration/échec

## 5. Administration
- [ ] accès client refusé
- [ ] modification produit
- [ ] modification stock
- [ ] activation/désactivation produit
- [ ] transition de commande valide
- [ ] transition invalide refusée
- [ ] messages de contact
- [ ] CA encaissé correct
- [ ] remboursements exclus du CA encaissé

## 6. Sécurité
- [ ] HTTPS actif
- [ ] secrets non exposés
- [ ] API admin inaccessible sans rôle admin
- [ ] prix recalculés côté serveur
- [ ] stock vérifié côté serveur
- [ ] accès aux commandes limité au propriétaire
- [ ] rate limiting testé
- [ ] erreurs serveur sans informations sensibles

## 7. Responsive / accessibilité
- [ ] 320 px
- [ ] 375 px
- [ ] 425 px
- [ ] 768 px
- [ ] 1024 px
- [ ] 1440 px
- [ ] 1920 px
- [ ] clavier uniquement
- [ ] focus visible
- [ ] aucune barre horizontale involontaire

## 8. Mise en ligne
- [ ] reverse proxy configuré
- [ ] HTTPS renouvelable
- [ ] domaine configuré
- [ ] sauvegardes planifiées
- [ ] logs surveillés
- [ ] monitoring `/api/health`
- [ ] informations légales réelles renseignées
