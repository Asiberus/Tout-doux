import { Project } from '@/models/project.model'

export interface EventPostOrPatch {
  name: string
  description: string | null
  startDate: string
  startTime: string | null
  endDate: string | null
  endTime: string | null
  takesWholeDay: boolean
  projectId?: number
}

export interface EventModel {
  id: number
  description?: string
  name: string
  startDate: string
  startTime?: string
  endDate?: string
  endTime?: string
  takesWholeDay: boolean
  project?: Project
}
