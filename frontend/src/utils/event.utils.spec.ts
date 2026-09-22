import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isEventRelatedToDate, isPassed, sortEvents } from '@/utils/event.utils'
import { makeEvent } from '@/test/fixtures'

const NOW = '2026-03-10T12:00:00'

describe('isPassed', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(NOW))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('compare à la minute quand une heure de fin est fournie', () => {
    expect(isPassed(makeEvent({ endDate: '2026-03-10', endTime: '11:00' }))).toBe(true)
    expect(isPassed(makeEvent({ endDate: '2026-03-10', endTime: '13:00' }))).toBe(false)
  })

  it('compare au jour quand la fin n’a pas d’heure', () => {
    expect(isPassed(makeEvent({ endDate: '2026-03-09' }))).toBe(true)
    expect(isPassed(makeEvent({ endDate: '2026-03-10' }))).toBe(false)
  })

  it('considère un événement sur toute la journée comme en cours le jour même', () => {
    expect(isPassed(makeEvent({ startDate: '2026-03-10', takesWholeDay: true }))).toBe(false)
    expect(isPassed(makeEvent({ startDate: '2026-03-09', takesWholeDay: true }))).toBe(true)
  })

  it('se rabat sur la date de début en l’absence de fin', () => {
    expect(isPassed(makeEvent({ startDate: '2026-03-10', startTime: '11:00' }))).toBe(true)
    expect(isPassed(makeEvent({ startDate: '2026-03-10', startTime: '13:00' }))).toBe(false)
  })
})

describe('isEventRelatedToDate', () => {
  it('exige le même jour quand l’événement n’a pas de fin', () => {
    const event = makeEvent({ startDate: '2026-03-10' })

    expect(isEventRelatedToDate(event, '2026-03-10')).toBe(true)
    expect(isEventRelatedToDate(event, '2026-03-11')).toBe(false)
  })

  it('inclut les deux bornes quand l’événement s’étale', () => {
    const event = makeEvent({ startDate: '2026-03-10', endDate: '2026-03-12' })

    expect(isEventRelatedToDate(event, '2026-03-10')).toBe(true)
    expect(isEventRelatedToDate(event, '2026-03-11')).toBe(true)
    expect(isEventRelatedToDate(event, '2026-03-12')).toBe(true)
    expect(isEventRelatedToDate(event, '2026-03-13')).toBe(false)
  })
})

describe('sortEvents', () => {
  it('ordonne par date de début croissante', () => {
    const early = makeEvent({ startDate: '2026-03-10' })
    const late = makeEvent({ startDate: '2026-03-11' })

    expect(sortEvents(early, late)).toBe(-1)
    expect(sortEvents(late, early)).toBe(1)
  })

  it('à début égal, place la fin la plus proche en premier', () => {
    const short = makeEvent({ startDate: '2026-03-10', endDate: '2026-03-11' })
    const long = makeEvent({ startDate: '2026-03-10', endDate: '2026-03-12' })

    expect(sortEvents(short, long)).toBe(-1)
    expect(sortEvents(long, short)).toBe(1)
  })

  it('à début égal, place l’événement sans fin avant celui qui en a une', () => {
    const noEnd = makeEvent({ startDate: '2026-03-10' })
    const withEnd = makeEvent({ startDate: '2026-03-10', endDate: '2026-03-12' })

    expect(sortEvents(noEnd, withEnd)).toBe(-1)
    expect(sortEvents(withEnd, noEnd)).toBe(1)
  })

  it('à début égal et sans fin des deux côtés, place la journée entière en premier', () => {
    const wholeDay = makeEvent({ startDate: '2026-03-10', takesWholeDay: true })
    const timed = makeEvent({ startDate: '2026-03-10' })

    expect(sortEvents(wholeDay, timed)).toBe(-1)
    expect(sortEvents(timed, wholeDay)).toBe(1)
  })

  it('renvoie 0 pour deux événements indiscernables', () => {
    expect(sortEvents(makeEvent(), makeEvent())).toBe(0)
  })

  it('remonte les événements passés en tête quand l’option est activée', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(NOW))

    const passed = makeEvent({ startDate: '2026-03-01' })
    const upcoming = makeEvent({ startDate: '2026-03-20' })

    expect(sortEvents(passed, upcoming, { handlePassedEvent: true })).toBe(-1)
    expect(sortEvents(upcoming, passed, { handlePassedEvent: true })).toBe(1)

    vi.useRealTimers()
  })
})
