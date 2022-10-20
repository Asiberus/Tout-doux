import { apiRoutes } from '@/api-routes'
import { EventModel } from '@/models/event.model'
import Vue from 'vue'

export interface EventQueryOptions {
    date?: string
    month?: number
    year?: number
}

// Todo : rename
interface EventOptions {
    extended?: boolean
}

const getEvents = (params: EventQueryOptions = {}) => {
    return Vue.http.get(apiRoutes.event, { params })
}

const createEvent = (event: Partial<EventModel>, params: EventOptions = {}) => {
    return Vue.http.post(apiRoutes.event, event, { params })
}

const updateEventById = (
    eventId: number,
    event: Partial<EventModel>,
    params: EventOptions = {}
) => {
    return Vue.http.patch(apiRoutes.eventById.replace(':eventId', eventId.toString()), event, {
        params,
    })
}

const deleteEventById = (eventId: number) => {
    return Vue.http.delete(apiRoutes.eventById.replace(':eventId', eventId.toString()))
}

export const eventService = {
    getEvents,
    createEvent,
    updateEventById,
    deleteEventById,
}
