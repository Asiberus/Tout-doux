import { EventModel } from '@/models/event.model'
import Vue from 'vue'
import { apiRoutes } from '@/api-routes'

export interface EventQueryOptions {
    date?: string
    month?: number
    year?: number
}

const getEvents = (params: EventQueryOptions = {}) => {
    return Vue.http.get(apiRoutes.event, { params })
}

const createEvent = (event: Partial<EventModel>) => {
    return Vue.http.post(apiRoutes.event, event)
}

const updateEventById = (eventId: number, event: Partial<EventModel>) => {
    return Vue.http.patch(apiRoutes.eventById.replace(':eventId', eventId.toString()), event)
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
