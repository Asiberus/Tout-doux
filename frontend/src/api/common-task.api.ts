import { PaginationParams } from '@/models/common.model'
import { apiRoutes } from '@/api-routes'
import { CommonTaskForm } from '@/models/common-task.model'
import axiosInstance from '@/axios/axios-instance'

export interface IsCommonTaskNameUniqueParams {
  name: string
  exclude_id?: number
}

export function getCommonTaskList(params: PaginationParams) {
  return axiosInstance.get(apiRoutes.commonTask, { params })
}

export function isNameUnique(params: IsCommonTaskNameUniqueParams) {
  return axiosInstance.get(apiRoutes.commonTaskUnique, { params })
}

export function createCommonTask(commonTask: CommonTaskForm) {
  return axiosInstance.post(apiRoutes.commonTask, commonTask)
}

export function updateCommonTask(id: number, commonTask: CommonTaskForm) {
  const url = apiRoutes.commonTaskById.replace(':id', id.toString())
  return axiosInstance.patch(url, commonTask)
}

export function deleteCommonTask(id: number) {
  const url = apiRoutes.commonTaskById.replace(':id', id.toString())
  return axiosInstance.delete(url)
}
