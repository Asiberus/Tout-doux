# 0007 — Ordre manuel par fractional indexing

- **Statut** : accepté
- **Date** : 2026-09

## Contexte

Les tâches d'une liste (tâches directes d'un projet, d'une section, d'une collection) et les
daily tasks d'un jour doivent pouvoir être réordonnées à la main, par glisser-déposer. L'ordre
doit être persistant, identique sur tous les écrans, et décidé par le serveur.

## Décision

Une clé texte `position` par ligne, générée par la bibliothèque `fractional-indexing` (0.1.3,
PyPI, compatible octet pour octet avec l'implémentation JS de référence de rocicorp). Entre deux
clés, il en existe toujours une troisième : un déplacement réécrit **une seule ligne**. La
colonne est en collation `C`. Le client envoie les voisins qu'il voit (`afterId`, `beforeId`) ;
le serveur vérifie qu'ils sont encore voisins, sous verrou de liste, et refuse en 409 sinon.

## Alternatives écartées

- **Entier dense avec décalage** — lisible et sans dépendance, mais un déplacement réécrit toutes
  les lignes entre l'ancienne et la nouvelle place, dans un ordre qui ne viole pas l'unicité.
- **Entier avec trous** — deux chemins de code, dont une renumérotation rare donc peu testée.
- **Flottant** — la précision s'épuise après une cinquantaine d'insertions au même endroit.
- **Tableau d'identifiants sur le parent** — donnée dénormalisée sur trois modèles, sans
  intégrité en base, triée en Python.
- **Liste chaînée** — lecture par CTE récursif, et un seul pointeur corrompu casse la liste.
- **`Meta.order_with_respect_to`** — une seule FK, or une tâche a trois conteneurs possibles.
- **`django-ordered-model`** — dernière version stable pour Django 3 et 4.
- **`fractional-indexing` 4.0.0** — publiée sur GitHub mais pas sur PyPI. Les clés Base62 sont
  identiques : la montée se fera sans effet sur les données quand elle y sera.

## Conséquences

- ✅ Un déplacement = un `UPDATE` d'une ligne ; création en tête ou en fin sans toucher aux autres.
- ✅ Une tâche décochée reprend sa place : sa clé n'a pas changé.
- ⚠️ Les clés s'allongent d'environ un caractère toutes les six insertions au même endroit.
  Voir [../quality/watched-risks.md](../quality/watched-risks.md) W14.
- ⚠️ Toute comparaison de clés doit être octet par octet : collation `C` en base, `<` natif en
  JS, jamais `localeCompare`.

## Preuve

`models/task.py`, `models/daily_task.py`, `services/ordering.py`, migrations 0010 à 0012.
