import { describe, expect, it, vi } from 'vitest'
import { DragDropManager, PointerActivationConstraints } from '@dnd-kit/dom'
import { Sortable } from '@dnd-kit/dom/sortable'
import {
  activationConstraints,
  preventActivation,
  revertToInitialIndex,
  sortablePosition,
} from '@/components/sortable/dnd-kit'

function renderCard(): {
  source: { handle: Element }
  find: (selector: string) => Element
} {
  const element = document.createElement('div')
  element.innerHTML = `
    <button class="v-btn sortable-handle"><i class="icon"></i></button>
    <button class="v-btn checkbox"><i class="icon"></i></button>
    <span class="v-chip"><span class="label">Chip</span></span>
    <a href="#">Link</a>
    <input />
    <div class="body"><span class="name">Name</span></div>`
  const find = (selector: string): Element => element.querySelector(selector) as Element
  return { source: { handle: find('.sortable-handle') }, find }
}

function pointerDownOn(target: Element, pointerType = 'mouse'): PointerEvent {
  return { target, pointerType } as unknown as PointerEvent
}

describe('activation', () => {
  it('démarre tout de suite depuis la poignée, icône comprise', () => {
    const { source, find } = renderCard()
    const event = pointerDownOn(find('.sortable-handle .icon'))
    expect(preventActivation(event, source)).toBe(false)
    expect(activationConstraints(event, source)).toEqual([])
  })

  it('attend un appui de 150 ms à la souris et 250 ms au doigt ou au stylet, à 5 px près', () => {
    const { source, find } = renderCard()
    const delays = { mouse: 150, touch: 250, pen: 250 }
    for (const [pointerType, value] of Object.entries(delays)) {
      const event = pointerDownOn(find('.name'), pointerType)
      expect(preventActivation(event, source)).toBe(false)

      const constraints = activationConstraints(event, source)
      expect(constraints).toHaveLength(1)
      expect(constraints[0]).toBeInstanceOf(PointerActivationConstraints.Delay)
      expect(constraints[0]).toMatchObject({ options: { value, tolerance: 5 } })
    }
  })

  it('ne démarre jamais depuis un contrôle de la carte', () => {
    const { source, find } = renderCard()
    for (const selector of ['.checkbox .icon', '.v-chip .label', 'a', 'input'])
      expect(preventActivation(pointerDownOn(find(selector)), source)).toBe(true)
  })
})

describe('contrat avec les internes de @dnd-kit', () => {
  function registerSortables(): {
    manager: DragDropManager
    sortables: Sortable[]
  } {
    const manager = new DragDropManager()
    const sortables = [
      { id: 9, index: 0, group: 'other' },
      { id: 1, index: 0, group: 'list' },
      { id: 2, index: 1, group: 'list' },
      { id: 3, index: 2, group: 'list' },
    ].map(input => {
      const element = document.createElement('div')
      document.body.append(element)
      const sortable = new Sortable({ ...input, element }, manager)
      sortable.register()
      return sortable
    })
    return { manager, sortables }
  }

  it('lit la position d’un élément du registre', () => {
    const { manager } = registerSortables()
    const positions = [...manager.registry.draggables].map(sortablePosition)
    expect(positions).toContainEqual({ id: 2, index: 1, initialIndex: 1 })
    expect(sortablePosition(null)).toBeNull()
  })

  it('ramène la carte sur l’occupant de sa place d’origine, dans son groupe seulement', async () => {
    const { manager, sortables } = registerSortables()
    const [, first, second, third] = sortables
    first.index = 2
    second.index = 0
    third.index = 1

    let allowed = false
    const setDropTarget = vi.fn(async () => {
      expect(allowed).toBe(true)
      return true
    })
    const source = {
      id: 1,
      sortable: { index: 2, initialIndex: 0, group: 'list' },
    }
    await revertToInitialIndex(
      {
        dragOperation: { source },
        registry: manager.registry,
        actions: { setDropTarget },
      },
      value => (allowed = value)
    )

    expect(setDropTarget).toHaveBeenCalledWith(2)
    expect(allowed).toBe(false)
  })

  it('ne fait rien si la carte est déjà à sa place d’origine', async () => {
    const { manager } = registerSortables()
    const setDropTarget = vi.fn(async () => true)
    const source = {
      id: 1,
      sortable: { index: 0, initialIndex: 0, group: 'list' },
    }
    await revertToInitialIndex(
      {
        dragOperation: { source },
        registry: manager.registry,
        actions: { setDropTarget },
      },
      () => undefined
    )
    expect(setDropTarget).not.toHaveBeenCalled()
  })
})
