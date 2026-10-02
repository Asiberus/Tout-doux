# Drag and drop des tâches — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** réordonner à la main les tâches à faire d'un projet, d'une section et d'une collection,
et les daily tasks du wizard, par poignée, appui long, clavier et « Move to top ».

**Architecture :** trois composants génériques dans `src/components/sortable/` enveloppent
`@dnd-kit/vue`. `SortableList` émet `move(id, anchors)` ; les parents le branchent sur la couche
de déplacement existante (`projectStore.moveTask`, `collectionStore.moveTask`,
`useDailyTaskMove`), qui ne change pas. Tout accès aux internes de la bibliothèque passe par
`dnd-kit.ts`, figé par un test de contrat.

**Tech stack :** Vue 3.5, Vuetify 4, TypeScript, Vitest (jsdom) ; `@dnd-kit/vue`,
`@dnd-kit/dom`, `@dnd-kit/abstract` 0.5.0.

**Spec :** `docs/superpowers/specs/2026-09-30-task-drag-and-drop-design.md` (amendée par la
tâche 0).

## Contraintes globales

- **Aucune commande git qui modifie le dépôt** (`add`, `commit`, `rm`, `mv`, `checkout`…). Le
  mainteneur indexe et commite lui-même. Pas d'étape de commit par tâche : un seul message, rédigé
  à la tâche 8.
- **Aucun fichier modifié sans que son contenu ait été présenté et validé.** Le code de ce plan
  vaut présentation ; tout écart par rapport à lui se présente avant d'être appliqué.
- **Commentaires** : uniquement ce qui n'est pas lisible dans le code. Le plan n'en contient que
  trois dans `SortableList.vue` (le FLIP, le `setTimeout` de `dragInProgress`, le
  `requestAnimationFrame` de la resynchronisation) et un dans `src/test/setup.ts`. Ne pas en
  ajouter : les raisons des règles du prototype vont dans `docs/patterns/sortable.md`.
- `@dnd-kit/vue`, `@dnd-kit/dom`, `@dnd-kit/abstract` en **0.5.0 exacte**, sans `^`.
- Valeurs : appui long **250 ms**, tolérance **5 px** ; retour d'appui **98,5 %** dès **90 ms**,
  en **250 ms** ; carte soulevée **−3°**, **103 %**, transition **150 ms `ease-out`** ; voisines
  **250 ms `cubic-bezier(0.25, 1, 0.5, 1)`** ; dépôt **250 ms `ease`** (défaut de la
  bibliothèque) ; hors de la liste : opacité **90 %**, marge **50 px** ; vibration **10 ms**.
- `prefers-reduced-motion` : ni inclinaison ni agrandissement, durées à 0.
- Textes d'interface et annonces en anglais, mot pour mot ceux de la spec.
- La documentation touchée par une tâche est mise à jour **dans cette tâche**.
- Commandes depuis `frontend/` : `yarn …`. Yarn, jamais npm.

## Carte des fichiers

| Fichier                                                                               | Responsabilité                                                                    |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `frontend/package.json`, `yarn.lock`                                                  | dépendances `@dnd-kit/*` (générées)                                               |
| `frontend/src/test/setup.ts`                                                          | bouchon `ResizeObserver` pour jsdom                                               |
| `frontend/src/utils/sortable.utils.ts`                                                | `isOutside`, `listBounds`, textes des annonces, type `SetHandle` (nouveau)        |
| `frontend/src/components/sortable/dnd-kit.ts`                                         | capteurs, `TouchVerticalAxis`, `revertToInitialIndex`, `dragInProgress` (nouveau) |
| `frontend/src/components/sortable/SortableHandle.vue`                                 | bouton de la poignée (nouveau)                                                    |
| `frontend/src/components/sortable/SortableItem.vue`                                   | `useSortable`, retour d'appui, carte soulevée (nouveau)                           |
| `frontend/src/components/sortable/SortableList.vue`                                   | fournisseur, hors de la liste, repli, annonces, `move` (nouveau)                  |
| `frontend/src/views/components/task/TaskCard.vue`                                     | poignée, « Move to top »                                                          |
| `frontend/src/views/project/project-detail/tabs/ProjectDescription.vue`               | grille réordonnable                                                               |
| `frontend/src/views/project/project-detail/components/ProjectSectionItem.vue`         | colonne réordonnable                                                              |
| `frontend/src/views/collection/collection-detail/tabs/CollectionGeneral.vue`          | colonne réordonnable                                                              |
| `frontend/src/utils/daily-task.utils.ts`                                              | `dailyTaskName`                                                                   |
| `frontend/src/views/daily/components/DailyTaskFormCard.vue`                           | poignée, « Move to top »                                                          |
| `frontend/src/views/daily/daily-update/steps/task/components/DailyUpdateTaskList.vue` | tâches du jour réordonnables                                                      |
| `frontend/src/views/daily/daily-update/steps/task/DailyUpdateTask.vue`                | `useDailyTaskMove`                                                                |
| `frontend/src/layout/AuthenticatedLayout.vue`                                         | navbar inerte pendant un glisser                                                  |
| `frontend/docs/…`                                                                     | voir chaque tâche                                                                 |

---

### Tâche 0 : amender la spec

**Fichiers :** `docs/superpowers/specs/2026-09-30-task-drag-and-drop-design.md`

Le plan affine quatre points de la spec ; elle doit les dire avant l'implémentation.

- [ ] **Étape 1 : statut**

```markdown
- **Statut** : validé en conversation, à relire avant le plan d'implémentation
```

→

```markdown
- **Statut** : validé, amendé par le plan d'implémentation
```

- [ ] **Étape 2 : slot de `SortableList`**

```markdown
- **Slot** : `#item="{ item, index, setHandle }"`.
```

→

```markdown
- **Slot** : `#item="{ item, index, setHandle, moveToTop }"`. `setHandle` et `moveToTop` sont
  absents quand la liste n'est pas triable : la carte se rend alors comme avant.
```

- [ ] **Étape 3 : ligne `TaskCard.vue` des branchements**

```markdown
| `TaskCard.vue` | Prop `setHandle` (affiche la poignée) ; « Move to top » dans le menu, émet `move-to-top` |
```

→

```markdown
| `TaskCard.vue` | Props `setHandle` (affiche la poignée) et `atTop` ; « Move to top » dans le menu, émet `move-to-top` |
```

- [ ] **Étape 4 : ligne `dnd-kit.ts` des nouveaux fichiers**

Remplacer « capteurs, `TouchVerticalAxis`, `revertToInitialIndex`, `dragInProgress` » par
« capteurs, plugins, `TouchVerticalAxis`, `sortablePosition`, `revertToInitialIndex`,
`dragInProgress` ».

- [ ] **Étape 5 : tests et documentation**

Dans § 4, remplacer la puce « `revertToInitialIndex` sur un faux gestionnaire… » par :

```markdown
- `revertToInitialIndex` et `sortablePosition` sur le registre **réel** d'un
  `DragDropManager` : une mise à jour de version doit casser un test, pas l'interface. jsdom
  n'ayant pas de `ResizeObserver`, que `@dnd-kit/dom` instancie dès son import,
  `src/test/setup.ts` en pose un bouchon.
```

Dans § 5, ajouter :

```markdown
- `frontend/docs/adr/0008-sortable-lists-with-dnd-kit.md` (nouveau) : choix de la bibliothèque.
- `frontend/docs/architecture/ui-layer.md` : les trois composants de `src/components/sortable/`.
```

Puis `yarn prettier --write ../docs/superpowers/specs/2026-09-30-task-drag-and-drop-design.md`
depuis `frontend/`.

---

### Tâche 1 : fonctions pures de `sortable.utils.ts`

**Fichiers :**

- Créer : `frontend/src/utils/sortable.utils.ts`
- Test : `frontend/src/utils/sortable.utils.spec.ts`

**Interfaces :**

- Produit :

  - `type SetHandle = (handle: HTMLElement | null) => void`
  - `interface Bounds { top; right; bottom; left }`, `interface Point { x; y }` (nombres)
  - `OUTSIDE_MARGIN_PX = 50`, `REORDER_INSTRUCTIONS`
  - `listBounds(rect: Bounds, frozenHeight: number | null): Bounds`
  - `isOutside(bounds: Bounds, point: Point, margin: number): boolean`
  - `pickedUpMessage(name, index, total)`, `positionMessage(index, total)`,
    `outsideMessage(name, index, total)`, `droppedMessage(name, index, total)`,
    `cancelledMessage(name, index, total)`, `movedToTopMessage(name)` : `string`. Les index
    sont ceux de la liste (à partir de 0), les textes comptent à partir de 1.

- [ ] **Étape 1 : écrire les tests**

```ts
import { describe, expect, it } from "vitest";
import {
  cancelledMessage,
  droppedMessage,
  isOutside,
  listBounds,
  movedToTopMessage,
  outsideMessage,
  pickedUpMessage,
  positionMessage,
} from "@/utils/sortable.utils";

