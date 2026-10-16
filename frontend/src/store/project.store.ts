import { EventModel, EventPostOrPatch } from '@/models/event.model'
import { SectionPost, SectionTask } from '@/models/section.model'
import { Task, TaskPatch, TaskPost } from '@/models/task.model'
import { isPassed, sortEvents } from '@/utils/event.utils'
import { useNow } from '@/composables/useNow'
import { ProjectDetail, ProjectPatch } from '@/models/project.model'
import { filterCompleted, filterUncompleted, flattenProjectTasks } from '@/utils/task.utils'
import { defineStore } from 'pinia'
import { eventApi, projectApi, sectionApi, taskApi } from '@/api'
import { MoveAnchors } from '@/models/ordering.model'
import { useNotificationStore } from '@/store/notification.store'
import {
  applyMove,
  createMoveQueue,
  moveFailureMessage,
  repositionAfterToggle,
} from '@/utils/ordering.utils'

interface ProjectStoreState {
  currentProject?: ProjectDetail
}

interface ProjectStoreGetters extends Record<string, (state: ProjectStoreState) => unknown> {
  loadedProject(state: ProjectStoreState): ProjectDetail
  sections(state: ProjectStoreState): SectionTask[]
  completedTasks(state: ProjectStoreState): Task[]
  uncompletedTasks(state: ProjectStoreState): Task[]
  allTasks(state: ProjectStoreState): Task[]
  allCompletedTasks(state: ProjectStoreState): Task[]
  comingEvents(state: ProjectStoreState): EventModel[]
  passedEvents(state: ProjectStoreState): EventModel[]
}

interface ProjectStoreActions {
  retrieveProject(id: number): Promise<void>
  removeCurrentProject(): void
  updateProperties(data: ProjectPatch): Promise<void>
  addSection(section: SectionPost): Promise<void>
  editSection(id: number, name: string): Promise<void>
  deleteSection(id: number): Promise<void>
  addTask(task: TaskPost): Promise<void>
  editTask(id: number, data: TaskPatch, sectionId?: number): Promise<void>
  moveTask(taskId: number, anchors: MoveAnchors, sectionId?: number): Promise<void>
  deleteTask(id: number, sectionId?: number): Promise<void>
  addEvent(event: EventPostOrPatch): Promise<void>
  editEvent(id: number, data: EventPostOrPatch): Promise<void>
  deleteEvent(id: number): Promise<void>
}

function tasksOf(project: ProjectDetail, sectionId?: number): Task[] | undefined {
  if (sectionId === undefined) return project.tasks
  return project.sections.find(({ id }) => id === sectionId)?.tasks
}

const moveQueue = createMoveQueue(error => {
  const projectStore = useProjectStore()
  useNotificationStore().notifyError(moveFailureMessage(error))
  if (projectStore.currentProject) projectStore.retrieveProject(projectStore.currentProject.id)
})

export const useProjectStore = defineStore<
  'project',
  ProjectStoreState,
  ProjectStoreGetters,
  ProjectStoreActions
