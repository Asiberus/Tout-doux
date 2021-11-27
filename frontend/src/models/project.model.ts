import { Task } from '@/models/task.model'
import { SectionTask } from '@/models/section.model'

export interface Project {
    id: number
    name: string
    description: string
    archived: boolean
    created_at: string
}

export interface ProjectTask extends Project {
    sections: SectionTask[]
    tasks: Task[]
}
