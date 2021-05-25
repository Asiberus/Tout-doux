import {TaskDisplayModel} from "@/models/task.model";

export interface ProjectModel {
    id: number;
    name: string;
    description: string;
    archived: boolean;
    tasks: TaskDisplayModel[];
    created_at: string;
}

export interface DailyTaskProjectDisplayModel extends ProjectModel {
    selected: boolean;
}