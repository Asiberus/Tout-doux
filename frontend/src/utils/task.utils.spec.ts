import { describe, expect, it } from 'vitest'
import {
  filterCompleted,
  filterUncompleted,
  flattenProjectTasks,
  sortByCompletionDate,
} from '@/utils/task.utils'
import { makeProjectDetail, makeSection, makeTask } from '@/test/fixtures'

describe('filterCompleted / filterUncompleted', () => {
  const tasks = [
    makeTask({ id: 1, completed: true }),
    makeTask({ id: 2, completed: false }),
    makeTask({ id: 3, completed: true }),
  ]

  it('ne garde que les tâches terminées', () => {
    expect(filterCompleted(tasks).map(({ id }) => id)).toEqual([1, 3])
  })

  it('ne garde que les tâches non terminées', () => {
    expect(filterUncompleted(tasks).map(({ id }) => id)).toEqual([2])
  })
})

describe('flattenProjectTasks', () => {
  it('concatène les tâches racine puis celles des sections, dans l’ordre des sections', () => {
    const project = makeProjectDetail({
      tasks: [makeTask({ id: 1 })],
      sections: [
        makeSection({ id: 10, tasks: [makeTask({ id: 2 })] }),
        makeSection({ id: 11, tasks: [makeTask({ id: 3 })] }),
      ],
    })

    expect(flattenProjectTasks(project).map(({ id }) => id)).toEqual([1, 2, 3])
  })

  it('renvoie un tableau vide pour un projet sans tâche', () => {
    expect(flattenProjectTasks(makeProjectDetail())).toEqual([])
  })
})

describe('sortByCompletionDate', () => {
  it('place la complétion la plus récente en premier', () => {
    const tasks = [
      makeTask({ id: 1, completedAt: '2026-03-01T10:00:00' }),
      makeTask({ id: 2, completedAt: '2026-03-05T10:00:00' }),
    ]

    expect(sortByCompletionDate(tasks).map(({ id }) => id)).toEqual([2, 1])
  })

  it('retombe sur la date de création dès qu’une des deux complétions manque', () => {
    const tasks = [
      makeTask({ id: 1, createdAt: '2026-01-01T09:00:00', completedAt: '' }),
      makeTask({ id: 2, createdAt: '2026-01-05T09:00:00', completedAt: '2026-03-05T10:00:00' }),
    ]

    expect(sortByCompletionDate(tasks).map(({ id }) => id)).toEqual([2, 1])
  })

  it('trie le tableau reçu sur place au lieu d’en renvoyer une copie', () => {
    const tasks = [
      makeTask({ id: 1, completedAt: '2026-03-01T10:00:00' }),
      makeTask({ id: 2, completedAt: '2026-03-05T10:00:00' }),
    ]

    expect(sortByCompletionDate(tasks)).toBe(tasks)
    expect(tasks.map(({ id }) => id)).toEqual([2, 1])
  })
})
