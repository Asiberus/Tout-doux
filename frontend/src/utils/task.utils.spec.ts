import { describe, expect, it } from 'vitest'
import { filterCompleted, filterUncompleted, flattenProjectTasks } from '@/utils/task.utils'
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
