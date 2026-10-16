import { describe, expect, it, vi } from 'vitest'
import {
  anchorsAt,
  applyMove,
  createMoveQueue,
  insertByPosition,
  isStaleListError,
  moveFailureMessage,
  repositionAfterToggle,
} from '@/utils/ordering.utils'
import { makeAxiosError, makeTask } from '@/test/fixtures'

const ids = (list: { id: number }[]): number[] => list.map(({ id }) => id)

describe('anchorsAt', () => {
  const displayed = [{ id: 1 }, { id: 2 }, { id: 3 }]

  it('donne les voisins de la place d’arrivée, sans compter l’élément déplacé', () => {
    expect(anchorsAt(displayed, 3, 0)).toEqual({ afterId: null, beforeId: 1 })
    expect(anchorsAt(displayed, 1, 2)).toEqual({ afterId: 3, beforeId: null })
    expect(anchorsAt(displayed, 3, 1)).toEqual({ afterId: 1, beforeId: 2 })
  })

  it('ne renvoie rien pour un dépôt à la même place', () => {
    expect(anchorsAt(displayed, 2, 1)).toBeNull()
  })
})

describe('applyMove', () => {
  it('place l’élément juste après son ancre du dessus', () => {
    const list = [{ id: 1 }, { id: 2 }, { id: 3 }]
    applyMove(list, 1, { afterId: 3, beforeId: null })
    expect(ids(list)).toEqual([2, 3, 1])
  })

  it('place l’élément juste avant son ancre du dessous quand il va en tête', () => {
    const list = [{ id: 1 }, { id: 2 }, { id: 3 }]
    applyMove(list, 3, { afterId: null, beforeId: 1 })
    expect(ids(list)).toEqual([3, 1, 2])
  })

  it('laisse l’élément en place si l’ancre a disparu', () => {
    const list = [{ id: 1 }, { id: 2 }, { id: 3 }]
    applyMove(list, 2, { afterId: 99, beforeId: null })
    expect(ids(list)).toEqual([1, 2, 3])
  })

  it('reste dans le groupe des tâches à faire, avant les terminées', () => {
    const list = [makeTask({ id: 1 }), makeTask({ id: 2 }), makeTask({ id: 3, completed: true })]
    applyMove(list, 1, { afterId: 2, beforeId: null })
    expect(ids(list)).toEqual([2, 1, 3])
  })
})

describe('insertByPosition', () => {
  it('compare les clés octet par octet : Zz vient avant a0', () => {
    const list = [makeTask({ id: 1, position: 'a0' })]
    insertByPosition(list, makeTask({ id: 2, position: 'Zz' }))
    expect(ids(list)).toEqual([2, 1])
  })

  it('insère parmi les tâches à faire, jamais après une terminée', () => {
    const list = [
      makeTask({ id: 1, position: 'a0' }),
      makeTask({ id: 3, completed: true, position: 'a1' }),
    ]
    insertByPosition(list, makeTask({ id: 2, position: 'a5' }))
    expect(ids(list)).toEqual([1, 2, 3])
  })
})

describe('repositionAfterToggle', () => {
  it('place une tâche cochée en tête des terminées', () => {
    const list = [
      makeTask({ id: 1, position: 'a0' }),
      makeTask({ id: 2, position: 'a1' }),
      makeTask({ id: 3, completed: true }),
    ]
    list[0].completed = true
    repositionAfterToggle(list, list[0])
    expect(ids(list)).toEqual([2, 1, 3])
  })

  it('remet une tâche décochée à sa place parmi les tâches à faire', () => {
    const list = [
      makeTask({ id: 1, position: 'a0' }),
      makeTask({ id: 3, position: 'a2' }),
      makeTask({ id: 2, completed: true, position: 'a1' }),
    ]
    list[2].completed = false
    repositionAfterToggle(list, list[2])
    expect(ids(list)).toEqual([1, 2, 3])
  })
})

describe('isStaleListError', () => {
  it.each([403, 404, 409])('reconnaît une liste périmée sur un %i', status => {
    expect(isStaleListError(makeAxiosError(status))).toBe(true)
  })

  it('ne confond pas une autre erreur avec une liste périmée', () => {
    expect(isStaleListError(makeAxiosError(400))).toBe(false)
    expect(isStaleListError(new Error('réseau'))).toBe(false)
  })
})

describe('moveFailureMessage', () => {
  it.each([403, 404, 409])('signale une liste modifiée ailleurs sur un %i', status => {
    expect(moveFailureMessage(makeAxiosError(status))).toBe(
      'This list changed elsewhere and has been reloaded'
    )
  })

  it('signale un échec générique sinon', () => {
    expect(moveFailureMessage(makeAxiosError(500))).toBe('Could not save the new order')
    expect(moveFailureMessage(new Error('réseau'))).toBe('Could not save the new order')
  })
})

describe('createMoveQueue', () => {
  it('envoie les requêtes l’une après l’autre', async () => {
    const calls: string[] = []
    const queue = createMoveQueue(vi.fn())
    let release!: () => void
    const gate = new Promise<void>(resolve => (release = resolve))
    const first = queue.enqueue(async () => {
      await gate
      calls.push('first')
    })
    const second = queue.enqueue(async () => {
      calls.push('second')
    })

    await Promise.resolve()
    expect(calls).toEqual([])
    release()
    await Promise.all([first, second])
    expect(calls).toEqual(['first', 'second'])
  })

  it('abandonne les requêtes en attente et prévient une seule fois après un échec', async () => {
    const onFailure = vi.fn()
    const queue = createMoveQueue(onFailure)
    const pending = vi.fn()
    const error = makeAxiosError(409)

    await Promise.all([queue.enqueue(() => Promise.reject(error)), queue.enqueue(pending)])

    expect(pending).not.toHaveBeenCalled()
    expect(onFailure).toHaveBeenCalledOnce()
    expect(onFailure).toHaveBeenCalledWith(error)
  })

  it('reprend normalement après un échec', async () => {
    const queue = createMoveQueue(vi.fn())
    await queue.enqueue(() => Promise.reject(new Error('échec')))
    const next = vi.fn(async () => {})
    await queue.enqueue(next)
    expect(next).toHaveBeenCalledOnce()
  })
})
