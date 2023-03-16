import Vue from 'vue'
import { apiRoutes } from '@/api-routes'
import { PaginationParams } from '@/models/common.model'
import { TagForm, TagType } from '@/models/tag.model'

export interface IsTagNameUniqueParams {
    type: TagType
    name: string
    exclude_id?: number
}

interface TagListParams extends PaginationParams {
    type: TagType
    search?: string
    exclude_ids?: string
}

export function getTagList(params: TagListParams) {
    return Vue.http.get(apiRoutes.tag, { params })
}

export function isNameUnique(params: IsTagNameUniqueParams) {
    return Vue.http.get(apiRoutes.tagUnique, { params })
}

export function createTag(tag: TagForm) {
    return Vue.http.post(apiRoutes.tag, tag)
}

export function updateTag(id: number, tag: TagForm) {
    return Vue.http.patch(apiRoutes.tagById.replace(':id', id.toString()), tag)
}

export function deleteTag(id: number) {
    return Vue.http.delete(apiRoutes.tagById.replace(':id', id.toString()))
}
