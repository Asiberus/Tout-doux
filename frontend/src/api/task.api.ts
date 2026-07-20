import { apiRoutes } from '@/api-routes'
import { TaskPatch, TaskPost } from '@/models/task.model'
import axiosInstance from '@/axios/axios-instance'

export function createTask(task: TaskPost) {
  return axiosInstance.post(apiRoutes.task, task).then(response => response.data)
}

export function updateTaskById(taskId: number, task: TaskPatch) {
  return axiosInstance
    .patch(apiRoutes.taskById.replace(':taskId', taskId.toString()), task)
    .then(response => response.data)
}

export function deleteTaskById(taskId: number) {
  return axiosInstance
    .delete(apiRoutes.taskById.replace(':taskId', taskId.toString()))
    .then(response => response.data)
}
