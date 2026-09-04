# Vue d'ensemble des couches

SPA mono-bundle : **une seule application**, pas de workspaces, pas de packages. Le découpage
structurant est en **couches** (`src/<couche>/`), pas en modules métier — sauf `src/views/`, qui
est découpé **par feature**.

## Carte des dépendances

Sens réel des imports, relevé sur `src/` (`grep` des imports `@/*` par dossier) :

```
config ─────────────┐
                    ▼
models ◄── utils ── axios ──► api ──► store ──► services
   ▲                                    ▲          │
   └──────────── views ◄── router ──────┘          │
                   ▲         │                     │
            components    layout ──────────────────┘
                             composables ──► api, store
```

| Couche         | Rôle                                                       | Importe                                 |
| -------------- | ---------------------------------------------------------- | --------------------------------------- |
| `config/`      | Lecture de la config runtime (balises `<meta>`)            | —                                       |
| `models/`      | Interfaces du contrat d'API, écrites à la main             | —                                       |
| `utils/`       | Fonctions pures de domaine (tri, prédicats temporels)      | `models`                                |
| `axios/`       | Transport : instance + intercepteurs + wrapper `http` typé | `config`, `services`, `router`          |
| `api/`         | Une fonction fine par endpoint                             | `axios`, `models`                       |
| `store/`       | État partagé Pinia                                         | `api`, `models`, `services`, `utils`    |
| `services/`    | Orchestration transverse — **`auth` uniquement**           | `api`, `models`, `store`                |
| `router/`      | Routes, guards, points d'entrée                            | `layout`, `views`, `services`, `store`  |
| `layout/`      | Coquilles applicatives (navbar, header)                    | `config`, `services`, `store`           |
| `components/`  | Composants partagés globalement                            | `api`, `composables`, `models`, `utils` |
| `views/`       | Features (9 zones) + composants partagés par domaine       | tout sauf `axios`, `config`, `router`   |
| `composables/` | `useDialogWidth`, `useAddTaskToDaily`                      | `api`, `store`                          |

## Règles

Toutes ces règles sont de la **DISCIPLINE** : `eslint.config.mjs` ne contient **aucune** règle de
frontière (pas de `no-restricted-imports`, pas de plugin `import`/`boundaries`). Rien ne les
vérifie — ni au commit, ni en CI. Voir [../workflows/verification.md](../workflows/verification.md).

1. **Un composant n'importe jamais `axios/`** — il passe par `api/` (respecté : zéro usage de
   `axiosInstance` hors de `src/axios/`).
2. **`api/` ne connaît ni le store ni les composants.** Une fonction d'API ne fait aucun effet
   de bord applicatif.
3. **`models/` ne dépend de rien.** C'est la seule couche importable de partout sans arbitrage.
4. **Importer via l'alias `@/`**, jamais en relatif remontant. Deux fichiers y échappent
   (`src/components/SectionChip.vue:2`, `src/views/daily/daily-summary/components/DailySummaryCard.vue:3`
   utilisent `from 'src/models/...'`, qui ne résout que par accident de configuration Vite).
5. **Importer par le barrel** (`@/api`, `@/store`, `@/services`), pas par le fichier.
   Deux exceptions type-only : `CommonTaskDialog.vue:5`, `TagDialog.vue:5`.

## Contraintes non évidentes

- **Cycles d'imports assumés.** `axios-instance → services → api → http → axios-instance`, et
  `axios-instance → router → store/services`. Ça ne fonctionne que parce que les appels ont lieu
  dans des corps de fonction (résolution différée), jamais au chargement du module. **Ne pas
  déplacer un appel dans le scope de module** de ces fichiers.
- **`src/services/` ne contient que l'auth.** La logique de domaine réutilisable vit dans
  `src/utils/` (`task.utils`, `event.utils`, `daily-task.utils`), importée directement par les
  stores. Il n'y a pas de frontière nette « service » vs « utils » : en pratique, `services/` =
  ce qui a un effet de bord applicatif (token, reset des stores), `utils/` = fonctions pures.
- **`src/views/components/` n'est pas une feature** : ce sont 13 composants partagés **par
  domaine** (task, event, tag, common-task). Trois niveaux de composants coexistent, voir
  [ui-layer.md](ui-layer.md).
- **Aucun découpage de bundle** : tout est importé statiquement par `src/router/index.ts`.

## Décisions négatives

- **Pas de couche « service » par domaine.** Les stores appellent `api/` directement ; les
  composants aussi quand il n'y a pas de store. Voir [state.md](state.md) pour le critère.
- **Pas de génération de types depuis le backend** — voir
  [../adr/0003-hand-written-api-models.md](../adr/0003-hand-written-api-models.md).
- **Pas de normalisation snake_case ↔ camelCase.** Les corps de requête/réponse sont en
  camelCase, mais certains _query params_ sont en snake_case (`has_uncompleted_task`,
  `start_date`).
  C'est le contrat backend tel quel, assumé sans couche de transformation.
- **Pas de lazy loading de routes** — voir [routing.md](routing.md).

## Voir aussi

- [api-layer.md](api-layer.md) · [state.md](state.md) · [routing.md](routing.md) · [ui-layer.md](ui-layer.md)
- [../quality/refactoring-backlog.md](../quality/refactoring-backlog.md) pour ce qui est
  connu-cassé dans ces couches.
