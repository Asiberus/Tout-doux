import { DailyTask } from '@/models/daily-task.model'
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

export function isTaskPlanned(task: Task, dailyTasks: DailyTask[]): boolean {
  return dailyTasks.some(dailyTask => dailyTask.task?.id === task.id)
}

export function isTaskAvailable(
  task: Task,
  containerArchived: boolean,
  dailyTasks: DailyTask[]
): boolean {
  if (containerArchived) return isTaskPlanned(task, dailyTasks)
  return !task.completed || isTaskPlanned(task, dailyTasks)
}
