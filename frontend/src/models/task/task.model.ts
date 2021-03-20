import {PriorityEnum} from "@/models/project/priority.enum";

// Todo : change id to number
export interface TaskModel {
    id: number;
    name: string;
    description?: string;
    completed: boolean;
    priority: PriorityEnum;
    projectId?: number;
    listId?: number;
    deadline?: string;
    event: boolean;
}

export interface TaskDisplayModel extends TaskModel {
    editMode: boolean;
}