describe("isOutside", () => {
  const bounds = { top: 100, right: 400, bottom: 300, left: 0 };

  it("reste dans la liste jusqu’au bord de la marge", () => {
    expect(isOutside(bounds, { x: 200, y: 200 }, 50)).toBe(false);
    expect(isOutside(bounds, { x: -50, y: 50 }, 50)).toBe(false);
    expect(isOutside(bounds, { x: 450, y: 350 }, 50)).toBe(false);
  });

  it("sort au-delà de la marge, de chaque côté", () => {
    expect(isOutside(bounds, { x: -51, y: 200 }, 50)).toBe(true);
    expect(isOutside(bounds, { x: 451, y: 200 }, 50)).toBe(true);
    expect(isOutside(bounds, { x: 200, y: 49 }, 50)).toBe(true);
    expect(isOutside(bounds, { x: 200, y: 351 }, 50)).toBe(true);
  });
});

describe("listBounds", () => {
  it("reprend le rectangle mesuré", () => {
    const rect = { top: 100, right: 400, bottom: 300, left: 0 };
    expect(listBounds(rect, null)).toEqual(rect);
  });

  it("garde la hauteur figée pendant le repli", () => {
    expect(
      listBounds({ top: 80, right: 400, bottom: 200, left: 0 }, 200),
    ).toEqual({
      top: 80,
      right: 400,
      bottom: 280,
      left: 0,
    });
  });
});

describe("annonces", () => {
  it("comptent les positions à partir de 1", () => {
    expect(pickedUpMessage("Write tests", 2, 8)).toBe(
      "Picked up Write tests. Position 3 of 8.",
    );
    expect(positionMessage(3, 8)).toBe("Position 4 of 8.");
    expect(outsideMessage("Write tests", 2, 8)).toBe(
      "Outside the list. Release to put Write tests back at position 3 of 8.",
    );
    expect(droppedMessage("Write tests", 3, 8)).toBe(
      "Dropped Write tests at position 4 of 8.",
    );
    expect(cancelledMessage("Write tests", 2, 8)).toBe(
      "Cancelled. Write tests is back at position 3 of 8.",
    );
    expect(movedToTopMessage("Write tests")).toBe("Moved Write tests to top.");
  });
});
```

- [ ] **Étape 2 : lancer les tests, constater l'échec**

Run : `yarn test --run src/utils/sortable.utils.spec.ts`
Expected : FAIL, `Failed to resolve import "@/utils/sortable.utils"`.

- [ ] **Étape 3 : implémenter**

```ts
export type SetHandle = (handle: HTMLElement | null) => void;

