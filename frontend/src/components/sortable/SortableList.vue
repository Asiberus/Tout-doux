<script setup lang="ts" generic="T extends { id: number }">
import {
  DragDropManager,
  DragDropProvider,
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/vue'
import { computed, nextTick, shallowRef, useId, useTemplateRef, watch } from 'vue'
import SortableItem from '@/components/sortable/SortableItem.vue'
import {
  REORDER_DURATION_MS,
  REORDER_EASING,
  SENSORS,
  createPlugins,
  dragInProgress,
  isTouchOrPen,
  revertToInitialIndex,
  sortablePosition,
} from '@/components/sortable/dnd-kit'
import { MoveAnchors } from '@/models/ordering.model'
import { anchorsAt } from '@/utils/ordering.utils'
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
} from '@/utils/sortable.utils'

const PICKUP_VIBRATION_MS = 10
// Doublon de la transition de la carte dans SortableItem.vue : changer les deux ensemble
const CARD_TRANSITION = { duration: 150, easing: 'ease-out' }
const CARD_PROPERTIES = ['rotate', 'scale', 'opacity'] as const

const props = withDefaults(
  defineProps<{
    items: T[]
    itemLabel: (item: T) => string
    disabled?: boolean
    lockedId?: number | null
  }>(),
  { disabled: false, lockedId: null }
)

const emit = defineEmits<{
  move: [id: number, anchors: MoveAnchors]
}>()

defineSlots<{
  item(props: { item: T; index: number; setHandle?: SetHandle; moveToTop?: () => void }): unknown
}>()

const group = useId()
const container = useTemplateRef<HTMLElement>('container')
const plugins = createPlugins({
  dragstart: announceDragStart,
  dragover: announceDragOver,
  dragend: announceDragEnd,
})

const frozenItems = shallowRef<T[] | null>(null)
const announcement = shallowRef('')

let activeManager: DragDropManager | null = null
let itemsAtDragStart: T[] = []
let resyncAfterDrag = false
let bounds: Bounds | null = null
let frozenHeight: number | null = null
let outside = false
let revertInProgress = false
let announcedIndex: number | null = null

const rendered = computed<T[]>(() => frozenItems.value ?? props.items)
const sortable = computed<boolean>(() => !props.disabled && rendered.value.length > 1)
const itemOrder = computed<string>(() => props.items.map(({ id }) => id).join(','))

watch(itemOrder, () => {
  if (!activeManager) return
  frozenItems.value = itemsAtDragStart
  resyncAfterDrag = true
  activeManager.actions.stop({ canceled: true })
})

function labelOf(id: number): string {
  const item = rendered.value.find(candidate => candidate.id === id)
  return item ? props.itemLabel(item) : ''
}

function announceDragStart({ operation }: DragStartEvent): string | undefined {
  const source = sortablePosition(operation.source)
  if (!source) return undefined
  announcedIndex = source.index
  return pickedUpMessage(labelOf(source.id), source.index, rendered.value.length)
}

function announceDragOver({ operation }: DragOverEvent): string | undefined {
  const source = sortablePosition(operation.source)
  if (!source || outside || source.index === announcedIndex) return undefined
  announcedIndex = source.index
  return positionMessage(source.index, rendered.value.length)
}

function announceDragEnd({ operation, canceled }: DragEndEvent): string | undefined {
  const source = sortablePosition(operation.source)
  if (!source) return undefined
  const total = rendered.value.length
  return canceled
    ? cancelledMessage(labelOf(source.id), source.initialIndex, total)
    : droppedMessage(labelOf(source.id), source.index, total)
}

function measureBounds(): void {
  if (container.value) bounds = listBounds(container.value.getBoundingClientRect(), frozenHeight)
}

// FLIP : chaque voisine est mesurée avant le changement ; la fonction rendue la fait partir de son
// ancienne place une fois le changement appliqué
function captureLayout(list: HTMLElement): () => void {
  const neighbours = [...list.children].filter(
    child => !child.hasAttribute('data-dnd-dragging') && !child.hasAttribute('data-dnd-placeholder')
  )
  const before = new Map(neighbours.map(child => [child, child.getBoundingClientRect()]))

  return () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    for (const child of neighbours) {
      const from = before.get(child)
      if (!from) continue
      const to = child.getBoundingClientRect()
      const dx = from.left - to.left
      const dy = from.top - to.top
      if (dx || dy)
        child.animate([{ translate: `${dx}px ${dy}px` }, { translate: '0 0' }], {
          duration: REORDER_DURATION_MS,
          easing: REORDER_EASING,
        })
    }
  }
}

function animateReflow(list: HTMLElement, mutate: () => void): void {
  const play = captureLayout(list)
  mutate()
  play()
}

