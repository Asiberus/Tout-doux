# 0002 — Cloisonnement par queryset, pas par permission d'objet

- **Statut** : accepté
- **Date** : 2023-12 (`55b9424`, `chore(back): squash migrations for release v0.4`, qui
  introduit `UserRelatedModel` sur les 11 modèles)

## Contexte

L'application est née mono-utilisateur : aucun modèle ne portait de propriétaire. La release
v0.4 a rendu chaque donnée personnelle. Il fallait décider où poser la frontière entre comptes.

DRF propose deux mécanismes : `has_object_permission()` sur une classe de permission, ou la
restriction du queryset dans `get_queryset()`.

## Décision

**Tout passe par `get_queryset()`.** Chaque viewset renvoie `self.request.user.<related_name>`,
et `UserRelatedModel` (`models/user.py:20`) fabrique ce `related_name` automatiquement pour les
11 modèles concernés.

Deux compléments obligatoires, faute de quoi la protection est incomplète :
`HiddenField(CurrentUserDefault())` à la création, et un `validate_<champ>` par relation
entrante. La recette complète est dans
[../patterns/ownership-and-scoping.md](../patterns/ownership-and-scoping.md).

**Aucun `has_object_permission` n'existe dans le projet.**

## Alternatives écartées

- **`has_object_permission`** — rejeté : ne protège que `get_object()`. Les listes auraient dû
  être filtrées **en plus**, ce qui aurait fait deux mécanismes au lieu d'un, avec le risque
  classique d'en oublier un.
- **Un middleware ou un manager par défaut filtrant sur l'utilisateur courant** (variable de
  thread) — rejeté : rend le filtrage invisible à la lecture du code, et les migrations comme
  les commandes `manage.py` n'ont pas d'utilisateur courant.
- **Une app tierce de multi-tenancy** — hors de proportion pour un projet de cette taille.

## Conséquences

- **Un `pk` étranger renvoie 404, pas 403.** C'est voulu : l'existence même de l'objet n'est pas
  révélée. Les messages d'erreur des `validate_<champ>` imitent d'ailleurs l'erreur DRF « objet
  inexistant » plutôt que d'avouer un refus.
- **Le contrôle des relations entrantes est manuel et répété 13 fois.** C'est le point faible
  assumé du choix, et c'est là que s'est logé le bug
  [R1](../quality/refactoring-backlog.md) : il aurait été écrit une seule fois dans une
  permission d'objet.
- **`default=get_anonymous_user`** sur le champ `user` fait qu'un oubli de `HiddenField`
  n'échoue pas : la ligne est rattachée à un utilisateur fantôme. Surveillé en
  [W7](../quality/watched-risks.md).
- Trois vues sortent du cadre par nécessité (`feedback`, `user`, `preferences`) — chacune est
  justifiée dans le pattern.

## Preuve

`models/user.py:20` (la classe abstraite), et les 8 `get_queryset()` de `views/`. L'absence de
permission d'objet est vérifiable : aucune occurrence de `has_object_permission` dans
`backend/`. Le _pourquoi_ n'est écrit nulle part — **rationale inféré** de la forme du code et
de l'ordre des commits de la v0.4.
