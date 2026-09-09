<script setup lang="ts">
import { DailyTaskSheetDetent } from '@/models/daily-task.model'
import { hideScroll, showScroll } from '@/utils/document.utils'
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useDisplay } from 'vuetify'

// Distance minimale d'un glissé lent pour changer de cran. En dessous, la feuille revient à son
// cran de départ
const DRAG_SNAP_THRESHOLD = 48
// Au-delà de cette vitesse (px/ms), un lancer change de cran quelle que soit la distance
const FLICK_VELOCITY = 0.5
// Un lancer vers le haut au-delà de cette vitesse ouvre directement en grand, sans s'arrêter au
// cran intermédiaire
const FAST_FLICK_VELOCITY = 1.5
// Distance minimale d'un lancer : sans ce garde, un tremblement de 3px en 5ms vaut 0,6px/ms et un
// simple tap partirait en lancer
const FLICK_MIN_DISTANCE = 16
// Fenêtre minimale d'un relevé de vitesse pendant le mouvement, en dessous de laquelle la mesure
// n'est que le bruit de la cadence d'échantillonnage du tactile
const VELOCITY_SAMPLE_MS = 30
// Tolérance de tremblement d'un tap, alignée sur celle des navigateurs mobiles. En dessous, le
// geste reste un tap ; au-delà c'est un glissé, qui revient à son cran s'il n'atteint pas
// `DRAG_SNAP_THRESHOLD`
const TAP_SLOP = 8

const { smAndDown } = useDisplay()

const detent = defineModel<DailyTaskSheetDetent>({ default: DailyTaskSheetDetent.Collapsed })

const dragging = ref(false)
const content = useTemplateRef<HTMLElement>('content')
const panel = useTemplateRef<HTMLElement>('panel')

const collapsed = computed<boolean>(() => detent.value === DailyTaskSheetDetent.Collapsed)

// L'ordre fait foi : `detentOffsets()` rend les positions dans le même, et avancer d'un cran
// revient à avancer d'un index
const detents = [
  DailyTaskSheetDetent.Collapsed,
  DailyTaskSheetDetent.Half,
  DailyTaskSheetDetent.Full,
]

let visibilityObserver: IntersectionObserver | null = null
// Positions `translateY` des trois crans, en pixels, relevées au début de chaque geste
let dragOffsets: number[] = []
// Doigt suivi : un second doigt posé sur la feuille ne doit pas détourner le glissé en cours
let dragTouchId: number | null = null
let dragStartY = 0
// Position du panneau au début du geste, lue dans sa matrice de transformation
let dragBase = 0
// Déplacement appliqué au panneau, borné aux crans extrêmes
let dragDelta = 0
// Vrai dès que le doigt a bougé, pour ne pas confondre la fin d'un glissé avec un tap
let dragMoved = false
// Signée : positive vers le bas, en px/ms
let dragVelocity = 0
let lastSample = { y: 0, at: 0 }
// Vrai quand le geste part du contenu : la feuille ne s'y laisse que refermer
let dragClosingOnly = false
// Le changement de cran vient de `settle()`, qui libère lui-même la traînée à l'image suivante
let settling = false

// L'étape inactive du stepper passe en `display: none` sans démonter ce composant : sans ce
// repli, basculer sur Event feuille ouverte laisserait le scroll de fond verrouillé
onMounted(() => {
  if (!panel.value) return

  visibilityObserver = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting && !collapsed.value) detent.value = DailyTaskSheetDetent.Collapsed
  })
  visibilityObserver.observe(panel.value)
})

watch(
  detent,
  value => {
    if (!smAndDown.value) return

    if (value !== DailyTaskSheetDetent.Collapsed) hideScroll()
    else {
      showScroll()
      // Repliée, la feuille ne laisse voir que son en-tête : sans cette remise à zéro ce serait
      // le milieu de la liste qui dépasserait
      if (content.value) content.value.scrollTop = 0
    }
  },
  // `post` est structurel : en `pre`, l'écriture de `scrollTop` force un recalcul avant le
  // ré-affichage, donc sur une classe de cran périmée et une traînée déjà compensée — le panneau
  // part alors à l'écart des deux crans avant de rejoindre sa cible
  { flush: 'post' }
)

// Une bascule venue d'ailleurs que du glissé — tap sur la zone de préhension, clic sur un chip,
// repli par le parent — tombe pendant que `dragStart` a suspendu la transition. En `pre`, la
// libération et le changement de classe s'affichent dans la même passe et la bascule anime ; en
// `post` la classe serait déjà peinte sans transition
watch(detent, () => {
  if (!settling) releaseDrag()
})

