import {TaskModel} from "@/models/task.model";

export default interface ListModel {
    id: number;
    name: string;
    description: string;
    tasks: TaskModel[];
    created_at: string;
}