// La bibliothèque déplace la carte glissée dans le DOM quand l'emplacement change de place, ce qui
// annule ses transitions CSS ; une animation créée par script survit au déplacement
function captureDraggedCard(list: HTMLElement): () => void {
  const card = list.querySelector<HTMLElement>(':scope > [data-dnd-dragging] .v-card')
  if (!card) return () => {}
  const style = getComputedStyle(card)
  const from = Object.fromEntries(CARD_PROPERTIES.map(property => [property, style[property]]))

  return () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    card.animate([{ ...from, offset: 0 }], CARD_TRANSITION)
  }
}

function setCollapsed(collapsed: boolean): void {
  const list = container.value
  if (!list) return

  const placeholder = list.querySelector(':scope > [data-dnd-placeholder]')
  if (collapsed && placeholder) {
    const { width, height } = placeholder.getBoundingClientRect()
    list.style.setProperty('--placeholder-width', `${width}px`)
    list.style.setProperty('--placeholder-height', `${height}px`)
  }
  const playCard = captureDraggedCard(list)
  animateReflow(list, () => list.classList.toggle('collapsed', collapsed))
  playCard()
}

function leaveList(manager: DragDropManager): void {
  if (bounds) frozenHeight = bounds.bottom - bounds.top
  setCollapsed(true)
  revertToInitialIndex(manager, allowed => (revertInProgress = allowed))

  const source = sortablePosition(manager.dragOperation.source)
  if (source)
    announcement.value = outsideMessage(
      labelOf(source.id),
      source.initialIndex,
      rendered.value.length
    )
}

function enterList(): void {
  frozenHeight = null
  setCollapsed(false)
  measureBounds()
  announcement.value = ''
}

function onDragStart({ operation }: DragStartEvent, manager: DragDropManager): void {
  activeManager = manager
  itemsAtDragStart = [...props.items]
  dragInProgress.value = true
  measureBounds()
  window.addEventListener('scroll', measureBounds, {
    capture: true,
    passive: true,
  })
  if (isTouchOrPen(operation.activatorEvent)) navigator.vibrate?.(PICKUP_VIBRATION_MS)
}

function onDragMove({ to, nativeEvent }: DragMoveEvent, manager: DragDropManager): void {
  if (!to || !bounds || nativeEvent instanceof KeyboardEvent) return

  const isOut = isOutside(bounds, to, OUTSIDE_MARGIN_PX)
  if (isOut === outside) return

  outside = isOut
  if (outside) leaveList(manager)
  else enterList()
}

function onDragOver(event: DragOverEvent): void {
  if (outside && !revertInProgress) event.preventDefault()
}

function onDragEnd({ operation, canceled }: DragEndEvent): void {
  window.removeEventListener('scroll', measureBounds, { capture: true })
  activeManager = null
  // Le `touchend` qui suit le `pointerup` doit encore voir le glisser : `v-touch` y lirait un
  // balayage et ouvrirait la navbar
  setTimeout(() => (dragInProgress.value = false))

  const droppedOutside = outside
  outside = false
  bounds = null
  frozenHeight = null
  if (droppedOutside) setCollapsed(false)

  if (resyncAfterDrag) {
    resyncAfterDrag = false
    // La bibliothèque rétablit d'abord l'ordre du DOM qu'elle a modifié ; Vue applique ensuite la
    // nouvelle liste sur un DOM qui correspond de nouveau à ses nœuds virtuels
    requestAnimationFrame(() => (frozenItems.value = null))
    return
  }

  const source = sortablePosition(operation.source)
  if (canceled || droppedOutside || !source) return

  const anchors = anchorsAt(rendered.value, source.id, source.index)
  if (anchors) emit('move', source.id, anchors)
}

async function moveToTop(item: T): Promise<void> {
  const anchors = anchorsAt(rendered.value, item.id, 0)
  if (!anchors) return

  const list = container.value
  const play = list && captureLayout(list)
  emit('move', item.id, anchors)
  announcement.value = movedToTopMessage(props.itemLabel(item))

  await nextTick()
  const moved = list?.firstElementChild
  moved?.classList.add('moving-to-top')
  play?.()
  await Promise.allSettled(moved?.getAnimations().map(animation => animation.finished) ?? [])
  moved?.classList.remove('moving-to-top')
}
</script>

<template>
  <div ref="container" class="sortable-list">
    <template v-if="sortable">
      <DragDropProvider
        :sensors="SENSORS"
        :plugins
        @drag-start="onDragStart"
        @drag-move="onDragMove"
        @drag-over="onDragOver"
        @drag-end="onDragEnd">
        <SortableItem
          v-for="(item, index) of rendered"
          :id="item.id"
          :key="item.id"
          v-slot="{ setHandle }"
          :index
          :group
          :locked="item.id === lockedId">
          <slot
            name="item"
            :item
            :index
            :set-handle="setHandle"
            :move-to-top="() => moveToTop(item)" />
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
    rotate: 0deg;
    scale: 0.8;
    opacity: 0.8;
  }
}
</style>