export interface Bounds {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Point {
  x: number;
  y: number;
}

export const OUTSIDE_MARGIN_PX = 50;

export const REORDER_INSTRUCTIONS =
  "Press space to pick up. Use the arrow keys to move. Press space to drop, or escape to cancel.";

export function listBounds(
  { top, right, bottom, left }: Bounds,
  frozenHeight: number | null,
): Bounds {
  return {
    top,
    right,
    left,
    bottom: frozenHeight === null ? bottom : top + frozenHeight,
  };
}

export function isOutside(
  bounds: Bounds,
  point: Point,
  margin: number,
): boolean {
  return (
    point.x < bounds.left - margin ||
    point.x > bounds.right + margin ||
    point.y < bounds.top - margin ||
    point.y > bounds.bottom + margin
  );
}

export function pickedUpMessage(
  name: string,
  index: number,
  total: number,
): string {
  return `Picked up ${name}. Position ${index + 1} of ${total}.`;
}

export function positionMessage(index: number, total: number): string {
  return `Position ${index + 1} of ${total}.`;
}

export function outsideMessage(
  name: string,
  index: number,
  total: number,
): string {
  return `Outside the list. Release to put ${name} back at position ${index + 1} of ${total}.`;
}

export function droppedMessage(
  name: string,
  index: number,
  total: number,
): string {
  return `Dropped ${name} at position ${index + 1} of ${total}.`;
}

export function cancelledMessage(
  name: string,
  index: number,
  total: number,
): string {
  return `Cancelled. ${name} is back at position ${index + 1} of ${total}.`;
}

export function movedToTopMessage(name: string): string {
  return `Moved ${name} to top.`;
}
```

- [ ] **Étape 4 : lancer les tests**

Run : `yarn test --run src/utils/sortable.utils.spec.ts`
Expected : PASS (5 tests).

---

### Tâche 2 : dépendances et `dnd-kit.ts`

**Fichiers :**

- Modifier : `frontend/package.json`, `frontend/yarn.lock` (générés par yarn)
- Modifier : `frontend/src/test/setup.ts`
- Créer : `frontend/src/components/sortable/dnd-kit.ts`
- Test : `frontend/src/components/sortable/dnd-kit.spec.ts`
- Créer : `frontend/docs/adr/0008-sortable-lists-with-dnd-kit.md`
- Modifier : `frontend/docs/quality/watched-risks.md`

**Interfaces :**

- Consomme : `REORDER_INSTRUCTIONS` (tâche 1).
- Produit :

  - `LONG_PRESS_MS = 250`, `PRESS_TOLERANCE_PX = 5`, `REORDER_DURATION_MS = 250`,
    `REORDER_EASING`, `HANDLE_SELECTOR = '.sortable-handle'`, `CONTROL_SELECTOR`,
    `SORTABLE_TRANSITION`, `SENSORS`
  - `dragInProgress: Ref<boolean>`
  - `preventActivation(event: PointerEvent, source: { handle?: Element }): boolean`
  - `activationConstraints(event: PointerEvent, source: { handle?: Element }): ActivationConstraints<PointerEvent>`
  - `isTouch(event: Event | null): boolean`
  - `lockTouchToVerticalAxis(transform: { x; y }, activatorEvent: Event | null): { x; y }`
  - `class TouchVerticalAxis extends Modifier`
  - `interface SortablePosition { id: number; index: number; initialIndex: number }`
  - `sortablePosition(entity: SortableEntity | null): SortablePosition | null`
  - `interface RevertibleManager`, `revertToInitialIndex(manager, allowDragOver: (allowed: boolean) => void): Promise<void>`
  - `interface Announcements { dragstart; dragover; dragend }`,
    `createPlugins(announcements: Announcements): Customizable<Plugins>`

- [ ] **Étape 1 : installer**

```bash
yarn add --exact @dnd-kit/vue@0.5.0 @dnd-kit/dom@0.5.0 @dnd-kit/abstract@0.5.0
```

Expected : trois lignes `"@dnd-kit/…": "0.5.0"` dans `dependencies`, sans `^`.

- [ ] **Étape 2 : bouchon `ResizeObserver`**

À la fin de `src/test/setup.ts` :

```ts
// `@dnd-kit/dom` instancie un `ResizeObserver` dès son import, et jsdom n'en fournit pas.
globalThis.ResizeObserver ??= class {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
};
```

- [ ] **Étape 3 : écrire les tests**

`src/components/sortable/dnd-kit.spec.ts` :

```ts
import { describe, expect, it, vi } from "vitest";
import { DragDropManager, PointerActivationConstraints } from "@dnd-kit/dom";
import { Sortable } from "@dnd-kit/dom/sortable";
import {
  activationConstraints,
  lockTouchToVerticalAxis,
  preventActivation,
  revertToInitialIndex,
  sortablePosition,
} from "@/components/sortable/dnd-kit";

function renderCard(): {
  source: { handle: Element };
  find: (selector: string) => Element;
} {
  const element = document.createElement("div");
  element.innerHTML = `
    <button class="v-btn sortable-handle"><i class="icon"></i></button>
    <button class="v-btn checkbox"><i class="icon"></i></button>
    <span class="v-chip"><span class="label">Chip</span></span>
    <a href="#">Link</a>
    <input />
    <div class="body"><span class="name">Name</span></div>`;
  const find = (selector: string): Element =>
    element.querySelector(selector) as Element;
  return { source: { handle: find(".sortable-handle") }, find };
}

function pointerDownOn(target: Element): PointerEvent {
  return { target } as unknown as PointerEvent;
}

describe("activation", () => {
  it("démarre tout de suite depuis la poignée, icône comprise", () => {
    const { source, find } = renderCard();
    const event = pointerDownOn(find(".sortable-handle .icon"));
    expect(preventActivation(event, source)).toBe(false);
    expect(activationConstraints(event, source)).toEqual([]);
  });

  it("attend un appui de 250 ms à 5 px près sur le corps de la carte", () => {
    const { source, find } = renderCard();
    const event = pointerDownOn(find(".name"));
    expect(preventActivation(event, source)).toBe(false);

    const constraints = activationConstraints(event, source);
    expect(constraints).toHaveLength(1);
    expect(constraints[0]).toBeInstanceOf(PointerActivationConstraints.Delay);
    expect(constraints[0]).toMatchObject({
      options: { value: 250, tolerance: 5 },
    });
  });

  it("ne démarre jamais depuis un contrôle de la carte", () => {
    const { source, find } = renderCard();
    for (const selector of [".checkbox .icon", ".v-chip .label", "a", "input"])
      expect(preventActivation(pointerDownOn(find(selector)), source)).toBe(
        true,
      );
  });
});

describe("lockTouchToVerticalAxis", () => {
  const transform = { x: 12, y: 30 };

  it("annule le déplacement horizontal au doigt", () => {
    const touch = { pointerType: "touch" } as unknown as Event;
    expect(lockTouchToVerticalAxis(transform, touch)).toEqual({ x: 0, y: 30 });
  });

  it("laisse la souris et le clavier libres", () => {
    const mouse = { pointerType: "mouse" } as unknown as Event;
    expect(lockTouchToVerticalAxis(transform, mouse)).toEqual(transform);
    expect(lockTouchToVerticalAxis(transform, null)).toEqual(transform);
  });
});

describe("contrat avec les internes de @dnd-kit", () => {
  function registerSortables(): {
    manager: DragDropManager;
    sortables: Sortable[];
  } {
    const manager = new DragDropManager();
    const sortables = [
      { id: 9, index: 0, group: "other" },
      { id: 1, index: 0, group: "list" },
      { id: 2, index: 1, group: "list" },
      { id: 3, index: 2, group: "list" },
    ].map((input) => {
      const element = document.createElement("div");
      document.body.append(element);
      const sortable = new Sortable({ ...input, element }, manager);
      sortable.register();
      return sortable;
    });
    return { manager, sortables };
  }

  it("lit la position d’un élément du registre", () => {
    const { manager } = registerSortables();
    const positions = [...manager.registry.draggables].map(sortablePosition);
    expect(positions).toContainEqual({ id: 2, index: 1, initialIndex: 1 });
    expect(sortablePosition(null)).toBeNull();
  });

  it("ramène la carte sur l’occupant de sa place d’origine, dans son groupe seulement", async () => {
    const { manager, sortables } = registerSortables();
    const [, first, second, third] = sortables;
    first.index = 2;
    second.index = 0;
    third.index = 1;

    let allowed = false;
    const setDropTarget = vi.fn(async () => {
      expect(allowed).toBe(true);
      return true;
    });
    const source = {
      id: 1,
      sortable: { index: 2, initialIndex: 0, group: "list" },
    };
    await revertToInitialIndex(
      {
        dragOperation: { source },
        registry: manager.registry,
        actions: { setDropTarget },
      },
      (value) => (allowed = value),
    );

    expect(setDropTarget).toHaveBeenCalledWith(2);
    expect(allowed).toBe(false);
  });

  it("ne fait rien si la carte est déjà à sa place d’origine", async () => {
    const { manager } = registerSortables();
    const setDropTarget = vi.fn(async () => true);
    const source = {
      id: 1,
      sortable: { index: 0, initialIndex: 0, group: "list" },
    };
    await revertToInitialIndex(
      {
        dragOperation: { source },
        registry: manager.registry,
        actions: { setDropTarget },
      },
      () => undefined,
    );
    expect(setDropTarget).not.toHaveBeenCalled();
  });
});
```

- [ ] **Étape 4 : lancer les tests, constater l'échec**

Run : `yarn test --run src/components/sortable/dnd-kit.spec.ts`
Expected : FAIL, `Failed to resolve import "@/components/sortable/dnd-kit"`.

- [ ] **Étape 5 : implémenter `dnd-kit.ts`**

```ts
import { ref } from "vue";
import {
  ActivationConstraints,
  Customizable,
  DragOperation,
  Modifier,
  Plugins,
  UniqueIdentifier,
} from "@dnd-kit/abstract";
import {
  Accessibility,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerActivationConstraints,
  PointerSensor,
} from "@dnd-kit/dom";
import { SortableTransition } from "@dnd-kit/dom/sortable";
import { REORDER_INSTRUCTIONS } from "@/utils/sortable.utils";

export const LONG_PRESS_MS = 250;
export const PRESS_TOLERANCE_PX = 5;
export const REORDER_DURATION_MS = 250;
export const REORDER_EASING = "cubic-bezier(0.25, 1, 0.5, 1)";
export const HANDLE_SELECTOR = ".sortable-handle";
export const CONTROL_SELECTOR =
  ".v-btn:not(.sortable-handle), .v-chip, a, input, textarea";

export const SORTABLE_TRANSITION: SortableTransition = {
  duration: REORDER_DURATION_MS,
  easing: REORDER_EASING,
  idle: false,
};

export const dragInProgress = ref(false);

interface ActivationSource {
  handle?: Element;
}

interface SortableEntity {
  id: UniqueIdentifier;
  sortable?: {
    index: number;
    initialIndex: number;
    group?: UniqueIdentifier;
  };
}

export interface SortablePosition {
  id: number;
  index: number;
  initialIndex: number;
}

export interface RevertibleManager {
  dragOperation: { source: SortableEntity | null };
  registry: { droppables: Iterable<SortableEntity> };
  actions: { setDropTarget(id: UniqueIdentifier): Promise<boolean> };
}

export interface Announcements {
  dragstart(event: DragStartEvent): string | undefined;
  dragover(event: DragOverEvent): string | undefined;
  dragend(event: DragEndEvent): string | undefined;
}

function isOnHandle(event: PointerEvent, source: ActivationSource): boolean {
  return (
    event.target instanceof Node &&
    source.handle?.contains(event.target) === true
  );
}

export function preventActivation(
  event: PointerEvent,
  source: ActivationSource,
): boolean {
  if (isOnHandle(event, source)) return false;
  return (
    event.target instanceof Element &&
    event.target.closest(CONTROL_SELECTOR) !== null
  );
}

export function activationConstraints(
  event: PointerEvent,
  source: ActivationSource,
): ActivationConstraints<PointerEvent> {
  if (isOnHandle(event, source)) return [];
  return [
    new PointerActivationConstraints.Delay({
      value: LONG_PRESS_MS,
      tolerance: PRESS_TOLERANCE_PX,
    }),
  ];
}

export const SENSORS = [
  PointerSensor.configure({
    activatorElements: (source) => [source.element],
    preventActivation,
    activationConstraints,
  }),
  KeyboardSensor,
];

export function isTouch(event: Event | null): boolean {
  return (
    event !== null && "pointerType" in event && event.pointerType === "touch"
  );
}

export function lockTouchToVerticalAxis(
  transform: { x: number; y: number },
  activatorEvent: Event | null,
): { x: number; y: number } {
  return isTouch(activatorEvent) ? { ...transform, x: 0 } : transform;
}

export class TouchVerticalAxis extends Modifier {
  apply({ transform, activatorEvent }: DragOperation): {
    x: number;
    y: number;
  } {
    return lockTouchToVerticalAxis(transform, activatorEvent);
  }
}

export function sortablePosition(
  entity: SortableEntity | null,
): SortablePosition | null {
  if (!entity?.sortable) return null;
  const { index, initialIndex } = entity.sortable;
  return { id: Number(entity.id), index, initialIndex };
}

export async function revertToInitialIndex(
  manager: RevertibleManager,
  allowDragOver: (allowed: boolean) => void,
): Promise<void> {
  const source = manager.dragOperation.source;
  const sortable = source?.sortable;
  if (!source || !sortable || sortable.index === sortable.initialIndex) return;

  const occupant = [...manager.registry.droppables].find(
    (droppable) =>
      droppable.id !== source.id &&
      droppable.sortable?.group === sortable.group &&
      droppable.sortable.index === sortable.initialIndex,
  );
  if (!occupant) return;

  allowDragOver(true);
  try {
    await manager.actions.setDropTarget(occupant.id);
  } finally {
    allowDragOver(false);
  }
}

export function createPlugins(
  announcements: Announcements,
): Customizable<Plugins> {
  return (defaults) => [
    ...defaults,
    Accessibility.configure({
      announcements,
      screenReaderInstructions: { draggable: REORDER_INSTRUCTIONS },
    }),
  ];
}
```

- [ ] **Étape 6 : lancer les tests**

Run : `yarn test --run src/components/sortable/dnd-kit.spec.ts`
Expected : PASS (8 tests). Si le test « ramène la carte… » échoue sur la forme du registre, c'est
le contrat qui a changé : ne pas assouplir le test, adapter `SortableEntity`.

- [ ] **Étape 7 : ADR 0008**

`docs/adr/0008-sortable-lists-with-dnd-kit.md` :

```markdown
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
```

- [ ] **Étape 8 : risque surveillé W15**

Dans l'index de `docs/quality/watched-risks.md`, après la ligne W14 :

```markdown
| W15 | `@dnd-kit` en 0.x, internes utilisés | Robustesse | Toute montée de version de `@dnd-kit/*` |
```

Dans W7, à la fin du **Contexte** : « `@dnd-kit` (~37 ko gzip) y est entré avec les listes
réordonnables ([ADR 0008](../adr/0008-sortable-lists-with-dnd-kit.md)). »

À la fin du fichier :

```markdown
## W15 — `@dnd-kit` en 0.x, internes utilisés

- **Origine** : `src/components/sortable/dnd-kit.ts`, versions exactes dans `package.json`.
- **Contexte** : les listes réordonnables reposent sur `@dnd-kit` 0.5.0, dont l'API peut changer
  à chaque version. `dnd-kit.ts` lit des internes non documentés (`registry.droppables`,
  `sortable.index`, `sortable.initialIndex`, `sortable.group`) et appelle
  `actions.setDropTarget` pour ramener l'emplacement à sa place d'origine.
- **Décision** : ne pas agir. Versions épinglées, internes isolés dans un seul fichier, et
  `dnd-kit.spec.ts` interroge le registre d'un vrai `DragDropManager`.
- **Déclencheur** : toute montée de version de `@dnd-kit/*`. Relancer alors `dnd-kit.spec.ts` et
  l'essai manuel de [verification.md](../workflows/verification.md#listes-réordonnables).
```

- [ ] **Étape 9 : contrôles**

```bash
yarn test --run
yarn type-check 2>&1 | grep -c "error TS"
```

Expected : PASS ; toujours 2 erreurs (`api/api.spec.ts`). Une erreur de type dans `dnd-kit.ts`
(variance des contraintes, type des plugins) se corrige par un type plus précis, pas par un `as`,
et se présente avant d'être appliquée.

---

### Tâche 3 : composants `sortable` et listes de tâches

**Fichiers :**

- Créer : `frontend/src/components/sortable/SortableHandle.vue`, `SortableItem.vue`,
  `SortableList.vue`
- Modifier : `frontend/src/views/components/task/TaskCard.vue`
- Modifier : `ProjectDescription.vue`, `ProjectSectionItem.vue`, `CollectionGeneral.vue`
- Créer : `frontend/docs/patterns/sortable.md`
- Modifier : `frontend/docs/architecture/ui-layer.md`, `frontend/docs/domain/glossary.md`

**Interfaces :**

- Consomme : tâches 1 et 2 ; `anchorsAt` (`@/utils/ordering.utils`), `MoveAnchors`
  (`@/models/ordering.model`), `projectStore.moveTask(id, anchors, sectionId?)`,
  `collectionStore.moveTask(id, anchors)`.
- Produit :

  - `SortableHandle` : props `setHandle: SetHandle`, `label: string`.
  - `SortableItem` : props `id: number`, `index: number`, `group: string`, `locked: boolean` ;
    slot par défaut `{ setHandle?: SetHandle }`.
  - `SortableList<T extends { id: number }>` : props `items: T[]`, `axis: 'vertical' | 'both'`,
    `itemLabel: (item: T) => string`, `disabled?: boolean`, `lockedId?: number | null` ; slot
    `item` `{ item: T; index: number; setHandle?: SetHandle; moveToTop?: () => void }` ; émet
    `move: [id: number, anchors: MoveAnchors]`.
  - `TaskCard` : props `setHandle?: SetHandle`, `atTop?: boolean` ; émet
    `move-to-top: [id: number]`.

- [ ] **Étape 1 : `SortableHandle.vue`**

```vue
<script setup lang="ts">
import { ComponentPublicInstance } from "vue";
import { SetHandle } from "@/utils/sortable.utils";

const props = defineProps<{
  setHandle: SetHandle;
  label: string;
}>();

function bindHandle(button: Element | ComponentPublicInstance | null): void {
  props.setHandle((button as ComponentPublicInstance | null)?.$el ?? null);
}
</script>

<template>
  <v-btn
    :ref="bindHandle"
    icon
    variant="text"
    density="comfortable"
    :aria-label="label"
    class="sortable-handle"
  >
    <v-icon icon="mdi-drag-vertical" />
  </v-btn>
</template>

<style scoped lang="scss">
.sortable-handle {
  cursor: grab;
  touch-action: none;
  opacity: 0.6;
  transition: opacity 0.15s;

  &:hover,
  &:focus-visible {
    opacity: 1;
  }
}
</style>
```

- [ ] **Étape 2 : `SortableItem.vue`**

```vue
<script setup lang="ts">
import { useSortable } from "@dnd-kit/vue/sortable";
import { shallowRef, useTemplateRef } from "vue";
import {
  CONTROL_SELECTOR,
  HANDLE_SELECTOR,
  PRESS_TOLERANCE_PX,
  SORTABLE_TRANSITION,
} from "@/components/sortable/dnd-kit";
import { SetHandle } from "@/utils/sortable.utils";

const PRESS_FEEDBACK_DELAY_MS = 90;
const PRESS_END_EVENTS = ["pointermove", "pointerup", "pointercancel"] as const;

const props = defineProps<{
  id: number;
  index: number;
  group: string;
  locked: boolean;
}>();

defineSlots<{
  default(props: { setHandle?: SetHandle }): unknown;
}>();

const element = useTemplateRef<HTMLElement>("element");
const handle = shallowRef<HTMLElement | null>(null);

useSortable({
  id: () => props.id,
  index: () => props.index,
  group: () => props.group,
  disabled: () => ({ draggable: props.locked }),
  element,
  handle,
  transition: SORTABLE_TRANSITION,
});

function setHandle(button: HTMLElement | null): void {
  handle.value = button;
}

function showPressFeedback(event: PointerEvent): void {
  const item = element.value;
  if (
    !item ||
    props.locked ||
    event.button !== 0 ||
    !(event.target instanceof Element)
  )
    return;
  if (event.target.closest(`${HANDLE_SELECTOR}, ${CONTROL_SELECTOR}`)) return;

  const { clientX, clientY } = event;
  const timer = setTimeout(
    () => item.classList.add("pressing"),
    PRESS_FEEDBACK_DELAY_MS,
  );

  function release(next: PointerEvent): void {
    const distance = Math.hypot(next.clientX - clientX, next.clientY - clientY);
    if (next.type === "pointermove" && distance < PRESS_TOLERANCE_PX) return;

    clearTimeout(timer);
    item.classList.remove("pressing");
    for (const type of PRESS_END_EVENTS)
      window.removeEventListener(type, release, true);
  }

  for (const type of PRESS_END_EVENTS)
    window.addEventListener(type, release, true);
}
</script>

<template>
  <div
    ref="element"
    class="sortable-item"
    :class="{ locked }"
    @pointerdown="showPressFeedback"
  >
    <slot :set-handle="locked ? undefined : setHandle" />
  </div>
</template>

<style scoped lang="scss">
.sortable-item {
  display: grid;

  &:not(.locked) {
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  }

  :deep(.v-card) {
    transition:
      rotate 0.15s ease-out,
      scale 0.15s ease-out,
      box-shadow 0.15s ease-out,
      opacity 0.15s;
  }

  &.pressing:not([data-dnd-dragging]) :deep(.v-card) {
    scale: 0.985;
    transition-duration: 0.25s;
  }

  &[data-dnd-dragging] :deep(.v-card) {
    rotate: -3deg;
    scale: 1.03;
    box-shadow:
      0 8px 10px -5px rgba(0, 0, 0, 0.3),
      0 16px 24px 2px rgba(0, 0, 0, 0.24),
      0 6px 30px 5px rgba(0, 0, 0, 0.22);
  }

  &[data-dnd-dragging][data-dnd-dropping] :deep(.v-card) {
    rotate: 0deg;
    scale: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sortable-item {
    :deep(.v-card) {
      transition: none;
    }

    &[data-dnd-dragging] :deep(.v-card) {
      rotate: 0deg;
      scale: 1;
    }
  }
}
</style>
```

- [ ] **Étape 3 : `SortableList.vue`**

```vue
<script setup lang="ts" generic="T extends { id: number }">
import {
  DragDropManager,
  DragDropProvider,
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/vue";
import { computed, shallowRef, useId, useTemplateRef, watch } from "vue";
import SortableItem from "@/components/sortable/SortableItem.vue";
import {
  REORDER_DURATION_MS,
  REORDER_EASING,
  SENSORS,
  TouchVerticalAxis,
  createPlugins,
  dragInProgress,
  isTouch,
  revertToInitialIndex,
  sortablePosition,
} from "@/components/sortable/dnd-kit";
import { MoveAnchors } from "@/models/ordering.model";
import { anchorsAt } from "@/utils/ordering.utils";
import {
  Bounds,
  OUTSIDE_MARGIN_PX,
  SetHandle,
  cancelledMessage,
  droppedMessage,
  isOutside,
  listBounds,
  movedToTopMessage,
  outsideMessage,
  pickedUpMessage,
  positionMessage,
} from "@/utils/sortable.utils";

const PICKUP_VIBRATION_MS = 10;

const props = withDefaults(
  defineProps<{
    items: T[];
    axis: "vertical" | "both";
    itemLabel: (item: T) => string;
    disabled?: boolean;
    lockedId?: number | null;
  }>(),
  { disabled: false, lockedId: null },
);

const emit = defineEmits<{
  move: [id: number, anchors: MoveAnchors];
}>();

defineSlots<{
  item(props: {
    item: T;
    index: number;
    setHandle?: SetHandle;
    moveToTop?: () => void;
  }): unknown;
}>();

const group = useId();
const container = useTemplateRef<HTMLElement>("container");
const plugins = createPlugins({
  dragstart: announceDragStart,
  dragover: announceDragOver,
  dragend: announceDragEnd,
});
const modifiers = props.axis === "vertical" ? [TouchVerticalAxis] : [];

const frozenItems = shallowRef<T[] | null>(null);
const announcement = shallowRef("");

let activeManager: DragDropManager | null = null;
let itemsAtDragStart: T[] = [];
let resyncAfterDrag = false;
let bounds: Bounds | null = null;
let frozenHeight: number | null = null;
let outside = false;
let revertInProgress = false;
let announcedIndex: number | null = null;

const rendered = computed<T[]>(() => frozenItems.value ?? props.items);
const sortable = computed<boolean>(
  () => !props.disabled && rendered.value.length > 1,
);
const itemOrder = computed<string>(() =>
  props.items.map(({ id }) => id).join(","),
);

watch(itemOrder, () => {
  if (!activeManager) return;
  frozenItems.value = itemsAtDragStart;
  resyncAfterDrag = true;
  activeManager.actions.stop({ canceled: true });
});

function labelOf(id: number): string {
  const item = rendered.value.find((candidate) => candidate.id === id);
  return item ? props.itemLabel(item) : "";
}

function announceDragStart({ operation }: DragStartEvent): string | undefined {
  const source = sortablePosition(operation.source);
  if (!source) return undefined;
  announcedIndex = source.index;
  return pickedUpMessage(
    labelOf(source.id),
    source.index,
    rendered.value.length,
  );
}

function announceDragOver({ operation }: DragOverEvent): string | undefined {
  const source = sortablePosition(operation.source);
  if (!source || outside || source.index === announcedIndex) return undefined;
  announcedIndex = source.index;
  return positionMessage(source.index, rendered.value.length);
}

function announceDragEnd({
  operation,
  canceled,
}: DragEndEvent): string | undefined {
  const source = sortablePosition(operation.source);
  if (!source) return undefined;
  const total = rendered.value.length;
  return canceled
    ? cancelledMessage(labelOf(source.id), source.initialIndex, total)
    : droppedMessage(labelOf(source.id), source.index, total);
}

function measureBounds(): void {
  if (container.value)
    bounds = listBounds(container.value.getBoundingClientRect(), frozenHeight);
}

// FLIP : chaque voisine est mesurée avant et après le changement, puis part de son ancienne place
function animateReflow(list: HTMLElement, mutate: () => void): void {
  const neighbours = [...list.children].filter(
    (child) =>
      !child.hasAttribute("data-dnd-dragging") &&
      !child.hasAttribute("data-dnd-placeholder"),
  );
  const before = new Map(
    neighbours.map((child) => [child, child.getBoundingClientRect()]),
  );
  mutate();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  for (const child of neighbours) {
    const from = before.get(child);
    if (!from) continue;
    const to = child.getBoundingClientRect();
    const dx = from.left - to.left;
    const dy = from.top - to.top;
    if (dx || dy)
      child.animate([{ translate: `${dx}px ${dy}px` }, { translate: "0 0" }], {
        duration: REORDER_DURATION_MS,
        easing: REORDER_EASING,
      });
  }
}

function setCollapsed(collapsed: boolean): void {
  const list = container.value;
  if (!list) return;

  const placeholder = list.querySelector(":scope > [data-dnd-placeholder]");
  if (collapsed && placeholder) {
    const { width, height } = placeholder.getBoundingClientRect();
    list.style.setProperty("--placeholder-width", `${width}px`);
    list.style.setProperty("--placeholder-height", `${height}px`);
  }
  animateReflow(list, () => list.classList.toggle("collapsed", collapsed));
}

function leaveList(manager: DragDropManager): void {
  if (bounds) frozenHeight = bounds.bottom - bounds.top;
  setCollapsed(true);
  revertToInitialIndex(manager, (allowed) => (revertInProgress = allowed));

  const source = sortablePosition(manager.dragOperation.source);
  if (source)
    announcement.value = outsideMessage(
      labelOf(source.id),
      source.initialIndex,
      rendered.value.length,
    );
}

function enterList(): void {
  frozenHeight = null;
  setCollapsed(false);
  measureBounds();
  announcement.value = "";
}

function onDragStart(
  { operation }: DragStartEvent,
  manager: DragDropManager,
): void {
  activeManager = manager;
  itemsAtDragStart = [...props.items];
  dragInProgress.value = true;
  measureBounds();
  window.addEventListener("scroll", measureBounds, {
    capture: true,
    passive: true,
  });
  if (isTouch(operation.activatorEvent))
    navigator.vibrate?.(PICKUP_VIBRATION_MS);
}

function onDragMove(
  { to, nativeEvent }: DragMoveEvent,
  manager: DragDropManager,
): void {
  if (!to || !bounds || nativeEvent instanceof KeyboardEvent) return;

  const isOut = isOutside(bounds, to, OUTSIDE_MARGIN_PX);
  if (isOut === outside) return;

  outside = isOut;
  if (outside) leaveList(manager);
  else enterList();
}

function onDragOver(event: DragOverEvent): void {
  if (outside && !revertInProgress) event.preventDefault();
}

function onDragEnd({ operation, canceled }: DragEndEvent): void {
  window.removeEventListener("scroll", measureBounds, { capture: true });
  activeManager = null;
  // Le `touchend` qui suit le `pointerup` doit encore voir le glisser : `v-touch` y lirait un
  // balayage et ouvrirait la navbar
  setTimeout(() => (dragInProgress.value = false));

  const droppedOutside = outside;
  outside = false;
  bounds = null;
  frozenHeight = null;
  if (droppedOutside) setCollapsed(false);

  if (resyncAfterDrag) {
    resyncAfterDrag = false;
    // La bibliothèque rétablit d'abord l'ordre du DOM qu'elle a modifié ; Vue applique ensuite la
    // nouvelle liste sur un DOM qui correspond de nouveau à ses nœuds virtuels
    requestAnimationFrame(() => (frozenItems.value = null));
    return;
  }

  const source = sortablePosition(operation.source);
  if (canceled || droppedOutside || !source) return;

  const anchors = anchorsAt(rendered.value, source.id, source.index);
  if (anchors) emit("move", source.id, anchors);
}

function moveToTop(item: T): void {
  const anchors = anchorsAt(rendered.value, item.id, 0);
  if (!anchors) return;

  emit("move", item.id, anchors);
  announcement.value = movedToTopMessage(props.itemLabel(item));
}
</script>

<template>
  <div ref="container" class="sortable-list">
    <template v-if="sortable">
      <DragDropProvider
        :sensors="SENSORS"
        :plugins
        :modifiers
        @drag-start="onDragStart"
        @drag-move="onDragMove"
        @drag-over="onDragOver"
        @drag-end="onDragEnd"
      >
        <SortableItem
          v-for="(item, index) of rendered"
          :id="item.id"
          :key="item.id"
          v-slot="{ setHandle }"
          :index
          :group
          :locked="item.id === lockedId"
        >
          <slot
            name="item"
            :item
            :index
            :set-handle="setHandle"
            :move-to-top="() => moveToTop(item)"
          />
        </SortableItem>
      </DragDropProvider>
      <div class="d-sr-only" aria-live="assertive">{{ announcement }}</div>
    </template>
    <template v-else>
      <template v-for="(item, index) of rendered" :key="item.id">
        <slot name="item" :item :index />
      </template>
    </template>
  </div>
</template>

<style scoped lang="scss">
.sortable-list.collapsed {
  > :deep([data-dnd-placeholder]) {
    position: absolute !important;
    width: var(--placeholder-width) !important;
    height: var(--placeholder-height) !important;
    visibility: hidden !important;
  }

  > :deep([data-dnd-dragging] .v-card) {
    opacity: 0.9;
  }
}
</style>
```

- [ ] **Étape 4 : `TaskCard.vue`**

Script, imports :

```ts
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import { useDialogWidth } from "@/composables/useDialogWidth";
```

→

```ts
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import SortableHandle from "@/components/sortable/SortableHandle.vue";
import { useDialogWidth } from "@/composables/useDialogWidth";
import { SetHandle } from "@/utils/sortable.utils";
```

Props et événements :

```ts
    color?: string
    itemName?: string
  }>(),
```

→

```ts
    color?: string
    itemName?: string
    setHandle?: SetHandle
    atTop?: boolean
  }>(),
```

```ts
  delete: [id: number]
}>()
```

→

```ts
  delete: [id: number]
  'move-to-top': [id: number]
}>()
```

Après `cardColor` :

```ts
const leadingButtonCount = computed<number>(
  () => Number(props.completable) + Number(props.setHandle !== undefined),
);
```

Après `emitAddToDailyEvent` :

```ts
function emitMoveToTopEvent(): void {
  emit("move-to-top", props.task.id);
}
```

Template, menu, après l'entrée « Add to daily » :

```vue
<v-list-item v-if="setHandle && !atTop" @click="emitMoveToTopEvent()">
                <v-list-item-title class="d-flex align-center">
                  <v-icon icon="mdi-arrow-collapse-up" size="small" start />
                  Move to top
                </v-list-item-title>
              </v-list-item>
