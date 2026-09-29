import { ProjectDetail } from '@/models/project.model'
import { Task } from '@/models/task.model'

export function filterCompleted(tasks: Task[]): Task[] {
  return tasks.filter(task => task.completed)
}

export function filterUncompleted(tasks: Task[]): Task[] {
  return tasks.filter(task => !task.completed)
}

export function flattenProjectTasks(project: ProjectDetail): Task[] {
  return project.tasks.concat(project.sections.flatMap(({ tasks }) => tasks))
}