// Le verrou de défilement est posé par largeur d'écran : en franchissant le seuil vers le bureau
// il resterait posé sur une mise en page où la page, elle, doit défiler
watch(smAndDown, value => {
  if (value) return

  detent.value = DailyTaskSheetDetent.Collapsed
  showScroll()
})

onBeforeUnmount(() => {
  visibilityObserver?.disconnect()
  showScroll()
})

// Zone de préhension : c'est le seul contrat entre la feuille et son contenu. La poignée la porte,
// l'en-tête de `DailyUpdateTaskList` aussi, ce qui évite d'exposer la mécanique des crans
function dragZone(event: Event): HTMLElement | null {
  return (event.target as HTMLElement).closest('.task-sheet__drag-zone')
}

function trackedTouch(touches: TouchList): Touch | undefined {
  return Array.from(touches).find(touch => touch.identifier === dragTouchId)
}

// Décalages `translateY` des trois crans. Le panneau mesurant `--sheet-detent-full`, le rapport
// des deux variables donne le cran médian en pixels : les deux doivent donc rester exprimées dans
// la même unité. C'est ce qui évite de résoudre `svh` en JS, où `innerHeight` n'est pas `svh`
// quand la barre d'URL est visible
function detentOffsets(element: HTMLElement): number[] {
  const style = getComputedStyle(element)
  const height = element.getBoundingClientRect().height
  const halfRatio =
    parseFloat(style.getPropertyValue('--sheet-detent-half')) /
    parseFloat(style.getPropertyValue('--sheet-detent-full'))

  return [
    height - parseFloat(style.getPropertyValue('--sheet-collapsed-height')),
    height - height * halfRatio,
    0,
  ]
}

// Échantillonne sans condition de fenêtre : c'est l'appelant qui décide quand relever
function sampleVelocity(y: number, at: number): void {
  const elapsed = at - lastSample.at
  if (elapsed <= 0) return

  dragVelocity = (y - lastSample.y) / elapsed
  lastSample = { y, at }
}

function dragStart(event: TouchEvent): void {
  if (dragging.value || !smAndDown.value || !panel.value) return

  // Hors zone de préhension le geste part du contenu : il n'est repris que feuille déployée et
  // défileur en haut, sinon il appartient à la liste
  const closingOnly = !dragZone(event)
  if (closingOnly && (collapsed.value || (content.value?.scrollTop ?? 0) > 0)) return

  const touch = event.changedTouches[0]

  dragClosingOnly = closingOnly
  dragOffsets = detentOffsets(panel.value)
  // La position réelle et non celle du cran : saisir la feuille en pleine transition la prend là
  // où elle se trouve, sans saut
  dragBase = new DOMMatrix(getComputedStyle(panel.value).transform).m42
  dragTouchId = touch.identifier
  dragStartY = touch.clientY
  dragDelta = 0
  dragMoved = false
  dragVelocity = 0
  lastSample = { y: dragStartY, at: event.timeStamp }
  dragging.value = true
}

function drag(event: TouchEvent): void {
  if (!dragging.value || !panel.value) return

  const touch = trackedTouch(event.touches)
  if (!touch) return

  const [collapsedOffset] = dragOffsets
  // Le drapeau se mesure sur le doigt, pas sur la traînée bornée : en butée le panneau ne bouge
  // pas, et le glissé passerait alors pour un tap — la feuille changerait de cran à l'envers
  const distance = touch.clientY - dragStartY
  if (Math.abs(distance) > TAP_SLOP) dragMoved = true

  // Bornes : ni au-dessus du cran haut, ni sous le replié. Depuis le contenu la borne haute est 0,
  // la feuille n'y remonte pas, et elle ne suit le doigt qu'au-delà de la tolérance de tap pour ne
  // pas trembler sous un appui sur une carte
  const highest = dragClosingOnly ? 0 : -dragBase
  const travelled = dragClosingOnly && !dragMoved ? 0 : distance
  dragDelta = Math.min(Math.max(travelled, highest), collapsedOffset - dragBase)

  if (event.timeStamp - lastSample.at >= VELOCITY_SAMPLE_MS) {
    sampleVelocity(touch.clientY, event.timeStamp)
  }

  // Les trois transformations de cran composent cette variable : les positions restent en CSS, le
  // JS ne fournit que la traînée
  panel.value.style.setProperty('--sheet-drag', `${dragDelta}px`)
}

