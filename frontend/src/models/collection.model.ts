import {TaskDisplayModel} from "@/models/task.model";

export interface CollectionModel {
    id: number;
    name: string;
    description: string;
    tasks: TaskDisplayModel[];
    created_at: string;
}

export interface DailyTaskCollectionDisplayModel extends CollectionModel {
    selected: boolean;
}