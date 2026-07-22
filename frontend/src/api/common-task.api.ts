import { Pagination, PaginationParams } from '@/models/pagination.model'
import { apiRoutes } from '@/api-routes'
import { CommonTask, CommonTaskForm } from '@/models/common-task.model'
import { http } from '@/axios/http'
import { UniqueResponse } from '@/models/common.model'

export interface IsCommonTaskNameUniqueParams {
  name: string
  exclude_id?: number
}

export function getCommonTaskList(params: PaginationParams): Promise<Pagination<CommonTask[]>> {
  return http.get(apiRoutes.commonTask, { params })
}

export function isNameUnique(params: IsCommonTaskNameUniqueParams): Promise<UniqueResponse> {
  return http.get<UniqueResponse>(apiRoutes.commonTaskUnique, { params })
}

export function createCommonTask(commonTask: CommonTaskForm): Promise<CommonTask> {
  return http.post<CommonTask>(apiRoutes.commonTask, commonTask)
}

export function updateCommonTask(id: number, commonTask: CommonTaskForm): Promise<CommonTask> {
  const url = apiRoutes.commonTaskById.replace(':id', id.toString())
  return http.patch<CommonTask>(url, commonTask)
}

export function deleteCommonTask(id: number): Promise<void> {
  const url = apiRoutes.commonTaskById.replace(':id', id.toString())
  return http.delete(url)
}
