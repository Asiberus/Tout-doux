import { Task } from '@/models/task.model'

export interface CollectionPost {
  name: string
  description: string
  itemName: string
}

export interface CollectionPatch {
  name?: string
  description?: string
  itemName?: string
  archived?: boolean
}
export interface Collection {
  id: number
  name: string
  description: string
  itemName: string
  createdOn: string
  archived: boolean
}

export interface CollectionList extends Collection {
  taskCount: number
  completedTaskCount: number
}

export interface CollectionDetail extends Collection {
  tasks: Task[]
}
