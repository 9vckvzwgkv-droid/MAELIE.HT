# MAELIE — Audit final mobile

## Périmètre
- Travail limité au rendu mobile et aux éléments nécessaires au fonctionnement mobile.
- Seuil principal des nouvelles règles : `max-width: 700px`.
- Aucun travail de design desktop/tablette ajouté dans cette étape.

## Vérifications effectuées
- 24 pages HTML présentes.
- 24 pages contiennent le header et le footer attendus.
- CSS `css/maelie.css` : accolades équilibrées.
- Tous les fichiers JavaScript passent `node --check`.
- Header mobile : logo centré, menu à gauche, favoris + panier à droite, recherche sous le header.
- Menu mobile : recherche accessible depuis le drawer.
- Footer mobile : accordéons Boutique / Service / Mon espace, réseaux sociaux, mentions légales et retour en haut.
- Adaptations prévues pour les petits écrans jusqu'à 330 px.
- Aucun fichier image de marque supprimé.

## Important
La vérification visuelle finale doit idéalement être faite sur un vrai téléphone ou dans les DevTools avec plusieurs largeurs (390, 375, 360 et 330 px), car le rendu dépend du moteur de navigateur et des polices chargées.
