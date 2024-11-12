import { apiRoutes } from '@/api-routes'
import { EventPostOrPatch } from '@/models/event.model'
import axiosInstance from '@/axios/axios-instance'

export interface EventQueryOptions {
  date?: string
  month?: number
  year?: number
}

interface EventPostOrPatchOptions {
  extended?: boolean
}

export function getEvents(params: EventQueryOptions = {}) {
  return axiosInstance.get(apiRoutes.event, { params })
}

export function createEvent(event: EventPostOrPatch, params: EventPostOrPatchOptions = {}) {
  return axiosInstance.post(apiRoutes.event, event, { params })
}

export function updateEventById(
  eventId: number,
  event: EventPostOrPatch,
  params: EventPostOrPatchOptions = {}
) {
  return axiosInstance.patch(apiRoutes.eventById.replace(':eventId', eventId.toString()), event, {
    params,
  })
}

export function deleteEventById(eventId: number) {
  return axiosInstance.delete(apiRoutes.eventById.replace(':eventId', eventId.toString()))
}
