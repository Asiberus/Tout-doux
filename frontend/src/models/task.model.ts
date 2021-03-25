import {PriorityEnum} from "@/models/priority.enum";

export interface TaskModel {
    id: number;
    name: string;
    description?: string;
    completed: boolean;
    priority: PriorityEnum;
    projectId?: number;
    collectionId?: number;
    deadline?: string;
    event: boolean;
    created_at: string;
    completed_at: string;
}

export interface TaskDisplayModel extends TaskModel {
    editMode: boolean;
}