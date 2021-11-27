import Vue from 'vue'
import { environment } from '@/environments/environment.dev'
import { DailyTask } from '@/models/daily-task.model'

const getDailyTaskOverview = (page: number, size = 21) => {
    const params = {
        page: page.toString(),
        size: size.toString(),
    }
    return Vue.http.get(environment.dailyTaskOverview, { params })
}

const getDailyTasksByDate = (date: string) => {
    const params = { date }
    return Vue.http.get(environment.dailyTask, { params })
}

const createDailyTask = (dailyTaskForm: Partial<DailyTask>) => {
    return Vue.http.post(environment.dailyTask, dailyTaskForm)
}

const updateDailyTask = (dailyTaskId: number, dailyTaskForm: Partial<DailyTask>) => {
    return Vue.http.patch(
        environment.dailyTaskById.replace(':dailyTaskId', dailyTaskId.toString()),
        dailyTaskForm
    )
}

const deleteDailyTask = (dailyTaskId: number) => {
    return Vue.http.delete(
        environment.dailyTaskById.replace(':dailyTaskId', dailyTaskId.toString())
    )
}

export const dailyTaskService = {
    getDailyTaskOverview,
    getDailyTasksByDate,
    createDailyTask,
    updateDailyTask,
    deleteDailyTask,
}
