# 0001 — Un sérialiseur par action, et une réponse dans une autre forme que l'entrée

- **Statut** : accepté
- **Date** : 2023-02 (`5b918f9`, `refactor: create list serializer for project and collection`)

## Contexte

Au départ, chaque ressource avait un sérialiseur unique. Trois besoins l'ont fait éclater :

1. la liste des projets devait porter des compteurs (`taskCount`, `completedTaskCount`,
   `eventsToCome`) inutiles et coûteux au détail ;
2. le détail devait imbriquer sections, tâches et événements, inutiles en liste ;
3. l'écriture devait accepter `tagIds`, `projectId` — des champs qui n'ont aucun sens en
   lecture, et qu'un sérialiseur unique aurait exposés ou obligé à marquer `write_only` un par
   un.

## Décision

**Un sérialiseur par couple (ressource, action)**, sélectionné par `get_serializer_class()`
selon `self.action`. Les suffixes (`List`, `Detail`, `Extended`, `Post`, `Patch`, `PostOrPatch`)
sont normalisés — voir [../architecture/serializers.md](../architecture/serializers.md).

Corollaire assumé : **les sérialiseurs d'écriture répondent avec la forme de lecture**, via
`to_representation()`. Le contrat d'entrée et le contrat de sortie d'un même endpoint sont donc
deux objets différents.

Les formes de lecture héritent de `ReadOnlyModelSerializer` (`serializers/common.py`), dont
`create()` et `update()` sont neutralisés : un sérialiseur de lecture ne peut pas écrire, même
utilisé par erreur.

## Alternatives écartées

- **Un sérialiseur unique avec `write_only` / `read_only` par champ** — rejeté : le nombre de
  champs conditionnels explose (`ProjectDetail` en a 3 de plus que `ProjectList`, qui en a 3 de
  plus que la forme canonique), et rien n'empêche alors une fuite en lecture.
- **`fields` dynamique selon le contexte** (le pattern `DynamicFieldsModelSerializer` de la doc
  DRF) — rejeté : déplace la complexité dans une indirection à l'exécution, illisible pour
  savoir ce qu'un endpoint renvoie réellement.
- **Deux endpoints séparés au lieu de deux sérialiseurs** — partiellement retenu : c'est ce que
  font `project/detailed/` et `collection/detailed/`, qui existent **en plus** du détail par
  `pk` parce que le client veut la forme détaillée pour une liste entière.

## Conséquences

- 41 fichiers de sérialiseurs pour 12 modèles. C'est le coût principal.
- Le contrat d'API n'est lisible nulle part d'un seul coup d'œil — d'où
  [../architecture/api-surface.md](../architecture/api-surface.md) et
  [0004](0004-no-openapi-schema.md).
- Les règles métier sont dupliquées entre `*Post` et `*Patch` quand elles sont proches : c'est
  l'origine des 13 contrôles d'appartenance copiés-collés, dont le bug
  [R1](../quality/refactoring-backlog.md).
- L'héritage entre sérialiseurs de ressources différentes crée un cycle d'imports réel —
  voir [../architecture/overview.md](../architecture/overview.md).

## Preuve

`5b918f9` introduit `ProjectListSerializer` et `CollectionListSerializer` en scindant l'existant.
La convention de suffixes n'est écrite nulle part dans le code ; elle est **inférée** de sa
régularité sur 41 fichiers (2 exceptions de nommage seulement, `UserAccountState` et
`UserChangePassword`).
