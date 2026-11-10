import { describe, expect, it } from 'vitest'
import {
  cancelledMessage,
  droppedMessage,
  isOutside,
  listBounds,
  movedToTopMessage,
  outsideMessage,
  pickedUpMessage,
  positionMessage,
} from '@/utils/sortable.utils'

describe('isOutside', () => {
  const bounds = { top: 100, right: 400, bottom: 300, left: 0 }

  it('reste dans la liste jusqu’au bord de la marge', () => {
    expect(isOutside(bounds, { x: 200, y: 200 }, 50)).toBe(false)
    expect(isOutside(bounds, { x: -50, y: 50 }, 50)).toBe(false)
    expect(isOutside(bounds, { x: 450, y: 350 }, 50)).toBe(false)
  })

  it('sort au-delà de la marge, de chaque côté', () => {
    expect(isOutside(bounds, { x: -51, y: 200 }, 50)).toBe(true)
    expect(isOutside(bounds, { x: 451, y: 200 }, 50)).toBe(true)
    expect(isOutside(bounds, { x: 200, y: 49 }, 50)).toBe(true)
    expect(isOutside(bounds, { x: 200, y: 351 }, 50)).toBe(true)
  })
})

describe('listBounds', () => {
  it('reprend le rectangle mesuré', () => {
    const rect = { top: 100, right: 400, bottom: 300, left: 0 }
    expect(listBounds(rect, null)).toEqual(rect)
  })

  it('garde la hauteur figée pendant le repli', () => {
    expect(listBounds({ top: 80, right: 400, bottom: 200, left: 0 }, 200)).toEqual({
      top: 80,
      right: 400,
      bottom: 280,
      left: 0,
    })
  })
})

describe('annonces', () => {
  it('comptent les positions à partir de 1', () => {
    expect(pickedUpMessage('Write tests', 2, 8)).toBe('Picked up Write tests. Position 3 of 8.')
    expect(positionMessage(3, 8)).toBe('Position 4 of 8.')
    expect(outsideMessage('Write tests', 2, 8)).toBe(
      'Outside the list. Release to put Write tests back at position 3 of 8.'
    )
    expect(droppedMessage('Write tests', 3, 8)).toBe('Dropped Write tests at position 4 of 8.')
    expect(cancelledMessage('Write tests', 2, 8)).toBe(
      'Cancelled. Write tests is back at position 3 of 8.'
    )
    expect(movedToTopMessage('Write tests')).toBe('Moved Write tests to top.')
  })
})
