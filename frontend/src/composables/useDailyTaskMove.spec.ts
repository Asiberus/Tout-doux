import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { Ref, ref } from 'vue'

vi.mock('@/api', () => ({ dailyTaskApi: { moveDailyTask: vi.fn() } }))

import { dailyTaskApi } from '@/api'
import { useDailyTaskMove } from '@/composables/useDailyTaskMove'
import { useNotificationStore } from '@/store/notification.store'
import { makeAxiosError, makeDailyTask } from '@/test/fixtures'
import { DailyTask } from '@/models/daily-task.model'

const lines = (): Ref<DailyTask[]> =>
  ref([
    makeDailyTask({ id: 1, position: 'a0' }),
    makeDailyTask({ id: 2, position: 'a1', completed: true }),
    makeDailyTask({ id: 3, position: 'a2' }),
  ])

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('useDailyTaskMove', () => {
  it('déplace la ligne tout de suite, terminée ou non, puis recopie la position', async () => {
    vi.mocked(dailyTaskApi.moveDailyTask).mockResolvedValue({ id: 2, position: 'a3' })
    const list = lines()
    const { moveDailyTask } = useDailyTaskMove(list, vi.fn())

    const pending = moveDailyTask(2, { afterId: 3, beforeId: null })
    expect(list.value.map(({ id }) => id)).toEqual([1, 3, 2])

    await pending
    expect(list.value[2].position).toBe('a3')
  })

  it('recharge le jour et prévient au moindre échec', async () => {
    vi.mocked(dailyTaskApi.moveDailyTask).mockRejectedValue(makeAxiosError(403))
    const reload = vi.fn()
    const { moveDailyTask } = useDailyTaskMove(lines(), reload)

    await moveDailyTask(3, { afterId: null, beforeId: 1 })

    expect(reload).toHaveBeenCalledOnce()
    expect(useNotificationStore().queue).toEqual([
      { text: 'This list changed elsewhere and has been reloaded', color: 'error' },
    ])
  })
})
