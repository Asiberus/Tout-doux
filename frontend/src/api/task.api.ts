import Vue from 'vue'
import { apiRoutes } from '@/api-routes'
import { TaskPatch, TaskPost } from '@/models/task.model'

const createTask = (task: TaskPost) => {
    return Vue.http.post(apiRoutes.task, task)
}

const updateTaskById = (taskId: number, task: TaskPatch) => {
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
