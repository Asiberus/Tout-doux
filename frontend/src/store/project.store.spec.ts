import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api', () => ({
  taskApi: { moveTask: vi.fn(), updateTaskById: vi.fn() },
  projectApi: { getProjectById: vi.fn() },
  sectionApi: {},
  eventApi: {},
}))

import { projectApi, taskApi } from '@/api'
import { useNotificationStore } from '@/store/notification.store'
import { useProjectStore } from '@/store/project.store'
import { makeAxiosError, makeProjectDetail, makeSection, makeTask } from '@/test/fixtures'

const ids = (list: { id: number }[]): number[] => list.map(({ id }) => id)

function loadSection(): ReturnType<typeof useProjectStore> {
  const store = useProjectStore()
  store.currentProject = makeProjectDetail({
    id: 5,
    sections: [
      makeSection({
        id: 10,
        tasks: [
          makeTask({ id: 1, position: 'a0' }),
          makeTask({ id: 2, position: 'a1' }),
          makeTask({ id: 3, position: 'a2' }),
        ],
      }),
    ],
  })
  return store
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('moveTask', () => {
  it('déplace la tâche tout de suite puis recopie la position du serveur', async () => {
    vi.mocked(taskApi.moveTask).mockResolvedValue({ id: 3, position: 'Zz' })
    const store = loadSection()

    const pending = store.moveTask(3, { afterId: null, beforeId: 1 }, 10)
    expect(ids(store.sections[0].tasks)).toEqual([3, 1, 2])

    await pending
    expect(taskApi.moveTask).toHaveBeenCalledWith(3, { afterId: null, beforeId: 1 })
    expect(store.sections[0].tasks[0].position).toBe('Zz')
  })

  it('recharge le projet et prévient quand la liste a changé ailleurs', async () => {
    vi.mocked(taskApi.moveTask).mockRejectedValue(makeAxiosError(409))
    vi.mocked(projectApi.getProjectById).mockResolvedValue(makeProjectDetail({ id: 5 }))
    const store = loadSection()

    await store.moveTask(3, { afterId: null, beforeId: 1 }, 10)

    expect(projectApi.getProjectById).toHaveBeenCalledWith(5)
    expect(useNotificationStore().queue).toEqual([
      { text: 'This list changed elsewhere and has been reloaded', color: 'error' },
    ])
  })

  it('abandonne les déplacements en attente après un échec', async () => {
    vi.mocked(taskApi.moveTask).mockRejectedValueOnce(makeAxiosError(409))
    vi.mocked(projectApi.getProjectById).mockResolvedValue(makeProjectDetail({ id: 5 }))
    const store = loadSection()

    await Promise.all([
      store.moveTask(3, { afterId: null, beforeId: 1 }, 10),
      store.moveTask(2, { afterId: null, beforeId: 3 }, 10),
    ])

    expect(taskApi.moveTask).toHaveBeenCalledOnce()
  })
})

describe('editTask', () => {
  it('remet une tâche décochée à sa place parmi les tâches à faire', async () => {
    const store = useProjectStore()
    store.currentProject = makeProjectDetail({
      tasks: [
        makeTask({ id: 1, position: 'a0' }),
        makeTask({ id: 3, position: 'a2' }),
        makeTask({ id: 2, position: 'a1', completed: true }),
      ],
    })
    vi.mocked(taskApi.updateTaskById).mockResolvedValue(makeTask({ id: 2, position: 'a1' }))

    await store.editTask(2, { completed: false })

    expect(ids(store.loadedProject.tasks)).toEqual([1, 2, 3])
  })

  it('place une tâche cochée en tête des terminées', async () => {
    const store = useProjectStore()
    store.currentProject = makeProjectDetail({
      tasks: [
        makeTask({ id: 1, position: 'a0' }),
        makeTask({ id: 2, position: 'a1' }),
        makeTask({ id: 3, completed: true }),
      ],
    })
    vi.mocked(taskApi.updateTaskById).mockResolvedValue(
      makeTask({ id: 1, position: 'a0', completed: true })
    )

    await store.editTask(1, { completed: true })

    expect(ids(store.loadedProject.tasks)).toEqual([2, 1, 3])
  })

  it('ne déplace pas une tâche terminée qu’on renomme', async () => {
    const store = useProjectStore()
    store.currentProject = makeProjectDetail({
      tasks: [
        makeTask({ id: 1 }),
        makeTask({ id: 2, completed: true }),
        makeTask({ id: 3, completed: true }),
      ],
    })
    vi.mocked(taskApi.updateTaskById).mockResolvedValue(
      makeTask({ id: 3, completed: true, name: 'Renommée' })
    )

    await store.editTask(3, { name: 'Renommée' })

    expect(ids(store.loadedProject.tasks)).toEqual([1, 2, 3])
  })
})
