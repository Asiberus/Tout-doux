# 0004 — Pas de schéma d'API généré

- **Statut** : accepté
- **Date** : inconnue — décision **par défaut**, jamais prise explicitement. Le stub
  `openapi.yaml` date de 2021-06 (`fd81c71`) et n'a jamais été repris.

## Contexte

`openapi.yaml`, à la racine du monorepo, contient 13 lignes : un `info`, un `servers` commenté,
et un seul chemin `/project` avec une réponse `200` sans schéma. Il ne décrit pas l'API réelle,
n'est lu par aucun outil, et n'est référencé par aucun script.

DRF sait générer un schéma (`generateschema`, ou `drf-spectacular`). Rien de tel n'est installé.
Côté client, les types du contrat sont **écrits à la main** dans `frontend/src/models/` — voir
[`../../../frontend/docs/adr/0003-hand-written-api-models.md`](../../../frontend/docs/adr/0003-hand-written-api-models.md).

## Décision

**Le contrat d'API est documenté en prose, pas généré.** La référence est la table de
[../architecture/api-surface.md](../architecture/api-surface.md), maintenue à la main, complétée
par [../architecture/serializers.md](../architecture/serializers.md) pour la forme des corps.

`openapi.yaml` est considéré comme **mort**. Il n'est pas encore supprimé —
[R7](../quality/refactoring-backlog.md).

## Alternatives écartées

- **`drf-spectacular`** — le candidat sérieux, et il reste ouvert. Écarté aujourd'hui pour une
  raison précise : la convention
  [0001](0001-serializer-per-action.md) fait qu'un endpoint d'écriture **répond avec un autre
  sérialiseur que celui qu'il déclare** (`to_representation` délègue). Un générateur documente
  le sérialiseur déclaré, donc **la réponse serait fausse sur les 12 endpoints d'écriture**,
  sauf à annoter chacun d'eux à la main. Le gain net est bien plus faible qu'il n'y paraît.
- **`generateschema` de DRF** — même problème, avec en plus une couverture partielle des
  `@action`.
- **Générer les types TypeScript du front depuis le schéma** — sans schéma fiable, sans objet.

## Conséquences

- **Une divergence entre le backend et `frontend/src/models/` ne peut être détectée que par
  l'usage**, à l'exécution. C'est le risque assumé côté client (son ADR 0003).
- La table d'endpoints doit être mise à jour **manuellement et dans le même commit** que tout
  changement de route. C'est la règle la plus fragile de cette doc, et c'est pourquoi elle est
  rappelée dans [`../../CLAUDE.md`](../../CLAUDE.md) et dans la commande de synchronisation.
- L'API browsable de DRF reste la seule exploration interactive disponible — voir
  [../workflows/verification.md](../workflows/verification.md).

## Réouverture

Ce choix mérite d'être rouvert si l'une de ces conditions apparaît : un second client de l'API,
un consommateur externe, ou un besoin de génération de types côté front. Dans ce cas, annoter
les 12 endpoints d'écriture avec `@extend_schema(responses=…)` est le préalable, pas un détail.

## Preuve

`openapi.yaml` (13 lignes, jamais modifié depuis 2021-06). Absence vérifiée de
`drf-spectacular`, `drf-yasg` et `coreapi` dans `backend/requirements.txt`.
