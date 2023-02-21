import Vue from 'vue'
import { apiRoutes } from '@/api-routes'
import { DailyTaskPatch, DailyTaskPost } from '@/models/daily-task.model'

const getDailySummary = (page: number, size = 21) => {
    const params = {
        page: page.toString(),
        size: size.toString(),
    }
    return Vue.http.get(apiRoutes.dailyTaskSummary, { params })
}

const getDailyTasksByDate = (date: string) => {
    const params = { date, size: 0 }
    return Vue.http.get(apiRoutes.dailyTask, { params })
}

const createDailyTask = (dailyTaskForm: DailyTaskPost) => {
    return Vue.http.post(apiRoutes.dailyTask, dailyTaskForm)
}

const updateDailyTask = (dailyTaskId: number, dailyTaskForm: DailyTaskPatch) => {
    return Vue.http.patch(
        apiRoutes.dailyTaskById.replace(':dailyTaskId', dailyTaskId.toString()),
        dailyTaskForm
    )
}

const deleteDailyTask = (dailyTaskId: number) => {
    return Vue.http.delete(apiRoutes.dailyTaskById.replace(':dailyTaskId', dailyTaskId.toString()))
}

export const dailyTaskService = {
    getDailySummary,
    getDailyTasksByDate,
    createDailyTask,
    updateDailyTask,
    deleteDailyTask,
}
