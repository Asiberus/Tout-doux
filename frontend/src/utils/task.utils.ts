import { Task } from '@/models/task.model'
import moment from 'moment'

export function sortByCompletionDate(tasks: Task[]): Task[] {
  return tasks.sort((task1, task2) => {
    if (task1.completedAt && task2.completedAt)
      return moment(task1.completedAt).isAfter(task2.completedAt) ? -1 : 1

    return moment(task1.createdAt).isAfter(task2.createdAt) ? -1 : 1
  })
}
