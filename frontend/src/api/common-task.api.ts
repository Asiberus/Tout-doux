import { Pagination, PaginationParams } from '@/models/pagination.model'
import { apiRoutes } from '@/api-routes'
import { CommonTask, CommonTaskForm } from '@/models/common-task.model'
import axiosInstance from '@/axios/axios-instance'
import { UniqueResponse } from '@/models/common.model'

export interface IsCommonTaskNameUniqueParams {
  name: string
  exclude_id?: number
}

export function getCommonTaskList(params: PaginationParams): Promise<Pagination<CommonTask[]>> {
  return axiosInstance.get(apiRoutes.commonTask, { params }).then(response => response.data)
}

export function isNameUnique(params: IsCommonTaskNameUniqueParams): Promise<UniqueResponse> {
  return axiosInstance
    .get<UniqueResponse>(apiRoutes.commonTaskUnique, { params })
    .then(response => response.data)
}

export function createCommonTask(commonTask: CommonTaskForm): Promise<CommonTask> {
  return axiosInstance
    .post<CommonTask>(apiRoutes.commonTask, commonTask)
    .then(response => response.data)
}

export function updateCommonTask(id: number, commonTask: CommonTaskForm): Promise<CommonTask> {
  const url = apiRoutes.commonTaskById.replace(':id', id.toString())
  return axiosInstance.patch<CommonTask>(url, commonTask).then(response => response.data)
}

export function deleteCommonTask(id: number): Promise<void> {
  const url = apiRoutes.commonTaskById.replace(':id', id.toString())
  return axiosInstance.delete(url).then(response => response.data)
}
