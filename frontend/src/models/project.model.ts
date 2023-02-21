import { EventModel } from '@/models/event.model'
import { Task } from '@/models/task.model'
import { SectionTask } from '@/models/section.model'

export interface ProjectPostOrPatch {
    name: string
    description: string
    archived?: boolean
}

export interface Project {
    id: number
    name: string
    description: string
    archived: boolean
    createdOn: string
}

export interface ProjectList extends Project {
    taskCount: number
    completedTaskCount: number
}

export interface ProjectDetail extends Project {
    sections: SectionTask[]
    tasks: Task[]
    events: EventModel[]
}