```

Contenu, poignée avant la case à cocher :

```vue
<div class="task-card__content" :class="{ 'mb-1': small }"></div>
```

→

```vue
<div class="task-card__content" :class="{ 'mb-1': small }"></div>
```

Tags, alignés sous le nom quelle que soit le nombre de boutons à gauche :

```vue
:max-tag="3" :class="{ 'pl-10': completable }">
```

→

```vue
:max-tag="3" :style="{ paddingLeft: `${leadingButtonCount * 40}px` }">
```

- [ ] **Étape 5 : `ProjectDescription.vue`**

Imports :

```ts
import { ProjectDetail } from "@/models/project.model";
```

→

```ts
import SortableList from "@/components/sortable/SortableList.vue";
import { MoveAnchors } from "@/models/ordering.model";
import { ProjectDetail } from "@/models/project.model";
```

Après `deleteTask` :

```ts
function moveTask(id: number, anchors: MoveAnchors): void {
  projectStore.moveTask(id, anchors);
}
```

Template, tâches à faire seulement (la vue « Completed » ne change pas) :

```vue
<template v-if="projectStore.uncompletedTasks.length > 0">
  <div class="task-wrapper">
    <TaskCard
      v-for="task of projectStore.uncompletedTasks"
      :key="task.id"
      :task="task"
      :disabled="project.archived"
      @add-to-daily="addTaskToDaily($event)"
      @toggle-state="toggleTaskState"
      @update="updateTask"
      @delete="deleteTask"
    />
  </div>
