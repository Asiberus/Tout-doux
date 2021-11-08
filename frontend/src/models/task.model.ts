export interface TaskModel {
    id: number
    name: string
    completed: boolean
    projectId?: number
    sectionId?: number
    collectionId?: number
    created_at: string
    completed_at: string
}
