export type SetHandle = (handle: HTMLElement | null) => void

export interface Bounds {
  top: number
  right: number
  bottom: number
  left: number
}

export interface Point {
  x: number
  y: number
}

export const OUTSIDE_MARGIN_PX = 50

export const REORDER_INSTRUCTIONS =
  'Press space to pick up. Use the arrow keys to move. Press space to drop, or escape to cancel.'

export function listBounds(
  { top, right, bottom, left }: Bounds,
  frozenHeight: number | null
): Bounds {
  return {
    top,
    right,
    left,
    bottom: frozenHeight === null ? bottom : top + frozenHeight,
  }
}

export function isOutside(bounds: Bounds, point: Point, margin: number): boolean {
  return (
    point.x < bounds.left - margin ||
    point.x > bounds.right + margin ||
    point.y < bounds.top - margin ||
    point.y > bounds.bottom + margin
  )
}

export function pickedUpMessage(name: string, index: number, total: number): string {
  return `Picked up ${name}. Position ${index + 1} of ${total}.`
}

export function positionMessage(index: number, total: number): string {
  return `Position ${index + 1} of ${total}.`
}

export function outsideMessage(name: string, index: number, total: number): string {
  return `Outside the list. Release to put ${name} back at position ${index + 1} of ${total}.`
}

export function droppedMessage(name: string, index: number, total: number): string {
  return `Dropped ${name} at position ${index + 1} of ${total}.`
}

export function cancelledMessage(name: string, index: number, total: number): string {
  return `Cancelled. ${name} is back at position ${index + 1} of ${total}.`
}

export function movedToTopMessage(name: string): string {
  return `Moved ${name} to top.`
}
