import { environment } from '@/environments/environment.dev'
import Vue from 'vue'
import { Collection } from '@/models/collection.model'

const getCollectionList = (params = {}) => {
    return Vue.http.get(environment.collection, { params: { size: 0, ...params } })
}

const getCollectionById = (collectionId: number) => {
    return Vue.http.get(
        environment.collectionById.replace(':collectionId', collectionId.toString())
    )
}

const createCollection = (collectionForm: Partial<Collection>) => {
    return Vue.http.post(environment.collection, collectionForm)
}

const updateCollection = (collectionId: number, collectionForm: Partial<Collection>) => {
    return Vue.http.patch(
        environment.collectionById.replace(':collectionId', collectionId.toString()),
        collectionForm
    )
}

const deleteCollection = (collectionId: number) => {
    return Vue.http.delete(
        environment.collectionById.replace(':collectionId', collectionId.toString())
    )
}

export const collectionService = {
    getCollectionList,
    getCollectionById,
    createCollection,
    updateCollection,
    deleteCollection,
}
