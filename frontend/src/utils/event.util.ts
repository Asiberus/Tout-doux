import { EventExtended, EventModel } from '@/models/event.model'
import moment, { Moment } from 'moment'

export interface SortEventOptions {
    handlePassedEvent: boolean
}

export function isPassed(event: EventExtended | EventModel): boolean {
    const { start_date, end_date, takes_whole_day } = event
    if (end_date) return moment().isAfter(end_date)
    if (takes_whole_day) return moment().isAfter(start_date, 'day')
    return moment().isAfter(start_date)
}

export function isEventRelatedToDate(
    event: EventExtended | EventModel,
    date: string | Date | Moment
): boolean {
    const { start_date, end_date } = event
    if (!end_date) return moment(date).isSame(start_date, 'day')
    return moment(date).isBetween(start_date, end_date, 'day', '[]')
}

export function sortEvents(
    event1: EventExtended | EventModel,
    event2: EventExtended | EventModel,
    options: SortEventOptions = { handlePassedEvent: false }
): number {
    const { handlePassedEvent } = options
    const [start1, start2, end1, end2] = [
        moment(event1.start_date),
        moment(event2.start_date),
        event1.end_date ? moment(event1.end_date) : undefined,
        event2.end_date ? moment(event2.end_date) : undefined,
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
