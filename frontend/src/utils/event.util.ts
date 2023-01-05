import { EventExtended, EventModel } from '@/models/event.model'
import moment, { Moment } from 'moment'

export interface SortEventOptions {
    handlePassedEvent: boolean
}

export function isPassed(event: EventExtended | EventModel): boolean {
    const { start_date, start_time, end_date, end_time, takes_whole_day } = event
    const start = moment(`${start_date}${start_time ? `T${start_time}` : ''}`)
    const end = end_date ? moment(`${end_date}${end_time ? `T${end_time}` : ''}`) : null

    if (end) return moment().isAfter(end, end_time ? 'minute' : 'day')
    if (takes_whole_day) return moment().isAfter(start, 'day')
    return moment().isAfter(start, start_time ? 'minute' : 'day')
}

export function isEventRelatedToDate(
    event: EventExtended | EventModel,
    date: string | Date | Moment
): boolean {
    const { start_date, end_date } = event
    if (end_date) return moment(date).isBetween(start_date, end_date, 'day', '[]')
    else return moment(date).isSame(start_date, 'day')
}

export function sortEvents(
    event1: EventExtended | EventModel,
    event2: EventExtended | EventModel,
    options: SortEventOptions = { handlePassedEvent: false }
): number {
    const { handlePassedEvent } = options
    const [start1, start2, end1, end2] = [
        moment(`${event1.start_date}T${event1.start_time ?? '00:00'}`),
        moment(`${event2.start_date}T${event2.start_time ?? '00:00'}`),
        event1.end_date ? moment(`${event1.end_date}T${event1.end_time ?? '00:00'}`) : undefined,
        event2.end_date ? moment(`${event2.end_date}T${event2.end_time ?? '00:00'}`) : undefined,
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
            if (event1.takes_whole_day && !event2.takes_whole_day) return -1
            else if (!event1.takes_whole_day && event2.takes_whole_day) return 1
        }
    } else return start1.isBefore(start2) ? -1 : 1

    return 0
}
