import { describe, expect, it } from 'vitest'
import {
  filterCompleted,
  filterUncompleted,
  flattenProjectTasks,
  isTaskAvailable,
  isTaskPlanned,
} from '@/utils/task.utils'
import { makeDailyTask, makeProjectDetail, makeSection, makeTask } from '@/test/fixtures'

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

describe('isTaskPlanned', () => {
  const dailyTasks = [makeDailyTask({ task: makeTask({ id: 2 }) })]

  it('reconnaît une tâche portée par une daily task', () => {
    expect(isTaskPlanned(makeTask({ id: 2 }), dailyTasks)).toBe(true)
    expect(isTaskPlanned(makeTask({ id: 3 }), dailyTasks)).toBe(false)
  })
})

describe('isTaskAvailable', () => {
  const dailyTasks = [makeDailyTask({ task: makeTask({ id: 2 }) })]
  const open = makeTask({ id: 1 })
  const completedPlanned = makeTask({ id: 2, completed: true })
  const completedUnplanned = makeTask({ id: 3, completed: true })

  it('garde une tâche ouverte, ou terminée mais planifiée', () => {
    expect(isTaskAvailable(open, false, dailyTasks)).toBe(true)
    expect(isTaskAvailable(completedPlanned, false, dailyTasks)).toBe(true)
    expect(isTaskAvailable(completedUnplanned, false, dailyTasks)).toBe(false)
  })

  it('ne garde d’un conteneur archivé que les tâches planifiées', () => {
    expect(isTaskAvailable(open, true, dailyTasks)).toBe(false)
    expect(isTaskAvailable(completedPlanned, true, dailyTasks)).toBe(true)
  })
})
