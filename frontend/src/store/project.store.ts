import { EventPostOrPatch } from '@/models/event.model'
import { SectionPost } from '@/models/section.model'
import { Task, TaskPatch, TaskPost } from '@/models/task.model'
import { sortEvents } from '@/utils/event.utils'
import { ProjectDetail, ProjectPostOrPatch } from '@/models/project.model'
import { sortByCompletionDate } from '@/utils/task.utils'
import { defineStore } from 'pinia'
import { eventApi, projectApi, sectionApi, taskApi } from '@/api'

interface ProjectStoreState {
  currentProject?: ProjectDetail
}

interface ProjectStoreActions {
  retrieveProject(id: number): Promise<void>
  removeCurrentProject(): void
  updateProperties(data: ProjectPostOrPatch): Promise<void>
  addSection(section: SectionPost): Promise<void>
  editSection(id: number, name: string): Promise<void>
  deleteSection(id: number): Promise<void>
  addTask(task: TaskPost): Promise<void>
  editTask(id: number, data: TaskPatch, sectionId?: number): Promise<void>
  sortTasks(sectionId?: number): void
  deleteTask(id: number, sectionId?: number): Promise<void>
  addEvent(event: EventPostOrPatch): Promise<void>
  editEvent(id: number, data: EventPostOrPatch): Promise<void>
  deleteEvent(id: number): Promise<void>
}

export const useProjectStore = defineStore<'project', ProjectStoreState, {}, ProjectStoreActions>(
  'project',
  {
    state: (): ProjectStoreState => ({
      currentProject: undefined,
    }),
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

      async updateProperties(data: ProjectPostOrPatch): Promise<void> {
        if (!this.currentProject) return

        projectApi.updateProject(this.currentProject.id, data).then(
          response => {
            this.currentProject = { ...this.currentProject, response }
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

            if (response.projectId) {
              this.currentProject.tasks.unshift(response)
            } else if (response.sectionId) {
              const section = this.currentProject.sections.find(s => s.id === response.sectionId)
              if (section) section.tasks.unshift(response)
            }
          },
          error => console.error(error)
        )
      },

      // TODO : test that
      async editTask(taskId: number, data: TaskPatch, sectionId?: number): Promise<void> {
        await taskApi.updateTaskById(taskId, data).then(
          (updatedTask: Task) => {
            if (!this.currentProject) return

            if (sectionId) {
              const section = this.currentProject.sections.find(({ id }) => id === sectionId)
              if (section) {
                const taskToUpdate = section.tasks.find(({ id }) => id === updatedTask.id)
                if (taskToUpdate) Object.assign(taskToUpdate, updatedTask)
              }
              this.sortTasks(sectionId)
            } else {
              const taskToUpdate = this.currentProject.tasks.find(({ id }) => id === updatedTask.id)
              if (taskToUpdate) Object.assign(taskToUpdate, updatedTask)
              this.sortTasks()
            }
          },
          error => console.error(error)
        )
      },

      sortTasks(sectionId?: number): void {
        if (!this.currentProject) return

        if (sectionId) {
          const section = this.currentProject.sections.find(({ id }) => id === sectionId)
          if (section) section.tasks = [...sortByCompletionDate(section.tasks)]
        } else {
          this.currentProject.tasks = [...sortByCompletionDate(this.currentProject.tasks)]
        }
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
        await eventApi.createEvent(event).then(
          response => {
            if (!this.currentProject) return

            this.currentProject.events.push(response)
            this.currentProject.events.sort((event1, event2) => sortEvents(event1, event2))
          },
          error => console.error(error)
        )
      },

      async editEvent(id: number, data: EventPostOrPatch): Promise<void> {
        await eventApi.updateEventById(id, data).then(
          response => {
            if (!this.currentProject) return

            const { events } = this.currentProject
            const eventToUpdate = events.find(({ id }) => response.id === id)
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
  }
)
