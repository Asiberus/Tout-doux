import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouteLocationNormalized } from 'vue-router'
import { dailyUpdateGuard } from '@/router/guards/daily-update.guard'
import { MAX_PLANNING_HORIZON_DAYS } from '@/utils/constants'
import moment from 'moment'

const TODAY = '2026-10-15'

function navigateTo(date: string): ReturnType<typeof dailyUpdateGuard> {
  const to = { params: { date, step: 'task' } } as unknown as RouteLocationNormalized
  return dailyUpdateGuard.call(undefined, to, to, () => undefined)
}

describe('dailyUpdateGuard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(`${TODAY}T10:00:00`))
  })

  afterEach(() => vi.useRealTimers())

  it('lets today through', () => {
    expect(navigateTo(TODAY)).toBeUndefined()
  })

  it('lets a past day through', () => {
    expect(navigateTo('2026-10-01')).toBeUndefined()
  })

  it('lets the last day of the planning horizon through', () => {
    const lastDay = moment(TODAY).add(MAX_PLANNING_HORIZON_DAYS, 'days').format('YYYY-MM-DD')
    expect(navigateTo(lastDay)).toBeUndefined()
  })

  it('redirects a day beyond the planning horizon to today', () => {
    const beyond = moment(TODAY)
      .add(MAX_PLANNING_HORIZON_DAYS + 1, 'days')
      .format('YYYY-MM-DD')
    expect(navigateTo(beyond)).toEqual({
      name: 'daily-update',
      params: { date: TODAY, step: 'task' },
    })
  })

  it('redirects an unreadable date to today', () => {
    expect(navigateTo('2026-13-45')).toEqual({
      name: 'daily-update',
      params: { date: TODAY, step: 'task' },
    })
  })
})
