export interface TaskModel {
    id: number;
    name: string;
    completed: boolean;
    projectId?: number;
    collectionId?: number;
    created_at: string;
    completed_at: string;
}

export interface TaskDisplayModel extends TaskModel {
    editMode: boolean;
}