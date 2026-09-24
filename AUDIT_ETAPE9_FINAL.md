# MAELIE — Étape 9 : Performance & audit final

## Optimisation réalisée
- Conversion de `img/logo.png` en `img/logo.webp` (qualité 88), visuellement équivalent et beaucoup plus léger.
- Toutes les références HTML/CSS/JS au logo principal ont été basculées vers WebP.
- Le PNG original est conservé dans le projet pour sécurité/rétrocompatibilité, mais n'est plus chargé par le site.

## Contrôles
- 24 pages HTML contrôlées.
- 21 fichiers JavaScript : syntaxe Node validée sans erreur.
- 0 lien HTML local manquant détecté.
- `sitemap.xml` et `robots.txt` présents.
- Aucune balise `<img>` sans attribut `alt` détectée dans les pages HTML.
- Aucune règle `@import` CSS détectée.
- Support `prefers-reduced-motion` présent.
- Logo footer protégé contre les déformations de ratio.

## Résultat
Le site conserve son comportement et son design de l'étape 8, avec une ressource logo fortement optimisée et un dernier contrôle des liens, scripts et éléments d'accessibilité.
