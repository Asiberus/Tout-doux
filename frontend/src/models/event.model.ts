import { Project } from '@/models/project.model'

export interface EventModel {
    id: number
    name: string
    startDate: string
    startTime: string | null
    endDate: string | null
    endTime: string | null
    takesWholeDay: boolean
    description: string | null
    projectId?: number
}

export interface EventExtended {
    id: number
    name: string
    startDate: string
    startTime: string | null
    endDate: string | null
    endTime: string | null
    takesWholeDay: boolean
    description: string | null
    project: Project | null
}
