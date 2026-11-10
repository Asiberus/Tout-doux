# 0008 — Réordonner les listes avec `@dnd-kit`

- **Statut** : accepté
- **Date** : 2026-09

## Contexte

Les tâches et les daily tasks ont un ordre manuel, décidé par le serveur (clé `position`,
déplacement par ancres). Il faut un geste pour le changer à la souris, au doigt et au clavier,
avec une carte soulevée et des voisines qui s'écartent sans à-coup.

## Décision

`@dnd-kit/vue`, `@dnd-kit/dom` et `@dnd-kit/abstract` en 0.5.0 exacte, derrière les trois
composants de `src/components/sortable/`. Seul `dnd-kit.ts` touche aux internes de la
bibliothèque ; `dnd-kit.spec.ts` les interroge sur un vrai gestionnaire.

## Alternatives écartées

- **`vue-draggable-plus`** (SortableJS) : aucun support du clavier.
- **Pragmatic drag and drop** : il repose sur le glisser natif du navigateur, qui ne permet ni
  inclinaison ni style sur la carte glissée.
- **Une implémentation maison** : collisions en grille, défilement automatique et accessibilité à
  réécrire.

## Conséquences

- ~37 ko gzip dans le bundle principal, les routes n'étant pas découpées
  ([W7](../quality/watched-risks.md#w7--aucun-découpage-de-bundle)).
- Une bibliothèque en 0.x dont on lit des internes
  ([W15](../quality/watched-risks.md#w15--dnd-kit-en-0x-internes-utilisés)).

## Preuve

Spec `docs/superpowers/specs/2026-09-30-task-drag-and-drop-design.md` (racine du monorepo), et un
prototype mesuré dans le navigateur avant l'implémentation (p95 à 9 ms pendant un glisser).
