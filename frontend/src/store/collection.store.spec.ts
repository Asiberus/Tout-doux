import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api', () => ({
  taskApi: { moveTask: vi.fn(), updateTaskById: vi.fn() },
  collectionApi: { getCollectionById: vi.fn() },
}))

import { collectionApi, taskApi } from '@/api'
import { useCollectionStore } from '@/store/collection.store'
import { makeAxiosError, makeTask } from '@/test/fixtures'
import { CollectionDetail } from '@/models/collection.model'

function makeCollection(
  tasks = [makeTask({ id: 1, position: 'a0' }), makeTask({ id: 2, position: 'a1' })]
): CollectionDetail {
  return {
    id: 8,
    name: 'C',
    description: '',
    itemName: 'task',
    createdOn: '2026-01-01',
    archived: false,
    tasks,
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('moveTask', () => {
  it('déplace la tâche tout de suite puis recopie la position du serveur', async () => {
    vi.mocked(taskApi.moveTask).mockResolvedValue({ id: 2, position: 'Zz' })
    const store = useCollectionStore()
    store.currentCollection = makeCollection()

    const pending = store.moveTask(2, { afterId: null, beforeId: 1 })
    expect(store.loadedCollection.tasks.map(({ id }) => id)).toEqual([2, 1])

    await pending
    expect(store.loadedCollection.tasks[0].position).toBe('Zz')
  })

  it('recharge la collection au moindre échec', async () => {
    vi.mocked(taskApi.moveTask).mockRejectedValue(makeAxiosError(500))
    vi.mocked(collectionApi.getCollectionById).mockResolvedValue(makeCollection())
    const store = useCollectionStore()
    store.currentCollection = makeCollection()

    await store.moveTask(2, { afterId: null, beforeId: 1 })

    expect(collectionApi.getCollectionById).toHaveBeenCalledWith(8)
  })
})

describe('editTask', () => {
  it('remet une tâche décochée à sa place', async () => {
    const store = useCollectionStore()
    store.currentCollection = makeCollection([
      makeTask({ id: 1, position: 'a0' }),
      makeTask({ id: 3, position: 'a2' }),
      makeTask({ id: 2, position: 'a1', completed: true }),
    ])
    vi.mocked(taskApi.updateTaskById).mockResolvedValue(makeTask({ id: 2, position: 'a1' }))

    await store.editTask(2, { completed: false })

    expect(store.loadedCollection.tasks.map(({ id }) => id)).toEqual([1, 2, 3])
  })
})
