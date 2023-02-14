import { EventModel } from '@/models/event.model'
import { Task } from '@/models/task.model'
import { SectionTask } from '@/models/section.model'

export interface Project {
    id: number
    name: string
    description: string
    archived: boolean
    createdOn: string
}

export interface ProjectDetail extends Project {
    sections: SectionTask[]
    tasks: Task[]
    events: EventModel[]
}

export interface ProjectListModel {
    id: number
    name: string
    description: string
    archived: boolean
    createdOn: string
    taskCount: number
    completedTaskCount: number
}
