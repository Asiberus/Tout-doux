import { PaginationParams } from '@/models/common.model'
import Vue from 'vue'
import { apiRoutes } from '@/api-routes'
import { CommonTaskForm } from '@/models/common-task.model'

export interface IsCommonTaskNameUniqueParams {
    name: string
    exclude_id?: number
}

export function getCommonTaskList(params: PaginationParams) {
    return Vue.http.get(apiRoutes.commonTask, { params })
}

export function isNameUnique(params: IsCommonTaskNameUniqueParams) {
    return Vue.http.get(apiRoutes.commonTaskUnique, { params })
}

export function createCommonTask(commonTask: CommonTaskForm) {
    return Vue.http.post(apiRoutes.commonTask, commonTask)
}

export function updateCommonTask(id: number, commonTask: CommonTaskForm) {
    const url = apiRoutes.commonTaskById.replace(':id', id.toString())
    return Vue.http.patch(url, commonTask)
}

export function deleteCommonTask(id: number) {
    const url = apiRoutes.commonTaskById.replace(':id', id.toString())
    return Vue.http.delete(url)
}
