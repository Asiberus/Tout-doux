import { apiRoutes } from '@/environment'
import Vue from 'vue'
import { Collection } from '@/models/collection.model'

const getCollectionList = (params = {}) => {
    return Vue.http.get(apiRoutes.collection, { params: { size: 0, ...params } })
}

const getCollectionById = (collectionId: number) => {
    return Vue.http.get(apiRoutes.collectionById.replace(':collectionId', collectionId.toString()))
}

const createCollection = (collectionForm: Partial<Collection>) => {
    return Vue.http.post(apiRoutes.collection, collectionForm)
}

const updateCollection = (collectionId: number, collectionForm: Partial<Collection>) => {
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
    getCollectionById,
    createCollection,
    updateCollection,
    deleteCollection,
}