// Cran d'arrivée. Deux régimes : le lancer, qui décide sur la vitesse, et le glissé posé, qui
// décide sur la distance parcourue
function releasedDetent(): DailyTaskSheetDetent {
  const flicked =
    Math.abs(dragVelocity) > FLICK_VELOCITY && Math.abs(dragDelta) > FLICK_MIN_DISTANCE

  // Vers le bas, la feuille se referme entièrement depuis n'importe quel cran
  if (dragDelta > 0 && (flicked || dragDelta > DRAG_SNAP_THRESHOLD)) {
    return DailyTaskSheetDetent.Collapsed
  }
  if (flicked) {
    return dragVelocity < -FAST_FLICK_VELOCITY
      ? DailyTaskSheetDetent.Full
      : detents[Math.min(detents.indexOf(detent.value) + 1, detents.length - 1)]
  }
  if (dragDelta >= -DRAG_SNAP_THRESHOLD) return detent.value

  // Glissé posé vers le haut : la feuille se pose sur le cran le plus proche du doigt
  const released = dragBase + dragDelta
  const nearest = dragOffsets.reduce(
    (best, offset, index) =>
      Math.abs(offset - released) < Math.abs(dragOffsets[best] - released) ? index : best,
    0
  )

  return detents[nearest]
}

function releaseDrag(): void {
  dragging.value = false
  panel.value?.style.removeProperty('--sheet-drag')
}

// Le panneau garde la position du doigt pendant le changement de cran, la transition part donc de
// là : effacer la traînée avant le changement le ferait remonter d'un coup au cran de départ
function settle(target: DailyTaskSheetDetent): void {
  if (!panel.value) return

  const offset = dragOffsets[detents.indexOf(target)]

  // N'armer le drapeau que si le cran change vraiment : sinon un tap dans le contenu bloquerait la
  // libération que réclame le clic qui suit
  settling = target !== detent.value
  detent.value = target
  panel.value.style.setProperty('--sheet-drag', `${dragBase + dragDelta - offset}px`)

  // L'image suivante donne à la transition son point de départ ; tout libérer dans le même temps
  // ferait sauter le panneau sans animer
  requestAnimationFrame(() => {
    settling = false
    releaseDrag()
  })
}

function dragEnd(event: TouchEvent): void {
  if (!dragging.value || !panel.value) return

  // Un autre doigt qui se lève ne termine pas le glissé
  const touch = trackedTouch(event.changedTouches)
  if (!touch) return

  // Relevé final sans fenêtre : il annule la vitesse quand le doigt s'est immobilisé avant de
  // lever, et il rattrape les gestes plus courts que la fenêtre, qui sortiraient sinon à vitesse
  // nulle faute d'un seul relevé
  sampleVelocity(touch.clientY, event.timeStamp)
  dragTouchId = null

  settle(releasedDetent())
}

function toggle(event: MouseEvent): void {
  if (!smAndDown.value || dragMoved) return

  const zone = dragZone(event)
  const interactive = (event.target as HTMLElement).closest('button, a, [role="button"]')
  // La poignée est elle-même un `<button>` : le filtre ne doit pas l'exclure
  if (!zone || (interactive && interactive !== zone)) return

  detent.value = collapsed.value ? DailyTaskSheetDetent.Half : DailyTaskSheetDetent.Collapsed
}
</script>

<template>
  <div
    class="task-sheet"
    :class="{
      'task-sheet--dragging': dragging,
      'task-sheet--half': detent === DailyTaskSheetDetent.Half,
      'task-sheet--full': detent === DailyTaskSheetDetent.Full,
    }">
    <Transition name="task-sheet__scrim">
      <div
        v-if="smAndDown && !collapsed"
        class="task-sheet__scrim"
        @click="detent = DailyTaskSheetDetent.Collapsed" />
    </Transition>

    <div
      ref="panel"
      class="task-sheet__panel"
      @touchstart="dragStart($event)"
      @touchmove="drag($event)"
      @touchend="dragEnd($event)"
      @touchcancel="dragEnd($event)"
      @click="toggle($event)">
      <!-- La poignée reste un `<button>` pour rester atteignable au clavier, où elle bascule
           d'un cran comme au tap -->
      <button
        v-if="smAndDown"
        type="button"
        class="task-sheet__handle task-sheet__drag-zone"
        :aria-expanded="!collapsed"
        :aria-label="collapsed ? 'Expand tasks of the day' : 'Collapse tasks of the day'" />

      <div ref="content" class="task-sheet__content">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use '@/styles/breakpoints' as variables;

// Hors mobile la feuille n'existe pas : `display: contents` efface les trois niveaux d'emballage
// pour que le contenu reste l'enfant flex direct de `.daily-update-task`
.task-sheet,
.task-sheet__panel,
.task-sheet__content {
  display: contents;
}

