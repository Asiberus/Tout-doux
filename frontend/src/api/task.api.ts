import { apiRoutes } from '@/api-routes'
import { DueSummary, Task, TaskPatch, TaskPost } from '@/models/task.model'
import { http } from '@/axios/http'
import { MoveAnchors, OrderPosition } from '@/models/ordering.model'

export function createTask(task: TaskPost): Promise<Task> {
  return http.post<Task>(apiRoutes.task, task)
}

export function updateTaskById(taskId: number, task: TaskPatch): Promise<Task> {
  return http.patch<Task>(apiRoutes.taskById.replace(':taskId', taskId.toString()), task)
}

export function deleteTaskById(taskId: number): Promise<void> {
  return http.delete(apiRoutes.taskById.replace(':taskId', taskId.toString()))
}

export function moveTask(taskId: number, anchors: MoveAnchors): Promise<OrderPosition> {
  return http.post<OrderPosition>(apiRoutes.taskMove.replace(':taskId', taskId.toString()), anchors)
}

export function getDueSummary(date: string): Promise<DueSummary> {
  return http.get<DueSummary>(apiRoutes.taskDueSummary, { params: { date } })
}