</template>
```

→

```vue
<template v-if="projectStore.uncompletedTasks.length > 0">
  <SortableList
    :items="projectStore.uncompletedTasks"
    axis="both"
    :disabled="project.archived"
    :item-label="(task) => task.name"
    class="task-wrapper"
    @move="moveTask"
  >
    <template #item="{ item: task, index, setHandle, moveToTop }">
      <TaskCard
        :task="task"
        :disabled="project.archived"
        :set-handle
        :at-top="index === 0"
        @add-to-daily="addTaskToDaily($event)"
        @toggle-state="toggleTaskState"
        @update="updateTask"
        @delete="deleteTask"
        @move-to-top="moveToTop?.()"
      />
    </template>
  </SortableList>
</template>
```

- [ ] **Étape 6 : `ProjectSectionItem.vue`**

Imports :

```ts
import FilterChip from "@/components/FilterChip.vue";
import ProgressWheel from "@/components/ProgressWheel.vue";
import { SectionPatch, SectionTask } from "@/models/section.model";
```

→

```ts
import FilterChip from "@/components/FilterChip.vue";
import ProgressWheel from "@/components/ProgressWheel.vue";
import SortableList from "@/components/sortable/SortableList.vue";
import { MoveAnchors } from "@/models/ordering.model";
import { SectionPatch, SectionTask } from "@/models/section.model";
```

Après `deleteTask` :

```ts
function moveTask(id: number, anchors: MoveAnchors): void {
  projectStore.moveTask(id, anchors, props.section.id);
}
```

Template :

```vue
<template v-if="uncompletedTasks.length > 0">
  <TaskCard
    v-for="task of uncompletedTasks"
    :key="task.id"
    :task
    :disabled
    class="mb-2"
    @add-to-daily="addTaskToDaily($event)"
    @toggle-state="toggleTaskState"
    @update="updateTask"
    @delete="deleteTask"
  />
