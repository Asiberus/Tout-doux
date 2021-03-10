import TaskModel from "@/models/task/task.model";

export default interface ListModel {
    id: string;
    name: string;
    description?: string;
    tasks: TaskModel[];
}