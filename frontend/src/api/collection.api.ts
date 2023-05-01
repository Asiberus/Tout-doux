import { apiRoutes } from '@/api-routes'
import Vue from 'vue'
import { CollectionPatch, CollectionPost } from '@/models/collection.model'

const getCollectionList = (params = {}) => {
    return Vue.http.get(apiRoutes.collection, { params: { size: 0, ...params } })
}

const getCollectionListDetailed = (params = {}) => {
    return Vue.http.get(apiRoutes.collectionDetailed, { params: { size: 0, ...params } })
}

const getCollectionById = (collectionId: number) => {
    return Vue.http.get(apiRoutes.collectionById.replace(':collectionId', collectionId.toString()))
}

const createCollection = (collectionForm: CollectionPost) => {
    return Vue.http.post(apiRoutes.collection, collectionForm)
}

const updateCollection = (collectionId: number, collectionForm: CollectionPatch) => {
    return Vue.http.patch(
        apiRoutes.collectionById.replace(':collectionId', collectionId.toString()),
        collectionForm
    )
}

const deleteCollection = (collectionId: number) => {
    return Vue.http.delete(
        apiRoutes.collectionById.replace(':collectionId', collectionId.toString())
    )
}

export const collectionService = {
    getCollectionList,
    getCollectionListDetailed,
    getCollectionById,
    createCollection,
    updateCollection,
    deleteCollection,
}
