import { EventModel } from '@/models/event.model'
import { Task } from '@/models/task.model'
import { SectionTask } from '@/models/section.model'
import { Tag } from '@/models/tag.model'

export interface ProjectPostOrPatch {
    name: string
    description: string
    tagIds: number[]
    archived?: boolean
}

export interface Project {
    id: number
    name: string
    description: string
    archived: boolean
    tags: Tag[]
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
