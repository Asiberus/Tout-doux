import { apiRoutes } from '@/api-routes'
import {
  EventExtendedModel,
  EventModel,
  EventPostOrPatch,
  EventPostOrPatchOptions,
  EventQueryOptions,
} from '@/models/event.model'
import { http } from '@/axios/http'

type EventReturn<T extends EventPostOrPatchOptions> = T['extended'] extends true
  ? EventExtendedModel
  : EventModel

export function getEvents(params: EventQueryOptions = {}): Promise<EventExtendedModel[]> {
  return http.get<EventExtendedModel[]>(apiRoutes.event, { params })
}

export function createEvent<Params extends EventPostOrPatchOptions>(
  event: EventPostOrPatch,
  params: Params
): Promise<EventReturn<Params>> {
  return http.post<EventReturn<Params>>(apiRoutes.event, event, { params })
}

export function updateEventById<Params extends EventPostOrPatchOptions>(
  eventId: number,
  event: EventPostOrPatch,
  params: Params
): Promise<EventReturn<Params>> {
  const url = apiRoutes.eventById.replace(':eventId', eventId.toString())
  return http.patch<EventReturn<Params>>(url, event, { params })
}

export function deleteEventById(eventId: number): Promise<void> {
  const url = apiRoutes.eventById.replace(':eventId', eventId.toString())
  return http.delete(url)
}
