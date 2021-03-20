import {TaskModel} from "@/models/task/task.model";

export default interface ListModel {
    id: number;
    name: string;
    description?: string;
    tasks: TaskModel[];
}