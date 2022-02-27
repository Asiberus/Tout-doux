import Vue from 'vue'
import { apiRoutes } from '@/environment'
import { Task } from '@/models/task.model'

const createTask = (task: Partial<Task>) => {
    return Vue.http.post(apiRoutes.task, task)
}

const updateTaskById = (taskId: number, task: Partial<Task>) => {
    return Vue.http.patch(apiRoutes.taskById.replace(':taskId', taskId.toString()), task)
}

const deleteTaskById = (taskId: number) => {
    return Vue.http.delete(apiRoutes.taskById.replace(':taskId', taskId.toString()))
}

export const taskService = {
    createTask,
    updateTaskById,
    deleteTaskById,
}
