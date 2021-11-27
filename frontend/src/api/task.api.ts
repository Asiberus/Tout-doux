import Vue from 'vue'
import { environment } from '@/environments/environment.dev'
import { Task, TaskPost } from '@/models/task.model'

const createTask = (task: Partial<TaskPost>) => {
    return Vue.http.post(environment.task, task)
}

const updateTaskById = (taskId: number, task: Partial<TaskPost>) => {
    return Vue.http.patch(environment.taskById.replace(':taskId', taskId.toString()), task)
}

const deleteTaskById = (taskId: number) => {
    return Vue.http.delete(environment.taskById.replace(':taskId', taskId.toString()))
}

export const taskService = {
    createTask,
    updateTaskById,
    deleteTaskById,
}
