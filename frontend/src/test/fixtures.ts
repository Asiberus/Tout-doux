import { EventModel } from '@/models/event.model'
import { ProjectDetail } from '@/models/project.model'
import { SectionTask } from '@/models/section.model'
import { Task } from '@/models/task.model'

export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 1,
    name: 'Tâche',
    completed: false,
    tags: [],
    createdAt: '2026-01-01T09:00:00',
    completedAt: '',
    ...overrides,
  }
}

export function makeSection(overrides: Partial<SectionTask> = {}): SectionTask {
  return { id: 1, name: 'Section', tasks: [], ...overrides }
}

export function makeEvent(overrides: Partial<EventModel> = {}): EventModel {
  return { id: 1, name: 'Événement', startDate: '2026-03-10', takesWholeDay: false, ...overrides }
}

export function makeProjectDetail(overrides: Partial<ProjectDetail> = {}): ProjectDetail {
  return {
    id: 1,
    name: 'Projet',
    description: '',
    archived: false,
    tags: [],
    createdOn: '2026-01-01',
    sections: [],
    tasks: [],
    events: [],
    ...overrides,
  }
}
