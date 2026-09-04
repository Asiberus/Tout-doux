import { apiRoutes } from '@/api-routes'
import { Pagination, PaginationParams } from '@/models/pagination.model'
import { Tag, TagForm, TagType } from '@/models/tag.model'
import { UniqueResponse } from '@/models/common.model'
import { http } from '@/axios/http'

export interface IsTagNameUniqueParams {
  type: TagType
  name: string
  exclude_id?: number
}

interface TagListParams extends PaginationParams {
  type: TagType
  sort?: 'name'
  search?: string
}

export function getTagList(params: TagListParams): Promise<Pagination<Tag[]>> {
  return http.get<Pagination<Tag[]>>(apiRoutes.tag, { params })
}

export function isNameUnique(params: IsTagNameUniqueParams): Promise<UniqueResponse> {
  return http.get<UniqueResponse>(apiRoutes.tagUnique, { params })
}

export function createTag(tag: TagForm): Promise<Tag> {
  return http.post<Tag>(apiRoutes.tag, tag)
}

export function updateTag(id: number, tag: TagForm): Promise<Tag> {
  return http.patch<Tag>(apiRoutes.tagById.replace(':id', id.toString()), tag)
}

export function deleteTag(id: number): Promise<void> {
  return http.delete(apiRoutes.tagById.replace(':id', id.toString()))
}