>('project', {
  state: (): ProjectStoreState => ({
    currentProject: undefined,
  }),
  getters: {
    loadedProject(state): ProjectDetail {
      if (!state.currentProject) throw new Error('currentProject accessed before being loaded')
      return state.currentProject
    },
    sections(state): SectionTask[] {
      if (!state.currentProject) return []
      return state.currentProject.sections
    },
    completedTasks(state): Task[] {
      if (!state.currentProject) return []
      return filterCompleted(state.currentProject.tasks)
    },
    uncompletedTasks(state): Task[] {
      if (!state.currentProject) return []
      return filterUncompleted(state.currentProject.tasks)
    },
    allTasks(state): Task[] {
      if (!state.currentProject) return []
      return flattenProjectTasks(state.currentProject)
    },
    allCompletedTasks(state): Task[] {
      if (!state.currentProject) return []
      return filterCompleted(flattenProjectTasks(state.currentProject))
    },
    comingEvents(state): EventModel[] {
      if (!state.currentProject) return []
      const { now } = useNow()
      return state.currentProject.events.filter(event => !isPassed(event, now.value))
    },
    passedEvents(state): EventModel[] {
      if (!state.currentProject) return []
      const { now } = useNow()
      return state.currentProject.events.filter(event => isPassed(event, now.value)).reverse()
    },
  },
  actions: {
    async retrieveProject(id: number): Promise<void> {
      await projectApi.getProjectById(id).then(
        response => {
          if (response.events)
            response.events = response.events.sort((event1, event2) => sortEvents(event1, event2))

          this.currentProject = response
        },
        error => {
          // TODO: redirect to project list
          console.error(error)
          this.removeCurrentProject()
        }
      )
    },

    removeCurrentProject(): void {
      this.currentProject = undefined
    },

    async updateProperties(data: ProjectPatch): Promise<void> {
      if (!this.currentProject) return

      await projectApi.updateProject(this.currentProject.id, data).then(
        response => {
          if (!this.currentProject) return

          this.currentProject = { ...this.currentProject, ...response }
        },
        error => {
          console.error(error)
        }
      )
    },

    // Section

    async addSection(section: SectionPost): Promise<void> {
      await sectionApi.createSection(section).then(
        response => {
          if (!this.currentProject) return

          this.currentProject.sections.unshift(response)
        },
        error => {
          console.error(error)
        }
      )
    },

    async editSection(id: number, name: string): Promise<void> {
      await sectionApi.updateSection(id, { name }).then(
        response => {
          if (!this.currentProject) return

          const section = this.currentProject.sections.find(s => s.id === id)
          if (section) section.name = response.name
        },
        error => {
          console.error(error)
        }
      )
    },

    async deleteSection(id: number): Promise<void> {
      await sectionApi.deleteSection(id).then(
        () => {
          if (!this.currentProject) return

          const index = this.currentProject.sections.findIndex(s => s.id === id)
          if (index !== -1) this.currentProject.sections.splice(index, 1)
        },
        error => {
          console.error(error)
        }
      )
    },

    // Task

    async addTask(task: TaskPost): Promise<void> {
      await taskApi.createTask(task).then(
        response => {
          if (!this.currentProject) return

          if (task.sectionId) {
            const section = this.currentProject.sections.find(s => s.id === task.sectionId)
            if (section) section.tasks.unshift(response)
          } else if (task.projectId) {
            this.currentProject.tasks.unshift(response)
          }
        },
        error => console.error(error)
      )
    },

    async editTask(taskId: number, data: TaskPatch, sectionId?: number): Promise<void> {
      await taskApi.updateTaskById(taskId, data).then(
        (updatedTask: Task) => {
          if (!this.currentProject) return

          const tasks = tasksOf(this.currentProject, sectionId)
          const taskToUpdate = tasks?.find(task => task.id === updatedTask.id)
          if (!tasks || !taskToUpdate) return

          const toggled = taskToUpdate.completed !== updatedTask.completed
          Object.assign(taskToUpdate, updatedTask)
          if (toggled) repositionAfterToggle(tasks, taskToUpdate)
        },
        error => console.error(error)
      )
    },

    moveTask(taskId: number, anchors: MoveAnchors, sectionId?: number): Promise<void> {
      const tasks = this.currentProject && tasksOf(this.currentProject, sectionId)
      if (!tasks) return Promise.resolve()

      applyMove(tasks, taskId, anchors)
      return moveQueue.enqueue(async () => {
        const { position } = await taskApi.moveTask(taskId, anchors)
        const project = this.currentProject
        const task = project && tasksOf(project, sectionId)?.find(({ id }) => id === taskId)
        if (task) task.position = position
      })
    },

    async deleteTask(id: number, sectionId?: number): Promise<void> {
      await taskApi.deleteTaskById(id).then(
        () => {
          if (!this.currentProject) return

          if (sectionId) {
            const section = this.currentProject.sections.find(s => s.id === sectionId)
            if (section) {
              const index = section.tasks.findIndex(t => t.id === id)
              if (index !== -1) section.tasks.splice(index, 1)
            }
          } else {
            const index = this.currentProject.tasks.findIndex(t => t.id === id)
            if (index !== -1) this.currentProject.tasks.splice(index, 1)
          }
        },
        error => console.error(error)
      )
    },

    // Event

    async addEvent(event: EventPostOrPatch): Promise<void> {
      await eventApi.createEvent(event, { extended: false }).then(
        response => {
          if (!this.currentProject) return

          this.currentProject.events.push(response)
          this.currentProject.events.sort((event1, event2) => sortEvents(event1, event2))
        },
        error => console.error(error)
      )
    },

    async editEvent(id: number, data: EventPostOrPatch): Promise<void> {
      await eventApi.updateEventById(id, data, { extended: false }).then(
        response => {
          if (!this.currentProject) return

          const { events } = this.currentProject
          const eventToUpdate = events.find(event => response.id === event.id)
          if (eventToUpdate) {
            Object.assign(eventToUpdate, response)
            events.sort((event1, event2) => sortEvents(event1, event2))
          }
        },
        error => console.error(error)
      )
    },

    async deleteEvent(id: number): Promise<void> {
      await eventApi.deleteEventById(id).then(
        () => {
          if (!this.currentProject) return

          const { events } = this.currentProject
          const index = events.findIndex(event => event.id === id)
          if (index !== -1) events.splice(index, 1)
        },
        error => console.error(error)
      )
    },
  },
})
