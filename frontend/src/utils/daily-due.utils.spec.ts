import { describe, expect, it } from 'vitest'
import { DailyUpdateTaskTab } from '@/models/daily-task.model'
import {
  collectDueEntries,
  containerDueCount,
  DueGroups,
  dueEntryCount,
  initialDailyUpdateTab,
  unplannedCount,
} from '@/utils/daily-due.utils'
import {
  makeCollectionDetail,
  makeDailyTask,
  makeProjectDetail,
  makeSection,
  makeTask,
} from '@/test/fixtures'

const J = '2026-10-22'

function ids(groups: DueGroups): { overdue: number[]; today: number[]; soon: number[] } {
  return {
    overdue: groups.overdue.map(({ task }) => task.id),
    today: groups.today.map(({ task }) => task.id),
    soon: groups.soon.map(({ task }) => task.id),
  }
}

describe('collectDueEntries', () => {
  const project = makeProjectDetail({
    id: 1,
    name: 'Projet',
    tasks: [
      makeTask({ id: 1, dueDate: '2026-10-20' }),
      makeTask({ id: 2, dueDate: '2026-10-22' }),
      makeTask({ id: 3, dueDate: '2026-10-25' }),
      makeTask({ id: 4, dueDate: '2026-10-28' }),
      makeTask({ id: 5, dueDate: null }),
    ],
  })

  it('groupe les tâches en retard, du jour et à venir, et écarte le reste', () => {
    expect(ids(collectDueEntries([project], [], [], J))).toEqual({
      overdue: [1],
      today: [2],
      soon: [3],
    })
  })

  it('se recalcule pour un autre jour de référence', () => {
    expect(ids(collectDueEntries([project], [], [], '2026-10-25'))).toEqual({
      overdue: [1, 2],
      today: [3],
      soon: [4],
    })
  })

  it('garde une tâche planifiée sur le jour, marquée planned', () => {
    const groups = collectDueEntries([project], [], [makeDailyTask({ task: project.tasks[1] })], J)
    expect(groups.today).toEqual([expect.objectContaining({ planned: true })])
    expect(groups.overdue[0].planned).toBe(false)
  })

  it('garde une tâche terminée seulement si elle est planifiée sur le jour', () => {
    const done = makeTask({ id: 6, completed: true, dueDate: J })
    const doneUnplanned = makeTask({ id: 7, completed: true, dueDate: J })
    const withDone = makeProjectDetail({ tasks: [done, doneUnplanned] })
    const groups = collectDueEntries([withDone], [], [makeDailyTask({ task: done })], J)
    expect(ids(groups).today).toEqual([6])
    expect(groups.today[0].planned).toBe(true)
  })

  it('écarte les tâches des conteneurs archivés, planifiées ou non', () => {
    const task = makeTask({ id: 8, dueDate: J })
    const archivedProject = makeProjectDetail({ archived: true, tasks: [task] })
    const archivedCollection = makeCollectionDetail({
      archived: true,
      tasks: [makeTask({ id: 9, dueDate: J })],
    })
    const groups = collectDueEntries(
      [archivedProject],
      [archivedCollection],
      [makeDailyTask({ task })],
      J
    )
    expect(ids(groups)).toEqual({ overdue: [], today: [], soon: [] })
  })

  it('décrit le conteneur de chaque tâche', () => {
    const withSection = makeProjectDetail({
      id: 2,
      name: 'Avec section',
      tasks: [makeTask({ id: 10, dueDate: J })],
      sections: [makeSection({ id: 20, name: 'S', tasks: [makeTask({ id: 11, dueDate: J })] })],
    })
    const collection = makeCollectionDetail({
      id: 3,
      name: 'Collec',
      tasks: [makeTask({ id: 12, dueDate: J })],
    })
    const [direct, inSection, inCollection] = collectDueEntries(
      [withSection],
      [collection],
      [],
      J
    ).today
    expect(direct.container).toEqual({ tab: DailyUpdateTaskTab.Project, project: withSection })
    expect(inSection.container).toEqual({
      tab: DailyUpdateTaskTab.Project,
      section: { id: 20, name: 'S', project: withSection },
    })
    expect(inCollection.container).toEqual({ tab: DailyUpdateTaskTab.Collection, collection })
  })

  it('trie par date croissante, puis projets avant collections dans l’ordre reçu', () => {
    const first = makeProjectDetail({
      tasks: [
        makeTask({ id: 21, dueDate: '2026-10-21' }),
        makeTask({ id: 22, dueDate: '2026-10-19' }),
      ],
    })
    const collection = makeCollectionDetail({
      tasks: [
        makeTask({ id: 23, dueDate: '2026-10-19' }),
        makeTask({ id: 24, dueDate: '2026-10-24' }),
      ],
    })
    const second = makeProjectDetail({
      id: 2,
      tasks: [makeTask({ id: 25, dueDate: '2026-10-23' })],
    })
    expect(ids(collectDueEntries([first, second], [collection], [], J))).toEqual({
      overdue: [22, 23, 21],
      today: [],
      soon: [25, 24],
    })
  })
})

describe('compteurs', () => {
  const late = makeTask({ id: 1, dueDate: '2026-10-20' })
  const dueToday = makeTask({ id: 2, dueDate: J })
  const project = makeProjectDetail({ tasks: [late, dueToday] })

  it('unplannedCount ignore les tâches planifiées', () => {
    const groups = collectDueEntries([project], [], [makeDailyTask({ task: dueToday })], J)
    expect(unplannedCount(groups)).toBe(1)
  })

  it('dueEntryCount compte toutes les tâches de l’onglet, planifiées ou non', () => {
    const groups = collectDueEntries([project], [], [makeDailyTask({ task: dueToday })], J)
    expect(dueEntryCount(groups)).toBe(2)
  })

  it('containerDueCount compte les tâches ouvertes en retard ou du jour, planifiées ou non', () => {
    const tasks = [
      late,
      dueToday,
      makeTask({ id: 3, dueDate: '2026-10-23' }),
      makeTask({ id: 4, completed: true, dueDate: J }),
    ]
    expect(containerDueCount(tasks, J)).toEqual({ count: 2, overdue: true })
  })
})

describe('initialDailyUpdateTab', () => {
  it('ouvre Project sur un jour passé, même avant le chargement', () => {
    expect(initialDailyUpdateTab(true, false, 3)).toBe(DailyUpdateTaskTab.Project)
  })

  it('ne choisit rien tant que le jour n’est pas chargé', () => {
    expect(initialDailyUpdateTab(false, false, 3)).toBeNull()
  })

  it('ouvre Due s’il reste une tâche à planifier, Project sinon', () => {
    expect(initialDailyUpdateTab(false, true, 2)).toBe(DailyUpdateTaskTab.Due)
    expect(initialDailyUpdateTab(false, true, 0)).toBe(DailyUpdateTaskTab.Project)
  })
})
