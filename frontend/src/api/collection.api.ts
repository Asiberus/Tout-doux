import { apiRoutes } from '@/api-routes'
import {
  Collection,
  CollectionDetail,
  CollectionList,
  CollectionPatch,
  CollectionPost,
} from '@/models/collection.model'
import axiosInstance from '@/axios/axios-instance'
import { Pagination } from '@/models/pagination.model'

export function getCollectionList(params = {}): Promise<Pagination<CollectionList[]>> {
  return axiosInstance
    .get<Pagination<CollectionList[]>>(apiRoutes.collection, { params: { size: 0, ...params } })
    .then(response => response.data)
}

export function getCollectionListDetailed(params = {}): Promise<Pagination<CollectionDetail[]>> {
  return axiosInstance
    .get<
      Pagination<CollectionDetail[]>
    >(apiRoutes.collectionDetailed, { params: { size: 0, ...params } })
    .then(response => response.data)
}

export function getCollectionById(collectionId: number): Promise<CollectionDetail> {
  const url = apiRoutes.collectionById.replace(':collectionId', collectionId.toString())
  return axiosInstance.get<CollectionDetail>(url).then(response => response.data)
}

export function createCollection(collectionForm: CollectionPost): Promise<Collection> {
  return axiosInstance
    .post<Collection>(apiRoutes.collection, collectionForm)
    .then(response => response.data)
}

export function updateCollection(
  collectionId: number,
  collectionForm: CollectionPatch
): Promise<Collection> {
  const url = apiRoutes.collectionById.replace(':collectionId', collectionId.toString())
  return axiosInstance.patch<Collection>(url, collectionForm).then(response => response.data)
}

export function deleteCollection(collectionId: number): Promise<void> {
  const url = apiRoutes.collectionById.replace(':collectionId', collectionId.toString())
  return axiosInstance.delete(url).then(response => response.data)
}
