export type TagType = 'project' | 'task'

export interface Tag {
  id: number
  type: TagType
  name: string
  color: string
}

export interface TagForm {
  type: TagType
  name: string
  color: string
}
