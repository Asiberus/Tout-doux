import { apiRoutes } from '@/api-routes'
import { DailyTask, DailyTaskPatch, DailyTaskPost } from '@/models/daily-task.model'
import axiosInstance from '@/axios/axios-instance'
import { DailySummary } from '@/models/daily-summary.model'
import { Pagination } from '@/models/pagination.model'

export function getDailySummary(startDate: string, endDate: string): Promise<DailySummary[]> {
  const params = { start_date: startDate, end_date: endDate }
  return axiosInstance
    .get<DailySummary[]>(apiRoutes.dailyTaskSummary, { params })
    .then(response => response.data)
}

export function getDailyTasksByDate(date: string): Promise<Pagination<DailyTask[]>> {
  const params = { date, size: 0 }
  return axiosInstance
    .get<Pagination<DailyTask[]>>(apiRoutes.dailyTask, { params })
    .then(response => response.data)
}

export function createDailyTask(dailyTaskForm: DailyTaskPost): Promise<DailyTask> {
  return axiosInstance
    .post<DailyTask>(apiRoutes.dailyTask, dailyTaskForm)
    .then(response => response.data)
}

export function updateDailyTask(
  dailyTaskId: number,
  dailyTaskForm: DailyTaskPatch
): Promise<DailyTask> {
  const url = apiRoutes.dailyTaskById.replace(':dailyTaskId', dailyTaskId.toString())
  return axiosInstance.patch<DailyTask>(url, dailyTaskForm).then(response => response.data)
}

export function deleteDailyTask(dailyTaskId: number): Promise<void> {
  const url = apiRoutes.dailyTaskById.replace(':dailyTaskId', dailyTaskId.toString())
  return axiosInstance.delete(url).then(response => response.data)
}
