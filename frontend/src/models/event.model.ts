import { Project } from '@/models/project.model'

export interface EventModel {
    id: number
    name: string
    start_date: string
    start_time: string | null
    end_date: string | null
    end_time: string | null
    takes_whole_day: boolean
    description: string | null
    projectId?: number
}

export interface EventExtended {
    id: number
    name: string
    start_date: string
    start_time: string | null
    end_date: string | null
    end_time: string | null
    takes_whole_day: boolean
    description: string | null
    project: Project | null
}
