<script setup lang="ts">
import { useSortable } from '@dnd-kit/vue/sortable'
import { shallowRef, useTemplateRef, watch } from 'vue'
import {
  CONTROL_SELECTOR,
  HANDLE_SELECTOR,
  PRESS_TOLERANCE_PX,
  SORTABLE_TRANSITION,
} from '@/components/sortable/dnd-kit'
import { SetHandle } from '@/utils/sortable.utils'

const PRESS_FEEDBACK_DELAY_MS = 90
const PRESS_END_EVENTS = ['pointermove', 'pointerup', 'pointercancel'] as const

const props = defineProps<{
  id: number
  index: number
  group: string
  locked: boolean
}>()

defineSlots<{
  default(props: { setHandle?: SetHandle }): unknown
}>()

const element = useTemplateRef<HTMLElement>('element')
const handle = shallowRef<HTMLElement | null>(null)

const { isDragging, isDropping } = useSortable({
  id: () => props.id,
  index: () => props.index,
  group: () => props.group,
  disabled: () => ({ draggable: props.locked }),
  element,
  handle,
  transition: SORTABLE_TRANSITION,
})

let pointer: { x: number; y: number } | null = null

function trackPointer({ clientX, clientY }: PointerEvent): void {
  pointer = { x: clientX, y: clientY }
}

// La bibliothèque arrête la propagation des `pointermove` pendant le glisser : la capture sur
// `window` les voit passer
watch(isDragging, dragging => {
  if (dragging) {
    pointer = null
    window.addEventListener('pointermove', trackPointer, true)
  } else {
    window.removeEventListener('pointermove', trackPointer, true)
  }
})

// Après le dépôt, la bibliothèque replace la carte dans le DOM et le navigateur ne réévalue
// `:hover` qu'au mouvement suivant : si le pointeur est sur la place où la carte se pose, la poignée
// garde d'ici là l'opacité de survol
watch(isDropping, dropping => {
  const item = element.value
  const target = item?.parentElement?.querySelector(':scope > [data-dnd-placeholder]')
  if (!dropping || !item || !target || !pointer) return

  const { left, right, top, bottom } = target.getBoundingClientRect()
  const { x, y } = pointer
  if (x < left || x > right || y < top || y > bottom) return

  item.classList.add('dropped-under-pointer')
  window.addEventListener('pointermove', () => item.classList.remove('dropped-under-pointer'), {
    once: true,
    capture: true,
  })
})

function setHandle(button: HTMLElement | null): void {
  handle.value = button
}

function showPressFeedback(event: PointerEvent): void {
  const item = element.value
  if (!item || props.locked || event.button !== 0 || !(event.target instanceof Element)) return
  if (event.target.closest(`${HANDLE_SELECTOR}, ${CONTROL_SELECTOR}`)) return

  const { clientX, clientY } = event
  const timer = setTimeout(() => item.classList.add('pressing'), PRESS_FEEDBACK_DELAY_MS)

  const release = (next: PointerEvent): void => {
    const distance = Math.hypot(next.clientX - clientX, next.clientY - clientY)
    if (next.type === 'pointermove' && distance < PRESS_TOLERANCE_PX) return

    clearTimeout(timer)
    item.classList.remove('pressing')
    for (const type of PRESS_END_EVENTS) window.removeEventListener(type, release, true)
  }

  for (const type of PRESS_END_EVENTS) window.addEventListener(type, release, true)
}
</script>

<template>
  <div ref="element" class="sortable-item" :class="{ locked }" @pointerdown="showPressFeedback">
    <slot :set-handle="locked ? undefined : setHandle" />
  </div>
</template>

<style scoped lang="scss">
.sortable-item {
  --sortable-gutter-width: 20px;
  --sortable-handle-opacity: 0.38;

  display: grid;

  @media (hover: hover) {
    --sortable-handle-opacity: 0;

    &:hover,
    &:focus-within,
    &.dropped-under-pointer {
      --sortable-handle-opacity: 0.6;
    }
  }

  &[data-dnd-dragging]:not([data-dnd-dropping]) {
    --sortable-handle-opacity: 0.7;
  }

  @media (hover: none) {
    &:not(.locked) {
      user-select: none;
      -webkit-user-select: none;
      -webkit-touch-callout: none;
    }
  }

  :deep(.v-card) {
    // Durée et courbe reprises par CARD_TRANSITION dans SortableList.vue : changer les deux ensemble
    transition:
      rotate 0.15s ease-out,
      scale 0.15s ease-out,
      box-shadow 0.15s ease-out,
      opacity 0.15s ease-out;
  }

  &.pressing:not([data-dnd-dragging]) :deep(.v-card) {
    scale: 0.985;
    transition-duration: 0.25s;
  }

  &[data-dnd-dragging] :deep(.v-card) {
    rotate: -3deg;
  }

  &[data-dnd-dragging],
  &.moving-to-top {
    :deep(.v-card) {
      scale: 1.05;
      box-shadow:
        0 8px 10px -5px rgba(0, 0, 0, 0.3),
        0 16px 24px 2px rgba(0, 0, 0, 0.24),
        0 6px 30px 5px rgba(0, 0, 0, 0.22);
    }
  }

  &.moving-to-top {
    position: relative;
    z-index: 1;
  }

  &[data-dnd-dragging][data-dnd-dropping] :deep(.v-card) {
    rotate: 0deg;
    scale: 1;
    box-shadow: revert-layer;
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