</template>
```

→

```vue
<template v-if="uncompletedTasks.length > 0">
  <SortableList
    :items="uncompletedTasks"
    axis="vertical"
    :disabled
    :item-label="(task) => task.name"
    class="d-flex flex-column gap-2 mb-2"
    @move="moveTask"
  >
    <template #item="{ item: task, index, setHandle, moveToTop }">
      <TaskCard
        :task
        :disabled
        :set-handle
        :at-top="index === 0"
        @add-to-daily="addTaskToDaily($event)"
        @toggle-state="toggleTaskState"
        @update="updateTask"
        @delete="deleteTask"
        @move-to-top="moveToTop?.()"
      />
    </template>
  </SortableList>
</template>
```

- [ ] **Étape 7 : `CollectionGeneral.vue`**

Imports :

```ts
import ProgressWheel from "@/components/ProgressWheel.vue";
import { CollectionDetail } from "@/models/collection.model";
```

→

```ts
import ProgressWheel from "@/components/ProgressWheel.vue";
import SortableList from "@/components/sortable/SortableList.vue";
import { CollectionDetail } from "@/models/collection.model";
import { MoveAnchors } from "@/models/ordering.model";
```

Après `deleteTask` :

```ts
function moveTask(id: number, anchors: MoveAnchors): void {
  collectionStore.moveTask(id, anchors);
}
```

Template :

```vue
<template v-if="collectionStore.uncompletedTasks.length > 0">
  <TaskCard
    v-for="task in collectionStore.uncompletedTasks"
    :key="task.id"
    :task="task"
    :disabled="collection.archived"
    :item-name="collection.itemName"
    class="mb-2"
    @add-to-daily="addTaskToDaily($event)"
    @toggle-state="toggleTaskState"
    @update="updateTask"
    @delete="deleteTask"
  />
</template>
```

→

```vue
<template v-if="collectionStore.uncompletedTasks.length > 0">
  <SortableList
    :items="collectionStore.uncompletedTasks"
    axis="vertical"
    :disabled="collection.archived"
    :item-label="(task) => task.name"
    class="d-flex flex-column gap-2 mb-2"
    @move="moveTask"
  >
    <template #item="{ item: task, index, setHandle, moveToTop }">
      <TaskCard
        :task="task"
        :disabled="collection.archived"
        :item-name="collection.itemName"
        :set-handle
        :at-top="index === 0"
        @add-to-daily="addTaskToDaily($event)"
        @toggle-state="toggleTaskState"
        @update="updateTask"
        @delete="deleteTask"
        @move-to-top="moveToTop?.()"
      />
    </template>
  </SortableList>
</template>
```

- [ ] **Étape 8 : contrôles**

```bash
yarn lint:check
yarn type-check 2>&1 | grep -c "error TS"
yarn test --run
```

Expected : aucune erreur eslint ; toujours 2 erreurs de type ; PASS.

- [ ] **Étape 9 : premier essai dans le navigateur intégré**

`preview_start` avec `frontend` (`.claude/launch.json`, conteneurs de dev démarrés). Sur un projet
qui a au moins trois tâches générales et une section de trois tâches, puis une collection :

1. la poignée est à gauche de la case à cocher ; les tags restent alignés sous le nom ;
2. glisser par la poignée, puis par un appui de 250 ms sur le corps : la carte s'incline et
   grandit, les voisines s'écartent ; au lâcher, une requête `POST …/move/` part (onglet réseau)
   et l'ordre tient après rechargement de la page ;
3. un appui sur la case à cocher, le menu ou un chip ne soulève rien ;
4. hors de la liste : la liste se referme ; au lâcher, la carte revient, aucune requête ;
5. « Move to top » absent sur la première carte, présent et fonctionnel sur les autres ;
6. pas de poignée sur un projet archivé ni dans la vue « Completed ».

Console : aucune erreur ni avertissement Vue.

- [ ] **Étape 10 : `docs/patterns/sortable.md`**

````markdown
# Listes réordonnables

**Problème** — laisser réordonner une liste de cartes à la souris, au doigt et au clavier, en
passant par la couche de déplacement existante.

## Recette

1. Envelopper la liste dans `SortableList` (`src/components/sortable/`). Exemple réel,
   `ProjectSectionItem.vue` :

   ```vue
   <SortableList
     :items="uncompletedTasks"
     axis="vertical"
     :disabled
     :item-label="(task) => task.name"
     class="d-flex flex-column gap-2 mb-2"
     @move="moveTask"
   >
     <template #item="{ item: task, index, setHandle, moveToTop }">
       <TaskCard :task :set-handle :at-top="index === 0" @move-to-top="moveToTop?.()" />
     </template>
   </SortableList>
   ```
````

2. **La mise en page reste chez le parent** : la grille ou la colonne passe en `class` sur
   `SortableList`. `axis="vertical"` pour une colonne (la carte ne bouge qu'à la verticale au
   doigt), `axis="both"` pour une grille.
3. La carte affiche `SortableHandle` quand elle reçoit `setHandle`, et « Move to top » quand elle
   n'est pas `atTop`. Sans `setHandle`, elle se rend comme avant.
4. `@move="(id, anchors)"` va vers `store.moveTask` ou `useDailyTaskMove` : déplacement optimiste,
   file, rechargement sur 403/404/409. `SortableList` n'appelle jamais l'API.
5. `disabled` rend une liste simple (archivé, jour passé) ; une liste d'un élément aussi.
   `lockedId` : la carte en édition ne se soulève pas mais reste une cible.

## Règles

Chacune corrige un défaut constaté sur le prototype. Aucune n'est outillée.

- **Une seule `.v-card` par élément.** Les styles de la carte soulevée la ciblent, parce que la
  bibliothèque impose `transform`, `translate` et `scale` sur l'élément qu'elle déplace.
- **Aucune règle `:active` sur la carte** : elle remplace la `transition` pendant tout un glisser
  à la souris, et l'inclinaison saute.
- **Aucune bordure ni `display: none` sur l'emplacement.** La bibliothèque aligne la taille et la
  position de la carte glissée sur lui. Le repli le sort du flux en `position: absolute`, avec sa
  taille figée par des variables posées sur la liste : sur l'emplacement, elles seraient
  écrasées par la copie continue du style de la carte.
- **La classe `pressing` et la classe `collapsed` sont posées hors de Vue** (`classList`) : un
  rendu à la prise coûte une image, et le FLIP du repli doit mesurer le DOM juste avant et juste
  après le changement. Les écouteurs de `pressing` sont en capture, parce que la bibliothèque
  arrête la propagation des événements pointeur.
- **La position du pointeur se lit dans `event.to`** de `@drag-move` ; `operation.position` a un
  mouvement de retard. Les limites de la liste se mesurent à la prise et au défilement.
- **Les contrôles d'une carte ne déclenchent jamais l'appui long** : `CONTROL_SELECTOR`
  (`dnd-kit.ts`) exclut les `.v-btn`, `.v-chip`, liens et champs. Un contrôle cliquable d'un autre
  type doit y être ajouté.
- **Les internes de la bibliothèque ne se lisent que dans `dnd-kit.ts`**, dont
  `dnd-kit.spec.ts` interroge un vrai gestionnaire. Voir
  [W15](../quality/watched-risks.md#w15--dnd-kit-en-0x-internes-utilisés).

## Variantes légitimes

- La vue « Completed » n'utilise pas `SortableList` : on ne réordonne que ce qui reste à faire.
- Dans le wizard, seules les tâches du jour sont dans `SortableList` ; l'aperçu du report et la
  carte de création restent à côté, dans le même défileur.

## Écarts assumés / non migrés

- La timeline du résumé daily (`DailyDetailTaskTimeline`) ne se réordonne pas : la carte entière
  y coche la tâche.
- Pas de déplacement d'une liste à l'autre : chaque `SortableList` a son propre fournisseur.
- Sans glisser ni clavier, seul « Move to top » est disponible : laborieux sur une longue liste.

## Voir aussi

- [../adr/0008-sortable-lists-with-dnd-kit.md](../adr/0008-sortable-lists-with-dnd-kit.md)
- [../workflows/verification.md](../workflows/verification.md#listes-réordonnables)
- [../domain/glossary.md](../domain/glossary.md#réordonner)

````

- [ ] **Étape 11 : `docs/architecture/ui-layer.md`**

Ligne « Global » du tableau des niveaux :

```markdown
| **Global**              | `src/components/` (15)                 | Réutilisable **sans connaissance du domaine**, ou chip/avatar d'entité utilisé partout | `ConfirmDialog`, `HalfDialog`, `EmptyListDisplay`, `FilterChip`, `ProgressWheel`, `MainTitle`, `ProjectChip` |
````