@media #{map.get(variables.$display-breakpoints, 'sm-and-down')} {
  .task-sheet {
    --sheet-collapsed-height: 56px;
    // Les deux crans doivent rester dans la même unité : `detentOffsets()` les convertit en
    // pixels par leur rapport
    --sheet-detent-half: 55svh;
    --sheet-detent-full: 95svh;
    --sheet-content-padding-bottom: 16px;
    // Écart visible voulu sous le dernier projet. Le `gap` de `.daily-update-task` (8px) et le
    // padding bas du conteneur (12px) séparent déjà le contenu du bas de l'écran : ils sont
    // retirés de la réserve pour que cette variable soit bien l'écart mesurable à l'arrivée
    --sheet-content-gap: 8px;

    // Le panneau étant en `position: fixed`, cet emballage reste dans le flux et y réserve la
    // hauteur de la partie repliée : le dernier projet ne passe donc jamais dessous
    display: block;
    height: calc(var(--sheet-collapsed-height) + var(--sheet-content-gap) - 8px - 12px);

    // Même valeur que les overlays Vuetify (`$overlay-scrim-background` / `$overlay-opacity`)
    &__scrim {
      position: fixed;
      inset: 0;
      z-index: 1009;
      background: rgb(0, 0, 0, 0.32);
      // Même durée et même courbe que le panneau, pour que voile et feuille bougent ensemble
      transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &-enter-from,
      &-leave-to {
        opacity: 0;
      }
    }

    &__panel {
      // `fixed` échappe aux ancêtres en `overflow: hidden` (`.v-window`, le `.v-sheet` du
      // stepper) qui interdisent tout `position: sticky` ici
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      // Au-dessus de la barre d'application (1004) pour que le voile la couvre, et sous les
      // overlays Vuetify (2400) pour que les dialogs de tâche restent devant. Le tiroir de
      // navigation est remonté au-dessus dans `global.scss`
      z-index: 1010;
      display: flex;
      flex-direction: column;
      height: var(--sheet-detent-full);
      padding: 0 16px;
      background: rgb(var(--v-theme-surface-container-high));
      border-radius: 8px 8px 0 0;
      // Élévation 5 (le maximum en MD3), décalages Y inversés : une feuille ancrée en bas porte
      // son ombre vers le haut
      box-shadow:
        0 -4px 4px rgb(var(--v-shadow-color), 0.3),
        0 -8px 12px 6px rgb(var(--v-shadow-color), 0.15);
      // Chaque cran compose `--sheet-drag` : le panneau garde ses positions en CSS et suit le
      // doigt sans que le JS ait à les recalculer
      transform: translateY(calc(100% - var(--sheet-collapsed-height) + var(--sheet-drag, 0px)));
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    &--half &__panel {
      transform: translateY(
        calc(var(--sheet-detent-full) - var(--sheet-detent-half) + var(--sheet-drag, 0px))
      );
    }

    &--full &__panel {
      transform: translateY(var(--sheet-drag, 0px));
    }

    // Pendant le glissé la position vient du doigt : une transition la ferait traîner derrière lui
    &--dragging &__panel {
      transition: none;
    }

    // `:deep` porte jusqu'à l'en-tête de la liste, qui vient du slot. Sans ça le navigateur
    // interpréterait le glissé comme un défilement de page
    :deep(.task-sheet__drag-zone) {
      touch-action: none;
    }

    &__handle {
      position: relative;
      flex: 0 0 auto;
      height: 16px;
      padding: 0;
      border: none;
      // Opaque et au-dessus de la liste : les bords de la feuille tombent sur des demi-pixels
      // (`90svh` = 730,8px sur 812), le clip du défileur et la peinture de l'en-tête collant sont
      // arrondis séparément, et une ligne d'un pixel de la liste fuyait entre les deux. Les
      // cartes étant en `position: relative; z-index: 0`, un fond opaque sans `z-index` ne
      // suffirait pas — elles sont après la poignée dans l'arbre
      background: rgb(var(--v-theme-surface-container-high));
      cursor: pointer;
      z-index: 1;

      &::before {
        content: '';
        position: absolute;
        top: 6px;
        left: 50%;
        width: 36px;
        height: 4px;
        border-radius: 2px;
        background: rgb(var(--v-border-color), 0.4);
        transform: translateX(-50%);
      }
    }

    &__content {
      display: block;
      flex: 1 1 auto;
      min-height: 0;
      // Repliée, la feuille n'expose que son en-tête : la laisser défiler ferait glisser du
      // contenu invisible sous la bande repliée
      overflow: hidden;
    }

    // Le panneau mesure toujours le cran haut : à mi-hauteur, sa partie basse est hors écran.
    // Cette marge la retire du défileur, sinon la fin de la liste serait défilable mais invisible
    // sous le bord de l'écran
    &--half &__content {
      margin-bottom: calc(var(--sheet-detent-full) - var(--sheet-detent-half));
    }

    &--half &__content,
    &--full &__content {
      overflow-y: auto;
      // Le glissé de fermeture part du défileur en butée haute : sans ça il se prolongerait en
      // défilement de l'ancêtre
      overscroll-behavior: contain;
      padding-bottom: var(--sheet-content-padding-bottom);
    }
  }
}
</style>
