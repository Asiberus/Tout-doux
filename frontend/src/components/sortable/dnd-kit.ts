import { ref } from 'vue'
import { ActivationConstraints, Customizable, Plugins, UniqueIdentifier } from '@dnd-kit/abstract'
import {
  Accessibility,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  Feedback,
  KeyboardSensor,
  PointerActivationConstraints,
  PointerSensor,
} from '@dnd-kit/dom'
import { SortableTransition } from '@dnd-kit/dom/sortable'
import { REORDER_INSTRUCTIONS } from '@/utils/sortable.utils'

export const LONG_PRESS_MS = 250
export const MOUSE_LONG_PRESS_MS = 150
export const PRESS_TOLERANCE_PX = 5
export const REORDER_DURATION_MS = 350
export const REORDER_EASING = 'cubic-bezier(0.25, 1, 0.5, 1)'
export const HANDLE_SELECTOR = '.sortable-handle'
export const CONTROL_SELECTOR = '.v-btn:not(.sortable-handle), .v-chip, a, input, textarea'

export const SORTABLE_TRANSITION: SortableTransition = {
  duration: REORDER_DURATION_MS,
  easing: REORDER_EASING,
  idle: false,
}

export const dragInProgress = ref(false)

interface ActivationSource {
  handle?: Element
}

interface SortableEntity {
  id: UniqueIdentifier
  sortable?: {
    index: number
    initialIndex: number
    group?: UniqueIdentifier
  }
}

export interface SortablePosition {
  id: number
  index: number
  initialIndex: number
}

export interface RevertibleManager {
  dragOperation: { source: SortableEntity | null }
  registry: { droppables: Iterable<SortableEntity> }
  actions: { setDropTarget(id: UniqueIdentifier): Promise<boolean> }
}

export interface Announcements {
  dragstart(event: DragStartEvent): string | undefined
  dragover(event: DragOverEvent): string | undefined
  dragend(event: DragEndEvent): string | undefined
}

function isOnHandle(event: PointerEvent, source: ActivationSource): boolean {
  return event.target instanceof Node && source.handle?.contains(event.target) === true
}

export function preventActivation(event: PointerEvent, source: ActivationSource): boolean {
  if (isOnHandle(event, source)) return false
  return event.target instanceof Element && event.target.closest(CONTROL_SELECTOR) !== null
}

export function activationConstraints(
  event: PointerEvent,
  source: ActivationSource
): ActivationConstraints<PointerEvent> {
  if (isOnHandle(event, source)) return []
  return [
    new PointerActivationConstraints.Delay({
      value: isTouchOrPen(event) ? LONG_PRESS_MS : MOUSE_LONG_PRESS_MS,
      tolerance: PRESS_TOLERANCE_PX,
    }),
  ]
}

export const SENSORS = [
  PointerSensor.configure({
    activatorElements: source => [source.element],
    preventActivation,
    activationConstraints,
  }),
  KeyboardSensor,
]

const TOUCH_POINTER_TYPES = ['touch', 'pen']

export function isTouchOrPen(event: Event | null): boolean {
  return (
    event !== null &&
    'pointerType' in event &&
    TOUCH_POINTER_TYPES.includes(event.pointerType as string)
  )
}

export function sortablePosition(entity: SortableEntity | null): SortablePosition | null {
  if (!entity?.sortable) return null
  const { index, initialIndex } = entity.sortable
  return { id: Number(entity.id), index, initialIndex }
}

export async function revertToInitialIndex(
  manager: RevertibleManager,
  allowDragOver: (allowed: boolean) => void
): Promise<void> {
  const source = manager.dragOperation.source
  const sortable = source?.sortable
  if (!source || !sortable || sortable.index === sortable.initialIndex) return

  const occupant = [...manager.registry.droppables].find(
    droppable =>
      droppable.id !== source.id &&
      droppable.sortable !== undefined &&
      droppable.sortable.group === sortable.group &&
      droppable.sortable.index === sortable.initialIndex
  )
  if (!occupant) return

  allowDragOver(true)
  try {
    await manager.actions.setDropTarget(occupant.id)
  } finally {
    allowDragOver(false)
  }
}

export function createPlugins(announcements: Announcements): Customizable<Plugins> {
  return defaults => [
    ...defaults,
    Accessibility.configure({
      announcements,
      screenReaderInstructions: { draggable: REORDER_INSTRUCTIONS },
    }),
    Feedback.configure({
      dropAnimation: { duration: REORDER_DURATION_MS, easing: REORDER_EASING },
    }),
  ]
}