→

```markdown
| **Global** | `src/components/` (18) | Réutilisable **sans connaissance du domaine**, ou chip/avatar d'entité utilisé partout | `ConfirmDialog`, `HalfDialog`, `EmptyListDisplay`, `FilterChip`, `ProgressWheel`, `MainTitle`, `ProjectChip`, `sortable/SortableList` |
```

Dans « Voir aussi » :

```markdown
- [../patterns/styling.md](../patterns/styling.md) · [../patterns/dialogs.md](../patterns/dialogs.md) · [../patterns/responsive.md](../patterns/responsive.md)
```

→

```markdown
- [../patterns/styling.md](../patterns/styling.md) · [../patterns/dialogs.md](../patterns/dialogs.md) · [../patterns/responsive.md](../patterns/responsive.md) · [../patterns/sortable.md](../patterns/sortable.md)
```

Puis `yarn prettier --write docs/architecture/ui-layer.md`, qui réaligne le tableau.

- [ ] **Étape 12 : `docs/domain/glossary.md`**

Avant `## Rôles utilisateur` :

```markdown
## Réordonner

| Terme                | Sens                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| **Poignée**          | Bouton `mdi-drag-vertical` à gauche d'une carte : prise immédiate à la souris, au doigt et au clavier |
| **Appui long**       | 250 ms sur le corps d'une carte, hors de ses contrôles : même prise que la poignée                    |
| **Hors de la liste** | Pointeur à plus de 50 px de la liste : elle se referme, et lâcher remet la carte à sa place           |
| **Move to top**      | Entrée du menu ⋮ qui place la carte en tête de sa liste                                               |

Se réordonnent les tâches à faire d'un projet, d'une section ou d'une collection, et les daily
tasks d'un jour qui n'est pas passé. Un conteneur archivé, la vue « Completed » et une liste
d'un seul élément n'ont pas de poignée.
```

---

### Tâche 4 : wizard daily

**Fichiers :**

- Modifier : `frontend/src/utils/daily-task.utils.ts`
- Test : `frontend/src/utils/daily-task.utils.spec.ts` (nouveau)
- Modifier : `frontend/src/views/daily/components/DailyTaskFormCard.vue`
- Modifier : `frontend/src/views/daily/daily-update/steps/task/components/DailyUpdateTaskList.vue`
- Modifier : `frontend/src/views/daily/daily-update/steps/task/DailyUpdateTask.vue`

**Interfaces :**

- Consomme : `SortableList`, `SortableHandle`, `SetHandle` (tâches 1 à 3) ;
  `useDailyTaskMove(dailyTaskList, reload)` ; `useToday()`.
- Produit :

  - `dailyTaskName(dailyTask: DailyTask): string`
  - `DailyTaskFormCard` : props `setHandle?: SetHandle`, `atTop?: boolean` ; émet
    `move-to-top: []`.
  - `DailyUpdateTaskList` : émet `move: [event: { id: number; anchors: MoveAnchors }]`.

- [ ] **Étape 1 : écrire le test de `dailyTaskName`**

```ts
import { describe, expect, it } from "vitest";
import { dailyTaskName } from "@/utils/daily-task.utils";
import { makeDailyTask, makeTask } from "@/test/fixtures";

describe("dailyTaskName", () => {
  it("prend le nom de la tâche liée, puis de la tâche commune, puis le sien", () => {
    const commonTask = { id: 1, name: "Common", tags: [] };
    expect(
      dailyTaskName(
        makeDailyTask({ task: makeTask({ name: "Linked" }), commonTask }),
      ),
    ).toBe("Linked");
    expect(dailyTaskName(makeDailyTask({ commonTask, name: "Own" }))).toBe(
      "Common",
    );
    expect(dailyTaskName(makeDailyTask({ name: "Own" }))).toBe("Own");
  });
});
```

- [ ] **Étape 2 : constater l'échec**

Run : `yarn test --run src/utils/daily-task.utils.spec.ts`
Expected : FAIL, `dailyTaskName is not a function` (ou export introuvable).

- [ ] **Étape 3 : implémenter**

`daily-task.utils.ts` :

```ts
import { DailyTaskAction } from "@/models/daily-task.model";
```

→

```ts
import { DailyTask, DailyTaskAction } from "@/models/daily-task.model";

export function dailyTaskName(dailyTask: DailyTask): string {
  return (
    dailyTask.task?.name ??
    dailyTask.commonTask?.name ??
    (dailyTask.name as string)
  );
}
```

Run : `yarn test --run src/utils/daily-task.utils.spec.ts` → PASS.

- [ ] **Étape 4 : `DailyTaskFormCard.vue`**

Imports :

```ts
import DailyTaskForm from "@/views/daily/components/DailyTaskForm.vue";
import { computed } from "vue";
```

→

```ts
import DailyTaskForm from "@/views/daily/components/DailyTaskForm.vue";
import SortableHandle from "@/components/sortable/SortableHandle.vue";
import { dailyTaskName } from "@/utils/daily-task.utils";
import { SetHandle } from "@/utils/sortable.utils";
import { computed } from "vue";
```

Props, événements, nom :

```ts
const props = defineProps<{
  dailyTask: DailyTask;
  editMode: boolean;
}>();
```

→

```ts
const props = defineProps<{
  dailyTask: DailyTask;
  editMode: boolean;
  setHandle?: SetHandle;
  atTop?: boolean;
}>();
```

```ts
  select: [data: { tab: DailyUpdateTaskTab; id: number; sectionId?: number }]
}>()

const name = computed<string>(() => {
  if (props.dailyTask.task) return props.dailyTask.task.name
  else if (props.dailyTask.commonTask) return props.dailyTask.commonTask.name
  else return props.dailyTask.name as string // We know name is defined
})
```

→

```ts
  select: [data: { tab: DailyUpdateTaskTab; id: number; sectionId?: number }]
  'move-to-top': []
}>()

const name = computed<string>(() => dailyTaskName(props.dailyTask))
```

Après `deleteDailyTask` :

```ts
function moveToTop(): void {
  emit("move-to-top");
}
```

Template, poignée avant le contenu (la carte est déjà en `flex`, centrée, `gap: 8px`) :

```vue
<template v-if="!editMode && dailyTask">
  <div class="daily-task-form-card__content"></div>
</template>
```

→

```vue
<template v-if="!editMode && dailyTask">
  <SortableHandle v-if="setHandle" :set-handle :label="`Reorder ${name}`" />
  <div class="daily-task-form-card__content"></div>
</template>
```

Menu, avant l'entrée « Edit » :

```vue
<v-list-item v-if="setHandle && !atTop" @click="moveToTop()">
                <v-list-item-title class="d-flex align-center">
                  <v-icon icon="mdi-arrow-collapse-up" size="small" start />
                  Move to top
                </v-list-item-title>
              </v-list-item>
```

- [ ] **Étape 5 : `DailyUpdateTaskList.vue`**

Imports :

```ts
import EmptyListDisplay from "@/components/EmptyListDisplay.vue";
import DailyTaskFormCard from "@/views/daily/components/DailyTaskFormCard.vue";
```

→

```ts
import EmptyListDisplay from "@/components/EmptyListDisplay.vue";
import SortableList from "@/components/sortable/SortableList.vue";
import { useToday } from "@/composables/useToday";
import { MoveAnchors } from "@/models/ordering.model";
import { dailyTaskName } from "@/utils/daily-task.utils";
import DailyTaskFormCard from "@/views/daily/components/DailyTaskFormCard.vue";
```

Événements :

```ts
  'carry-over': []
}>()
```

→

```ts
  'carry-over': []
  move: [event: { id: number; anchors: MoveAnchors }]
}>()

const { today } = useToday()
```

