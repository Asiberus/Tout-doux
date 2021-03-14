import TaskModel from "@/models/task/task.model";
import Vue from "vue";
import {environment} from "@/environments/environment.dev";

const updateTaskById = (taskId: string, task: Partial<TaskModel>) => {
    return Vue.http.patch(environment.taskById.replace(':taskId', taskId), task);
};

const deleteTaskById = (taskId: string) => {
    return Vue.http.delete(environment.taskById.replace(':taskId', taskId));
}

export const taskService = {
    updateTaskById,
    deleteTaskById
};