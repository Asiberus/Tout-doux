import { apiRoutes } from '@/api-routes'
import { Task, TaskPatch, TaskPost } from '@/models/task.model'
import { http } from '@/axios/http'

export function createTask(task: TaskPost): Promise<Task> {
  return http.post<Task>(apiRoutes.task, task)
}

export function updateTaskById(taskId: number, task: TaskPatch): Promise<Task> {
  return http.patch<Task>(apiRoutes.taskById.replace(':taskId', taskId.toString()), task)
}

export function deleteTaskById(taskId: number): Promise<void> {
  return http.delete(apiRoutes.taskById.replace(':taskId', taskId.toString()))
}