Après `carryOverTitle` :

```ts
const isPastDay = computed<boolean>(() =>
  today.value.isAfter(props.date, "day"),
);
```

Après `deleteDailyTask` :

```ts
function moveDailyTask(id: number, anchors: MoveAnchors): void {
  emit("move", { id, anchors });
}
```

Template, tâches du jour seules dans la liste réordonnable :

```vue
<div class="daily-task-wrapper"></div>
```

→

```vue
<div class="daily-task-wrapper"></div>
```

- [ ] **Étape 6 : `DailyUpdateTask.vue`**

Imports :

```ts
import { useToday } from "@/composables/useToday";
```

→

```ts
import { useDailyTaskMove } from "@/composables/useDailyTaskMove";
import { useToday } from "@/composables/useToday";
```

Après `const carryOverInProgress = ref(false)` :

```ts
const { moveDailyTask } = useDailyTaskMove(
  dailyTaskList,
  retrieveDailyTaskList,
);
```

Template :

```vue
@select="select($event)" @carry-over="carryOverPreviousDay()" />
```

→

```vue
@select="select($event)" @carry-over="carryOverPreviousDay()"
@move="moveDailyTask($event.id, $event.anchors)" />
```

- [ ] **Étape 7 : contrôles et essai**

```bash
yarn lint:check
yarn type-check 2>&1 | grep -c "error TS"
yarn test --run
```

Expected : aucune erreur eslint ; toujours 2 erreurs de type ; PASS.

Dans le navigateur intégré, wizard d'aujourd'hui puis d'un jour à venir : glisser, appui long,
« Move to top » ; une carte en édition ne se soulève pas mais les autres passent par-dessus ;
l'aperçu du report et la carte de création ne bougent pas ; sur mobile (`resize_window` 375 ×
812), la feuille ne se tire que par son en-tête.

---

### Tâche 5 : navbar inerte pendant un glisser

**Fichiers :**

- Modifier : `frontend/src/layout/AuthenticatedLayout.vue`
- Modifier : `frontend/docs/architecture/state.md`

**Interfaces :**

- Consomme : `dragInProgress` (tâche 2), écrit par `SortableList` (tâche 3).

- [ ] **Étape 1 : garde**

```ts
import { ref } from "vue";
import { useNotificationStore, useUserStore } from "@/store";
```

→

```ts
import { ref } from "vue";
import { dragInProgress } from "@/components/sortable/dnd-kit";
import { useNotificationStore, useUserStore } from "@/store";
```

```ts
function showNavbar(): void {
  if (!mobile.value) return
```

→

```ts
function showNavbar(): void {
  if (!mobile.value || dragInProgress.value) return
```

```ts
function hideNavbar(): void {
  if (!mobile.value) return
```

→

```ts
function hideNavbar(): void {
  if (!mobile.value || dragInProgress.value) return
```

- [ ] **Étape 2 : `docs/architecture/state.md`**

Dans « Contraintes non évidentes », après la puce sur l'ordre des tâches :

```markdown
- **`dragInProgress` (`src/components/sortable/dnd-kit.ts`) est un `ref` de module, hors
  Pinia.** Écrit par `SortableList` seul, lu par `AuthenticatedLayout` pour ignorer les
  balayages de la navbar pendant un glisser : ce n'est pas un état transverse au sens de la
  règle ci-dessus. Il repasse à `false` une tâche après la fin du glisser, pour que le
  `touchend` qui suit le `pointerup` le voie encore.
```

- [ ] **Étape 3 : contrôles**

`yarn lint:check` et `yarn type-check 2>&1 | grep -c "error TS"` : aucune erreur eslint,
toujours 2 erreurs de type. L'effet ne se vérifie que sur un vrai téléphone (tâche 7).

---

### Tâche 6 : procédure d'essai manuel

**Fichiers :** `frontend/docs/workflows/verification.md`

- [ ] **Étape 1 : étape 3 de la procédure**

```markdown
3. `yarn test` — couvre `utils/`, `pipes/`, `api/`, `axios/`, l'ordre dans les stores `project` et
   `collection`, et `useDailyTaskMove`. **Les composants, le reste des stores et des composables,
   et les guards ne sont pas couverts** : voir
```

→

```markdown
3. `yarn test` — couvre `utils/`, `pipes/`, `api/`, `axios/`, l'ordre dans les stores `project` et
   `collection`, `useDailyTaskMove`, et le contrat avec `@dnd-kit` (`dnd-kit.spec.ts`). **Les
   composants, le reste des stores et des composables, et les guards ne sont pas couverts** : voir
```

- [ ] **Étape 2 : section « Listes réordonnables »**

Avant `## Pièges` :

```markdown
## Listes réordonnables

**Quand** — tout changement dans `src/components/sortable/`, dans une carte qui porte une
poignée, ou une montée de version de `@dnd-kit/*`. jsdom n'a pas de mise en page : aucun test ne
voit un glisser.

Sur les quatre listes (tâches générales d'un projet, section, collection, « Tasks of the day » du
wizard) :

1. **Souris** : prise immédiate par la poignée, appui de 250 ms sur le corps ; case à cocher, menu
   et chips ne soulèvent rien. Les voisines s'écartent sans à-coup.
2. **Hors de la liste** (au-delà de 50 px) : la liste se referme ; lâcher remet la carte à sa
   place, et aucune requête `move` ne part.
3. **Clavier** : Tab jusqu'à la poignée, Espace, flèches, Espace ; Échap annule. Les annonces
   s'écrivent dans les régions `aria-live` de la page.
4. **Liste périmée** : la même liste dans deux onglets ; supprimer une tâche dans le second, puis
   déplacer une carte à côté d'elle dans le premier. Attendu : « This list changed elsewhere and
   has been reloaded » et la liste rechargée.
5. **Pas de poignée** : projet ou collection archivé, vue « Completed », liste d'une tâche, jour
   passé du wizard.

Puis sur un **vrai téléphone**, iOS et Android : la page défile quand le doigt bouge avant
250 ms ; ni menu contextuel ni sélection de texte à l'appui long ; vibration à la prise
(Android) ; la navbar ne s'ouvre pas pendant un glisser latéral ; fluidité.
```

---

### Tâche 7 : vérification de bout en bout

**Fichiers :** aucun, sauf le compteur de tests de `frontend/docs/workflows/verification.md`.

- [ ] **Étape 1 : contrôles**

```bash
yarn prettier --write src/components/sortable src/utils/sortable.utils.ts src/utils/sortable.utils.spec.ts src/utils/daily-task.utils.ts src/utils/daily-task.utils.spec.ts src/test/setup.ts docs
yarn lint:check
yarn format:check
yarn type-check 2>&1 | grep -c "error TS"
yarn test:ci
```

Expected : PASS ; 2 erreurs de type, comme avant. Remplacer « 93 tests Vitest » dans
`docs/workflows/verification.md` par le nombre affiché par `yarn test:ci`.

- [ ] **Étape 2 : essai complet dans le navigateur intégré**

Dérouler la section « Listes réordonnables » de `verification.md`, points 1 à 5, sur les quatre
listes. En plus :

- **Annonces** : lire le texte des régions `aria-live` (`read_page`) après une prise, un
  déplacement au clavier, une sortie, un dépôt et une annulation ; chaque texte est celui de la
  spec, avec les bonnes positions.
- **Liste qui change pendant un glisser** : avec `javascript_tool` (débogage seulement), retarder
  de 2 s puis faire échouer en 409 les requêtes `…/move/` ; déposer une carte, puis en reprendre
  une autre avant la fin du délai. Attendu : le glisser en cours s'annule, la liste rechargée
  s'affiche, et l'ordre du DOM correspond aux données (aucune carte dupliquée ni manquante).
- **Fluidité** : pendant un glisser avec défilement automatique, aucune image au-delà de 17 ms
  hors la toute première prise (Performance ou `requestAnimationFrame` échantillonné).
- **Mouvement réduit** : `prefers-reduced-motion` émulé, la carte glissée reste à plat et sans
  agrandissement.

- [ ] **Étape 3 : téléphone**

À faire par le mainteneur : le paragraphe « vrai téléphone » de la même section, sur iOS et
Android. Le lot n'est pas terminé sans cet essai (spec § 6).

---

### Tâche 8 : message de commit

- [ ] **Étape 1 : rédiger**

Un seul commit, en anglais, sans `Co-Authored-By`. Écrire dans le scratchpad :

```
feat(front): reorder tasks and daily tasks by drag and drop

add a sortable list on dnd-kit with a handle, a long press and keyboard support
lift the dragged card with a tilt and put it back when dropped outside the list
add a move to top entry to the task and daily task menus
wire the project, section, collection and daily lists to the move layer
keep the navbar closed while a card is dragged
document the sortable pattern, the dnd-kit decision and its watched risk
```

Si le mainteneur inclut la spec et le plan (`docs/superpowers/`) dans ce commit, ajouter la ligne
`add the drag and drop design and implementation plan`.

- [ ] **Étape 2 : valider et copier**

```bash
awk 'length($0) > 100 {print NR}' <fichier>
npx --no-install commitlint --edit <fichier>
pbcopy < <fichier>
```

Remettre le message au mainteneur, avec `git commit -F <fichier>` en repli.
