import { apiRoutes } from '@/api-routes'
import { CollectionPatch, CollectionPost } from '@/models/collection.model'
import axiosInstance from '@/axios/axios-instance'

export function getCollectionList(params = {}) {
  return axiosInstance.get(apiRoutes.collection, { params: { size: 0, ...params } })
}

export function getCollectionListDetailed(params = {}) {
  return axiosInstance.get(apiRoutes.collectionDetailed, { params: { size: 0, ...params } })
}

export function getCollectionById(collectionId: number) {
  return axiosInstance.get(
    apiRoutes.collectionById.replace(':collectionId', collectionId.toString())
  )
}

export function createCollection(collectionForm: CollectionPost) {
  return axiosInstance.post(apiRoutes.collection, collectionForm)
}

export function updateCollection(collectionId: number, collectionForm: CollectionPatch) {
  return axiosInstance.patch(
    apiRoutes.collectionById.replace(':collectionId', collectionId.toString()),
    collectionForm
  )
}

export function deleteCollection(collectionId: number) {
  return axiosInstance.delete(
    apiRoutes.collectionById.replace(':collectionId', collectionId.toString())
  )
}
