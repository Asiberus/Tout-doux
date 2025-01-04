import { apiRoutes } from '@/api-routes'
import {
  EventExtendedModel,
  EventModel,
  EventPostOrPatch,
  EventPostOrPatchOptions,
  EventQueryOptions,
} from '@/models/event.model'
import axiosInstance from '@/axios/axios-instance'

type EventReturn<T extends EventPostOrPatchOptions> = T['extended'] extends true
  ? EventExtendedModel
  : EventModel

export function getEvents(params: EventQueryOptions = {}): Promise<EventExtendedModel[]> {
  return axiosInstance
    .get<EventExtendedModel[]>(apiRoutes.event, { params })
    .then(response => response.data)
}

export function createEvent<Params extends EventPostOrPatchOptions>(
  event: EventPostOrPatch,
  params: Params
): Promise<EventReturn<Params>> {
  return axiosInstance
    .post<EventReturn<Params>>(apiRoutes.event, event, { params })
    .then(response => response.data)
}

export function updateEventById<Params extends EventPostOrPatchOptions>(
  eventId: number,
  event: EventPostOrPatch,
  params: Params
): Promise<EventReturn<Params>> {
  const url = apiRoutes.eventById.replace(':eventId', eventId.toString())
  return axiosInstance
    .patch<EventReturn<Params>>(url, event, { params })
    .then(response => response.data)
}

export function deleteEventById(eventId: number): Promise<void> {
  const url = apiRoutes.eventById.replace(':eventId', eventId.toString())
  return axiosInstance.delete(url).then(response => response.data)
}
