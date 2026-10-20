import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api', () => ({
  taskApi: { getDueSummary: vi.fn() },
}))

import { taskApi } from '@/api'
import { DueSummary } from '@/models/task.model'
import { useDueStore } from '@/store/due.store'

const SUMMARY: DueSummary = {
  late: 2,
  today: 1,
  containers: [
    { type: 'project', id: 4, late: 1, today: 1, planned: 1 },
    { type: 'collection', id: 1, late: 0, today: 1, planned: 0 },
  ],
}

const getDueSummary = vi.mocked(taskApi.getDueSummary)

describe('useDueStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 22, 10, 0))
    getDueSummary.mockReset()
    getDueSummary.mockResolvedValue(SUMMARY)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('charge le résumé du jour courant', async () => {
    const store = useDueStore()
    await store.refresh()

    expect(getDueSummary).toHaveBeenCalledWith('2026-10-22')
    expect(store.toPlanCount).toBe(3)
    expect(store.hasLate).toBe(true)
  })

  it('compte les échéances d’un conteneur, planifiées comprises', async () => {
    const store = useDueStore()
    await store.refresh()

    expect(store.containerDue('project', 4)).toEqual({ count: 2, late: true })
    expect(store.containerDue('collection', 1)).toEqual({ count: 1, late: false })
    expect(store.containerDue('project', 99)).toEqual({ count: 0, late: false })
  })

  it('ne relance pas une donnée fraîche, sauf si on la force', async () => {
    const store = useDueStore()
    await store.refresh()
    await store.refresh()
    expect(getDueSummary).toHaveBeenCalledTimes(1)

    await store.refresh({ force: true })
    expect(getDueSummary).toHaveBeenCalledTimes(2)
  })

  it('relance une donnée de plus d’une minute', async () => {
    const store = useDueStore()
    await store.refresh()
    vi.advanceTimersByTime(61_000)
    await store.refresh()

    expect(getDueSummary).toHaveBeenCalledTimes(2)
  })

  it('relance au changement de jour', async () => {
    const store = useDueStore()
    await store.refresh()
    vi.setSystemTime(new Date(2026, 9, 23, 0, 0, 30))
    await store.refresh()

    expect(getDueSummary).toHaveBeenLastCalledWith('2026-10-23')
  })

  it('partage une requête déjà en cours', async () => {
    const store = useDueStore()
    await Promise.all([store.refresh({ force: true }), store.refresh({ force: true })])

    expect(getDueSummary).toHaveBeenCalledTimes(1)
  })

  it('garde la dernière valeur si la requête échoue', async () => {
    const store = useDueStore()
    await store.refresh()
    getDueSummary.mockRejectedValueOnce(new Error('réseau'))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await store.refresh({ force: true })

    expect(store.toPlanCount).toBe(3)
  })

  it('se vide', async () => {
    const store = useDueStore()
    await store.refresh()
    store.reset()

    expect(store.toPlanCount).toBe(0)
    await store.refresh()
    expect(getDueSummary).toHaveBeenCalledTimes(2)
  })
})
