import { apiRoutes } from '@/api-routes'
import { DailyTask, DailyTaskPatch, DailyTaskPost } from '@/models/daily-task.model'
import { http } from '@/axios/http'
import { DailySummary } from '@/models/daily-summary.model'
import { Pagination } from '@/models/pagination.model'

export function getDailySummary(startDate: string, endDate: string): Promise<DailySummary[]> {
  const params = { start_date: startDate, end_date: endDate }
  return http.get<DailySummary[]>(apiRoutes.dailyTaskSummary, { params })
}

export function getDailyTasksByDate(date: string): Promise<Pagination<DailyTask[]>> {
  const params = { date, size: 0 }
  return http.get<Pagination<DailyTask[]>>(apiRoutes.dailyTask, { params })
}

export function getCarryOverCandidates(): Promise<DailyTask[]> {
  return http.get<DailyTask[]>(apiRoutes.dailyTaskCarryOverCandidates)
}

export function carryOverPreviousDay(): Promise<DailyTask[]> {
  return http.post<DailyTask[]>(apiRoutes.dailyTaskCarryOver)
}

export function createDailyTask(dailyTaskForm: DailyTaskPost): Promise<DailyTask> {
  return http.post<DailyTask>(apiRoutes.dailyTask, dailyTaskForm)
}

export function updateDailyTask(
  dailyTaskId: number,
  dailyTaskForm: DailyTaskPatch
): Promise<DailyTask> {
  const url = apiRoutes.dailyTaskById.replace(':dailyTaskId', dailyTaskId.toString())
  return http.patch<DailyTask>(url, dailyTaskForm)
}

export function deleteDailyTask(dailyTaskId: number): Promise<void> {
  const url = apiRoutes.dailyTaskById.replace(':dailyTaskId', dailyTaskId.toString())
  return http.delete(url)
}
