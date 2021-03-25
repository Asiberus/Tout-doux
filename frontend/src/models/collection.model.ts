import {TaskModel} from "@/models/task.model";

export default interface CollectionModel {
    id: number;
    name: string;
    description: string;
    tasks: TaskModel[];
    created_at: string;
}