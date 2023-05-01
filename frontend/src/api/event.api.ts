import { apiRoutes } from '@/api-routes'
import { EventPostOrPatch } from '@/models/event.model'
import Vue from 'vue'

export interface EventQueryOptions {
    date?: string
    month?: number
    year?: number
}

interface EventPostOrPatchOptions {
    extended?: boolean
}

const getEvents = (params: EventQueryOptions = {}) => {
    return Vue.http.get(apiRoutes.event, { params })
}

const createEvent = (event: EventPostOrPatch, params: EventPostOrPatchOptions = {}) => {
    return Vue.http.post(apiRoutes.event, event, { params })
}

const updateEventById = (
    eventId: number,
    event: EventPostOrPatch,
    params: EventPostOrPatchOptions = {}
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
