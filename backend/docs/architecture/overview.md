# Vue d'ensemble

Projet Django **mono-application**. `backend/backend/` porte la configuration (settings, URLs
racine, WSGI/ASGI) ; **toute** la logique vit dans l'application unique `backend/tout_doux/`.
Aucun découpage en apps par domaine n'a été fait, et il n'y en a pas besoin à cette taille.

## Couches

```
tout_doux/urls.py            routeur DRF + 13 routes explicites   → api-surface.md
tout_doux/views/             12 modules, 1 par ressource          → api-surface.md
tout_doux/serializers/       41 modules, 1 par (ressource, action) → serializers.md
tout_doux/models/            12 modèles                           → data-model.md
tout_doux/migrations/        4 migrations, font foi sur le schéma
```

Briques transverses, toutes **feuilles** du graphe de dépendances :

| Chemin                           | Rôle                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------- |
| `tout_doux/auth/`                | `EmailBackend` (auth par e-mail), `EmailPasswordAuthentication` (login JSON) → [auth.md](auth.md) |
| `tout_doux/permissions/`         | Une seule classe : `CreateOrAdmin`, utilisée par `FeedbackViewSet`                                |
| `tout_doux/validators/`          | 3 validateurs de mot de passe branchés dans `AUTH_PASSWORD_VALIDATORS`                            |
| `tout_doux/utils/`               | `token.py` (uid base64 + jetons Django), `date.py` (`daterange`, `now_plus_one_week`)             |
| `tout_doux/services/`            | `EmailService` — 4 e-mails de cycle de vie de compte → [auth.md](auth.md)                         |
| `tout_doux/pagination.py`        | `ExtendedPageNumberPagination` → [api-surface.md](api-surface.md)                                 |
| `tout_doux/management/commands/` | `wait_for_db`, `backupdb` → [../workflows/development.md](../workflows/development.md)            |
| `tout_doux/templates/email/`     | 4 templates HTML                                                                                  |

Sens des dépendances : `urls → views → serializers → models`. `services` et `utils` sont
appelés depuis les vues **et** les sérialiseurs. Aucune couche ne remonte.

## Règles

| Règle                                                                                                   | Statut                                                                            |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Chaque package expose son contenu via un barrel `__init__.py`                                           | DISCIPLINE (16 barrels ; `serializers/__init__.py` est vide, c'est le seul écart) |
| **Import inter-package** : passer par le barrel (`from tout_doux.serializers.tag import TagSerializer`) | DISCIPLINE — 1 écart, voir ci-dessous                                             |
| **Import intra-package** : viser le module concret (`from .project import ProjectSerializer`)           | DISCIPLINE — imposé par les cycles, voir ci-dessous                               |
| Les modèles s'importent entre eux **par module concret**, jamais par `tout_doux.models`                 | DISCIPLINE (respecté : 12/12)                                                     |
| Vues et sérialiseurs importent les modèles **par le barrel** `tout_doux.models`                         | DISCIPLINE (respecté)                                                             |
| Un fichier = un sérialiseur, nommé d'après lui                                                          | DISCIPLINE (respecté : 41/41)                                                     |

⚠️ **Aucune de ces règles n'est vérifiée par quoi que ce soit.** Il n'y a ni linter, ni
formateur, ni vérificateur de types, ni CI sur `backend/` — voir
[../workflows/verification.md](../workflows/verification.md) et
[../quality/watched-risks.md](../quality/watched-risks.md).

## Contraintes non évidentes

### Le graphe des sérialiseurs contient un cycle réel

`project → section → project` : `serializers/section/section.py:3` importe
`tout_doux.serializers.project`, et `serializers/project/project_detail.py:4` importe
`tout_doux.serializers.section`.

Ça ne casse aujourd'hui **que grâce à l'ordre des lignes** de
`serializers/project/__init__.py` : `.project` y est importé **avant** `.project_detail`, donc
quand `section.py` réclame `ProjectSerializer`, le nom est déjà lié dans le module
partiellement initialisé.

Vérifié : importer le barrel `section` **en premier** lève une erreur.

```
>>> from tout_doux.serializers.section import SectionTasksSerializer
ImportError: cannot import name 'SectionTasksSerializer' from partially initialized
module 'tout_doux.serializers.section' (most likely due to a circular import)
```

L'application démarre parce que `views/__init__.py` importe `.collection` avant `.section`, et
que cette chaîne atteint `project/__init__` en premier. **Ne pas réordonner les lignes d'un
barrel de `serializers/`, et ne pas ajouter d'import de `project` dans un module chargé tôt.**
Item ouvert : [../quality/refactoring-backlog.md](../quality/refactoring-backlog.md) R8.

### Le seul écart à la règle de barrel est dans un fichier qui fait les deux

`serializers/event/event_post_or_patch.py` importe son voisin de deux façons dans deux lignes
consécutives (6 et 7) : `from tout_doux.serializers.event import EventExtendedSerializer` (barrel,
intra-package) puis `from tout_doux.serializers.event.event import EventSerializer` (module
concret). Le premier est l'écart. Il fonctionne parce que `event/__init__.py` liste
`.event_extended` avant `.event_post_or_patch`. Même fragilité que ci-dessus.

### `tests.py` n'est pas un fichier de tests

`tout_doux/tests.py` est le squelette généré par `startapp`, jamais rempli. Il n'y a
**aucun** test dans le dépôt.

## Décisions négatives

- **Pas de découpage en plusieurs apps Django.** Une seule app pour 12 modèles ; le découpage
  se fait par sous-package (`models/`, `serializers/`, `views/`). Redécouper en apps imposerait
  de renommer les tables ou d'écrire des migrations `db_table`, pour un gain nul à cette taille.
- **Pas de couche « service » métier.** La logique vit dans les sérialiseurs (validation,
  effets de bord dans `save()`/`update()`) et dans les vues (gardes de suppression).
  `services/` ne contient que l'envoi d'e-mails. Voir
  [adr/0001-serializer-per-action.md](../adr/0001-serializer-per-action.md).
- **Pas de `settings/` par environnement.** Un seul `settings.py`, tout paramétré par variables
  d'environnement — voir [../workflows/development.md](../workflows/development.md).

## Voir aussi

- [data-model.md](data-model.md) — les 12 modèles et leurs invariants
- [serializers.md](serializers.md) — la couche la plus dense du projet
- [api-surface.md](api-surface.md) — la table des endpoints
- [auth.md](auth.md) — identité, jetons, e-mails
- [../patterns/](../patterns/) — les recettes récurrentes
