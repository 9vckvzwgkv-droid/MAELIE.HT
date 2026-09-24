# MAELIE — Passe préparation production

## Corrections apportées

### Sécurité serveur
- Validation renforcée des secrets et de `PUBLIC_URL` en production.
- HSTS activé en production.
- `Permissions-Policy` ajoutée.
- Support optionnel de `TRUST_PROXY=true` pour un reverse proxy.
- Désactivation du checkout de démonstration `/api/orders` en production.
- Les prix et stocks restent recalculés côté serveur.
- Échappement HTML des données utilisateur dans les e-mails de contact et de réinitialisation.

### Stripe / paiements
- Webhook rendu idempotent.
- Vérification de la devise EUR.
- Vérification du montant Stripe par rapport au total de la commande.
- Prise en charge du succès des paiements asynchrones.
- Une commande n'est marquée payée que lorsque le paiement est confirmé.
- Les expirations/échecs libèrent le stock réservé.

### Commandes
- Transitions de statut contrôlées côté serveur.
- Historique des statuts conservé.
- Annulation/remboursement avec restitution du stock réservé lorsque nécessaire.
- Route de démonstration de commande désactivée en production.

### Administration
- Tableau de bord amélioré.
- CA encaissé séparé des remboursements.
- Modification directe du nom, de la catégorie, du prix, du stock et de l'état actif des produits.
- Gestion des messages de contact.
- Transitions de commande cohérentes.

### Newsletter / contact
- Désabonnement newsletter ajouté.
- Messages de contact consultables et classables depuis l'administration.

### Sauvegardes
- Checkpoint SQLite WAL avant copie.
- Rotation automatique des sauvegardes avec `BACKUP_RETENTION`.

### Vérifications statiques
- 18 pages HTML contrôlées.
- 0 ressource locale manquante.
- 0 ID HTML dupliqué détecté.
- Tous les JavaScript passent `node --check`.

## Limite de validation
L'installation des dépendances npm n'a pas pu être terminée dans l'environnement d'audit (délai réseau). Aucun lancement serveur réel ni paiement Stripe réel n'est donc présenté comme validé.

Le test final doit être exécuté sur la machine/hébergement cible avec les vraies dépendances et les vraies clés Stripe en mode test.
