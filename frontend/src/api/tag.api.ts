import { apiRoutes } from '@/api-routes'
import { PaginationParams } from '@/models/pagination.model'
import { TagForm, TagType } from '@/models/tag.model'
import axiosInstance from '@/axios/axios-instance'

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
  return axiosInstance.get(apiRoutes.tag, { params })
}

export function isNameUnique(params: IsTagNameUniqueParams) {
  return axiosInstance.get(apiRoutes.tagUnique, { params })
}

export function createTag(tag: TagForm) {
  return axiosInstance.post(apiRoutes.tag, tag)
}

export function updateTag(id: number, tag: TagForm) {
  return axiosInstance.patch(apiRoutes.tagById.replace(':id', id.toString()), tag)
}

export function deleteTag(id: number) {
  return axiosInstance.delete(apiRoutes.tagById.replace(':id', id.toString()))
}
