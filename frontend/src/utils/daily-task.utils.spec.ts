import { describe, expect, it } from 'vitest'
import { dailyTaskName } from '@/utils/daily-task.utils'
import { makeDailyTask, makeTask } from '@/test/fixtures'

describe('dailyTaskName', () => {
  it('prend le nom de la tâche liée, puis de la tâche commune, puis le sien', () => {
    const commonTask = { id: 1, name: 'Common', tags: [] }
    expect(dailyTaskName(makeDailyTask({ task: makeTask({ name: 'Linked' }), commonTask }))).toBe(
      'Linked'
    )
    expect(dailyTaskName(makeDailyTask({ commonTask, name: 'Own' }))).toBe('Common')
    expect(dailyTaskName(makeDailyTask({ name: 'Own' }))).toBe('Own')
  })
})
