import { EventModel } from '@/models/event.model'
import Vue from 'vue'
import { apiRoutes } from '@/api-routes'

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
    createEvent,
    updateEventById,
    deleteEventById,
}
