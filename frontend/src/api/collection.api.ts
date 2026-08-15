import { apiRoutes } from '@/api-routes'
import {
  Collection,
  CollectionDetail,
  CollectionList,
  CollectionPatch,
  CollectionPost,
} from '@/models/collection.model'
import { http } from '@/axios/http'
import { Pagination } from '@/models/pagination.model'

export function getCollectionList(params = {}): Promise<Pagination<CollectionList[]>> {
  return http.get<Pagination<CollectionList[]>>(apiRoutes.collection, {
    params: { size: 0, ...params },
  })
}

export function getCollectionListDetailed(params = {}): Promise<Pagination<CollectionDetail[]>> {
  return http.get<Pagination<CollectionDetail[]>>(apiRoutes.collectionDetailed, {
    params: { size: 0, ...params },
  })
}

export function getCollectionById(collectionId: number): Promise<CollectionDetail> {
  const url = apiRoutes.collectionById.replace(':collectionId', collectionId.toString())
  return http.get<CollectionDetail>(url)
}

export function createCollection(collectionForm: CollectionPost): Promise<Collection> {
  return http.post<Collection>(apiRoutes.collection, collectionForm)
}

export function updateCollection(
  collectionId: number,
  collectionForm: CollectionPatch
): Promise<Collection> {
  const url = apiRoutes.collectionById.replace(':collectionId', collectionId.toString())
  return http.patch<Collection>(url, collectionForm)
}

export function deleteCollection(collectionId: number): Promise<void> {
  const url = apiRoutes.collectionById.replace(':collectionId', collectionId.toString())
  return http.delete(url)
}
