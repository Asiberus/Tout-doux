import { Collection, CollectionDetail } from '@/models/collection.model'
import { DailyTask, DailyUpdateTaskTab } from '@/models/daily-task.model'
import { Project, ProjectDetail } from '@/models/project.model'
import { Section } from '@/models/section.model'
import { Task } from '@/models/task.model'
import { DUE_SOON_DAYS, daysUntil, dueDateStatus } from '@/utils/due-date.utils'
import { isTaskAvailable, isTaskPlanned } from '@/utils/task.utils'

export interface DueContainer {
  tab: DailyUpdateTaskTab.Project | DailyUpdateTaskTab.Collection
  project?: Project
  section?: Section
  collection?: Collection
}

export interface DueEntry {
  task: Task
  container: DueContainer
  planned: boolean
}

export interface DueGroups {
  overdue: DueEntry[]
  today: DueEntry[]
  soon: DueEntry[]
}

function containerTasks(
  projects: ProjectDetail[],
  collections: CollectionDetail[]
): { task: Task; container: DueContainer }[] {
  const fromProjects = projects
    .filter(({ archived }) => !archived)
    .flatMap(project => {
      const container: DueContainer = { tab: DailyUpdateTaskTab.Project, project }
      return [
        ...project.tasks.map(task => ({ task, container })),
        ...project.sections.flatMap(section => {
          const sectionContainer: DueContainer = {
            tab: DailyUpdateTaskTab.Project,
            section: { id: section.id, name: section.name, project },
          }
          return section.tasks.map(task => ({ task, container: sectionContainer }))
        }),
      ]
    })
  const fromCollections = collections
    .filter(({ archived }) => !archived)
    .flatMap(collection => {
      const container: DueContainer = { tab: DailyUpdateTaskTab.Collection, collection }
      return collection.tasks.map(task => ({ task, container }))
    })

  return [...fromProjects, ...fromCollections]
}

export function collectDueEntries(
  projects: ProjectDetail[],
  collections: CollectionDetail[],
  dailyTasks: DailyTask[],
  referenceDay: string
): DueGroups {
  const groups: DueGroups = { overdue: [], today: [], soon: [] }

  const entries = containerTasks(projects, collections)
    .filter(({ task }) => !!task.dueDate && isTaskAvailable(task, false, dailyTasks))
    .map(entry => ({
      ...entry,
      planned: isTaskPlanned(entry.task, dailyTasks),
      days: daysUntil(entry.task.dueDate as string, referenceDay),
    }))
    .filter(({ days }) => days <= DUE_SOON_DAYS)
    .sort((entry1, entry2) => entry1.days - entry2.days)

  for (const { days, ...entry } of entries) {
    if (days < 0) groups.overdue.push(entry)
    else if (days === 0) groups.today.push(entry)
    else groups.soon.push(entry)
  }

  return groups
}

export function unplannedCount(groups: DueGroups): number {
  return [...groups.overdue, ...groups.today, ...groups.soon].filter(({ planned }) => !planned)
    .length
}

export function dueEntryCount(groups: DueGroups): number {
  return groups.overdue.length + groups.today.length + groups.soon.length
}

export function containerDueCount(
  tasks: Task[],
  referenceDay: string
): { count: number; overdue: boolean } {
  const statuses = tasks
    .map(task => dueDateStatus(task, referenceDay))
    .filter(status => status === 'overdue' || status === 'today')

  return { count: statuses.length, overdue: statuses.includes('overdue') }
}

export function initialDailyUpdateTab(
  readonly: boolean,
  dayLoaded: boolean,
  unplanned: number
): DailyUpdateTaskTab | null {
  if (readonly) return DailyUpdateTaskTab.Project
  if (!dayLoaded) return null
  return unplanned > 0 ? DailyUpdateTaskTab.Due : DailyUpdateTaskTab.Project
}
