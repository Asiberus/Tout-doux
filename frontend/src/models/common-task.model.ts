import { Tag } from '@/models/tag.model'

export interface CommonTask {
  id: number
  name: string
  tags: Tag[]
}

export interface CommonTaskForm {
  name: string
  tagIds: number[]
}
