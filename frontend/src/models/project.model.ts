import {PriorityEnum} from "@/models/priority.enum";
import {TaskDisplayModel} from "@/models/task.model";

export interface ProjectModel {
    id: number;
    name: string;
    description: string;
    priority: PriorityEnum;
    archived: boolean;
    tasks: TaskDisplayModel[];
    created_at: string;
}

export interface DailyTaskProjectDisplayModel extends ProjectModel {
    selected: boolean;
}