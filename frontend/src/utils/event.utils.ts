import { EventModel } from '@/models/event.model'
import moment, { Moment } from 'moment'

export interface SortEventOptions {
  handlePassedEvent: boolean
}

export function isPassed(event: EventModel): boolean {
  const { startDate, startTime, endDate, endTime, takesWholeDay } = event
  const start = moment(`${startDate}${startTime ? `T${startTime}` : ''}`)
  const end = endDate ? moment(`${endDate}${endTime ? `T${endTime}` : ''}`) : null

  if (end) return moment().isAfter(end, endTime ? 'minute' : 'day')
  if (takesWholeDay) return moment().isAfter(start, 'day')
  return moment().isAfter(start, startTime ? 'minute' : 'day')
}

export function isEventRelatedToDate(event: EventModel, date: string | Date | Moment): boolean {
  const { startDate, endDate } = event
  if (endDate) return moment(date).isBetween(startDate, endDate, 'day', '[]')
  else return moment(date).isSame(startDate, 'day')
}

export function sortEvents(
  event1: EventModel,
  event2: EventModel,
  options: SortEventOptions = { handlePassedEvent: false }
): number {
  const { handlePassedEvent } = options
  const [start1, start2, end1, end2] = [
    moment(`${event1.startDate}T${event1.startTime ?? '00:00'}`),
    moment(`${event2.startDate}T${event2.startTime ?? '00:00'}`),
    event1.endDate ? moment(`${event1.endDate}T${event1.endTime ?? '00:00'}`) : undefined,
    event2.endDate ? moment(`${event2.endDate}T${event2.endTime ?? '00:00'}`) : undefined,
  ]

  if (handlePassedEvent) {
    if (isPassed(event1) && !isPassed(event2)) return -1
    if (!isPassed(event1) && isPassed(event2)) return 1
  }

  if (start1.isSame(start2)) {
    if (end1 && end2) return end1.isBefore(end2) ? -1 : 1
    else if (end1 && !end2) return 1
    else if (!end1 && end2) return -1
    else {
      if (event1.takesWholeDay && !event2.takesWholeDay) return -1
      else if (!event1.takesWholeDay && event2.takesWholeDay) return 1
    }
  } else return start1.isBefore(start2) ? -1 : 1

  return 0
}
