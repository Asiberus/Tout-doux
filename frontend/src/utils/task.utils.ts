import { ProjectDetail } from '@/models/project.model'
import { Task } from '@/models/task.model'
import moment from 'moment'

export function filterCompleted(tasks: Task[]): Task[] {
  return tasks.filter(task => task.completed)
}

export function filterUncompleted(tasks: Task[]): Task[] {
  return tasks.filter(task => !task.completed)
}

export function flattenProjectTasks(project: ProjectDetail): Task[] {
  return project.tasks.concat(project.sections.flatMap(({ tasks }) => tasks))
}

export function sortByCompletionDate(tasks: Task[]): Task[] {
  return tasks.sort((task1, task2) => {
    if (task1.completedAt && task2.completedAt)
      return moment(task1.completedAt).isAfter(task2.completedAt) ? -1 : 1

    return moment(task1.createdAt).isAfter(task2.createdAt) ? -1 : 1
  })
}
