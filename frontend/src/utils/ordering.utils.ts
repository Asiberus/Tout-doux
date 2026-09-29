import { isAxiosError } from 'axios'
import { MoveAnchors } from '@/models/ordering.model'

interface Identified {
  id: number
}

interface Positioned extends Identified {
  position: string
  completed: boolean
}

export interface MoveQueue {
  enqueue(request: () => Promise<void>): Promise<void>
}

const STALE_LIST_STATUSES = [403, 404, 409]

export function anchorsAt(
  displayed: Identified[],
  movedId: number,
  newIndex: number
): MoveAnchors | null {
  const oldIndex = displayed.findIndex(({ id }) => id === movedId)
  if (oldIndex === -1 || oldIndex === newIndex) return null

  const others = displayed.filter(({ id }) => id !== movedId)
  return {
    afterId: others[newIndex - 1]?.id ?? null,
    beforeId: others[newIndex]?.id ?? null,
  }
}

function targetIndex(list: Identified[], { afterId, beforeId }: MoveAnchors): number {
  if (afterId !== null) {
    const after = list.findIndex(({ id }) => id === afterId)
    return after === -1 ? -1 : after + 1
  }
  if (beforeId !== null) return list.findIndex(({ id }) => id === beforeId)
  return -1
}

export function applyMove<T extends Identified>(list: T[], id: number, anchors: MoveAnchors): void {
  const from = list.findIndex(item => item.id === id)
  if (from === -1) return

  const [item] = list.splice(from, 1)
  const to = targetIndex(list, anchors)
  list.splice(to === -1 ? from : to, 0, item)
}

export function insertByPosition<T extends Positioned>(list: T[], item: T): void {
  // `<` compare les codes de caractères, comme la collation `C` de la base ; `localeCompare`
  // ignore la casse et placerait `a0` avant `Zz`.
  const index = list.findIndex(other => other.completed || item.position < other.position)
  list.splice(index === -1 ? list.length : index, 0, item)
}

export function repositionAfterToggle<T extends Positioned>(list: T[], item: T): void {
  const from = list.findIndex(({ id }) => id === item.id)
  if (from === -1) return
  list.splice(from, 1)

  if (!item.completed) {
    insertByPosition(list, item)
  } else {
    const firstCompleted = list.findIndex(({ completed }) => completed)
    list.splice(firstCompleted === -1 ? list.length : firstCompleted, 0, item)
  }
}

export function isStaleListError(error: unknown): boolean {
  return isAxiosError(error) && STALE_LIST_STATUSES.includes(error.response?.status ?? 0)
}

export function moveFailureMessage(error: unknown): string {
  return isStaleListError(error)
    ? 'This list changed elsewhere and has been reloaded'
    : 'Could not save the new order'
}

export function createMoveQueue(onFailure: (error: unknown) => void): MoveQueue {
  let tail: Promise<void> = Promise.resolve()
  let generation = 0

  return {
    enqueue(request): Promise<void> {
      const enqueuedIn = generation
      tail = tail.then(async () => {
        if (enqueuedIn !== generation) return
        try {
          await request()
        } catch (error) {
          generation++
          onFailure(error)
        }
      })
      return tail
    },
  }
}
