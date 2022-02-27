import Vue from 'vue'
import { apiRoutes } from '@/environment'
import { DailyTask } from '@/models/daily-task.model'

const getDailyTaskSummary = (page: number, size = 21) => {
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

const createDailyTask = (dailyTaskForm: Partial<DailyTask>) => {
    return Vue.http.post(apiRoutes.dailyTask, dailyTaskForm)
}

const updateDailyTask = (dailyTaskId: number, dailyTaskForm: Partial<DailyTask>) => {
    return Vue.http.patch(
        apiRoutes.dailyTaskById.replace(':dailyTaskId', dailyTaskId.toString()),
        dailyTaskForm
    )
}

const deleteDailyTask = (dailyTaskId: number) => {
    return Vue.http.delete(apiRoutes.dailyTaskById.replace(':dailyTaskId', dailyTaskId.toString()))
}

export const dailyTaskService = {
    getDailyTaskSummary,
    getDailyTasksByDate,
    createDailyTask,
    updateDailyTask,
    deleteDailyTask,
}
