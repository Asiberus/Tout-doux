import { apiRoutes } from '@/api-routes'
import { DailyTaskPatch, DailyTaskPost } from '@/models/daily-task.model'
import axiosInstance from '@/axios/axios-instance'

export function getDailySummary(startDate: string, endDate: string) {
  const params = {
    start_date: startDate,
    end_date: endDate,
  }
  return axiosInstance.get(apiRoutes.dailyTaskSummary, { params })
}

export function getDailyTasksByDate(date: string) {
  const params = { date, size: 0 }
  return axiosInstance.get(apiRoutes.dailyTask, { params })
}

export function createDailyTask(dailyTaskForm: DailyTaskPost) {
  return axiosInstance.post(apiRoutes.dailyTask, dailyTaskForm)
}

export function updateDailyTask(dailyTaskId: number, dailyTaskForm: DailyTaskPatch) {
  return axiosInstance.patch(
    apiRoutes.dailyTaskById.replace(':dailyTaskId', dailyTaskId.toString()),
    dailyTaskForm
  )
}

export function deleteDailyTask(dailyTaskId: number) {
  return axiosInstance.delete(
    apiRoutes.dailyTaskById.replace(':dailyTaskId', dailyTaskId.toString())
  )
}
