import { eventService } from '@/api/event.api'
import { sectionService } from '@/api/section.api'
import { taskService } from '@/api/task.api'
import { EventModel, EventPostOrPatch } from '@/models/event.model'
import { SectionPost, SectionTask } from '@/models/section.model'
import { Task, TaskPatch, TaskPost } from '@/models/task.model'
import { sortEvents } from '@/utils/event.utils'
import { Vue } from 'vue-property-decorator'
import { Action, Module, Mutation, VuexModule } from 'vuex-module-decorators'
import { ProjectDetail, ProjectPostOrPatch } from '@/models/project.model'
import { projectService } from '@/api/project.api'
import { Tag } from '@/models/tag.model'
import { sortByCompletionDate } from '@/utils/task.utils'

export const projectMutations = {
    setCurrentProject: 'SET_CURRENT_PROJECT',
    updateProperties: 'UPDATE_PROJECT_PROPERTIES',
    sortTasks: 'SORT_TASKS',
    section: {
        addSection: 'PROJECT_ADD_SECTION',
        editSection: 'PROJECT_EDIT_SECTION',
        deleteSection: 'PROJECT_DELETE_SECTION',
    },
    task: {
        addTask: 'PROJECT_ADD_TASK',
        editTask: 'PROJECT_EDIT_TASK',
        deleteTask: 'PROJECT_DELETE_TASK',
    },
    event: {
        addEvent: 'PROJECT_ADD_EVENT',
        editEvent: 'PROJECT_EDIT_EVENT',
        deleteEvent: 'PROJECT_DELETE_EVENT',
    },
}

export const projectActions = {
    retrieveProject: 'retrieveProject',
    updateProperties: 'updateProjectProperties',
    section: {
        addSection: 'projectAddSection',
        editSection: 'projectEditSection',
        deleteSection: 'projectDeleteSection',
    },
    task: {
        addTask: 'projectAddTask',
        editTask: 'projectEditTask',
        deleteTask: 'projectDeleteTask',
    },
    event: {
        addEvent: 'projectAddEvent',
        editEvent: 'projectEditEvent',
        deleteEvent: 'projectDeleteEvent',
    },
}

@Module
export class ProjectModule extends VuexModule {
    // State
    currentProject?: ProjectDetail

    // Mutations
    @Mutation
    private [projectMutations.setCurrentProject](project: ProjectDetail | undefined): void {
        if (project?.events)
            project.events = project.events.sort((event1, event2) => sortEvents(event1, event2))

        // Due to Vue reactivity lack with undefined properties we need to call the Vue.set function
        Vue.set(this, 'currentProject', project)
    }

    @Mutation
    private [projectMutations.updateProperties](payload: {
        name: string
        description: string
        tags: Tag[]
        archived: boolean
    }): void {
        if (!this.currentProject) return

        Object.assign(this.currentProject, payload)
    }

    @Mutation
    private [projectMutations.sortTasks](sectionId?: number): void {
        if (!this.currentProject) return

        if (sectionId) {
            const section = this.currentProject.sections.find(({ id }) => id === sectionId)
            if (section) section.tasks = [...sortByCompletionDate(section.tasks)]
        } else {
            this.currentProject.tasks = [...sortByCompletionDate(this.currentProject.tasks)]
        }
    }

    @Mutation
    private [projectMutations.section.addSection](section: SectionTask): void {
        if (!this.currentProject) return

        this.currentProject.sections.push(section)
    }

    @Mutation
    private [projectMutations.section.editSection](payload: { id: number; name: string }): void {
        if (!this.currentProject) return

        const { id, name } = payload
        const section = this.currentProject.sections.find(s => s.id === id)

        if (section) section.name = name
    }

    @Mutation
    private [projectMutations.section.deleteSection](id: number): void {
        if (!this.currentProject) return

        const index = this.currentProject.sections.findIndex(s => s.id === id)
        if (index !== -1) this.currentProject.sections.splice(index, 1)
    }

    @Mutation
    private [projectMutations.task.addTask](payload: {
        task: Task
        projectId?: number
        sectionId?: number
    }): void {
        if (!this.currentProject) return

        const { task, projectId, sectionId } = payload
        if (projectId) {
            this.currentProject.tasks.unshift(task)
        } else if (sectionId) {
            const section = this.currentProject.sections.find(s => s.id === sectionId)
            if (section) section.tasks.unshift(task)
        }
    }

    @Mutation
    private [projectMutations.task.editTask](payload: {
        task: Task
        projectId?: number
        sectionId?: number
    }): void {
        if (!this.currentProject) return

        const { task: updatedTask, projectId, sectionId } = payload
        if (projectId) {
            const task = this.currentProject.tasks.find(({ id }) => id === updatedTask.id)
            if (task) Object.assign(task, updatedTask)
        } else if (sectionId) {
            const section = this.currentProject.sections.find(({ id }) => id === sectionId)
            if (section) {
                const task = section.tasks.find(({ id }) => id === updatedTask.id)
                if (task) Object.assign(task, updatedTask)
            }
        }
    }

    @Mutation
    private [projectMutations.task.deleteTask](payload: { id: number; sectionId?: number }): void {
        if (!this.currentProject) return

        const { id, sectionId } = payload
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
    }

    @Mutation
    private [projectMutations.event.addEvent](event: EventModel): void {
        if (!this.currentProject) return

        this.currentProject.events.push(event)
        this.currentProject.events.sort((event1, event2) => sortEvents(event1, event2))
    }

    @Mutation
    private [projectMutations.event.editEvent](event: EventModel): void {
        if (!this.currentProject) return

        const { events } = this.currentProject
        const eventToUpdate = events.find(({ id }) => event.id === id)
        if (eventToUpdate) {
            Object.assign(eventToUpdate, event)
            events.sort((event1, event2) => sortEvents(event1, event2))
        }
    }

    @Mutation
    private [projectMutations.event.deleteEvent](id: number): void {
        if (!this.currentProject) return

        const { events } = this.currentProject
        const index = events.findIndex(event => event.id === id)
        if (index !== -1) events.splice(index, 1)
    }

    // Actions
    @Action
    async [projectActions.retrieveProject](id: number): Promise<void> {
        await projectService.getProjectById(id).then(
            (response: { body: any }) => {
                this.context.commit(projectMutations.setCurrentProject, response.body)
            },
            (error: any) => {
                // TODO: redirect to project list
                console.error(error)
                this.context.commit(projectMutations.setCurrentProject, undefined)
            }
        )
    }

    @Action
    async [projectActions.updateProperties](payload: {
        id: number
        data: ProjectPostOrPatch
    }): Promise<void> {
        const { id, data } = payload
        projectService.updateProject(id, data).then(
            (response: any) => {
                const { name, description, archived, tags } = response.body
                this.context.commit(projectMutations.updateProperties, {
                    name,
                    description,
                    tags,
                    archived,
                })
            },
            (error: any) => {
                console.error(error)
            }
        )
    }

    @Action
    async [projectActions.section.addSection](section: SectionPost): Promise<void> {
        await sectionService.createSection(section).then(
            (response: any) => {
                this.context.commit(projectMutations.section.addSection, response.body)
            },
            (error: any) => {
                console.error(error)
            }
        )
    }

    @Action
    async [projectActions.section.editSection](payload: {
        id: number
        name: string
    }): Promise<void> {
        const { id, name } = payload
        await sectionService.updateSection(id, { name }).then(
            (response: any) => {
                this.context.commit(projectMutations.section.editSection, {
                    id,
                    name: response.body.name,
                })
            },
            (error: any) => {
                console.error(error)
            }
        )
    }

    @Action
    async [projectActions.section.deleteSection](id: number): Promise<void> {
        await sectionService.deleteSection(id).then(
            () => {
                this.context.commit(projectMutations.section.deleteSection, id)
            },
            (error: any) => {
                console.error(error)
            }
        )
    }

    @Action
    async [projectActions.task.addTask](task: TaskPost): Promise<void> {
        await taskService.createTask(task).then(
            (response: any) => {
                this.context.commit(projectMutations.task.addTask, {
                    task: response.body,
                    projectId: task.projectId,
                    sectionId: task.sectionId,
                })
            },
            (error: any) => {
                console.error(error)
            }
        )
    }

    @Action
    async [projectActions.task.editTask](payload: {
        id: number
        data: TaskPatch
        projectId?: number
        sectionId?: number
    }): Promise<void> {
        const { id, data, projectId, sectionId } = payload
        await taskService.updateTaskById(id, data).then(
            (response: any) => {
                const task: Task = response.body
                this.context.commit(projectMutations.task.editTask, { task, projectId, sectionId })
                this.context.commit(projectMutations.sortTasks, sectionId)
            },
            (error: any) => {
                console.error(error)
            }
        )
    }

    @Action
    async [projectActions.task.deleteTask](payload: {
        id: number
        sectionId?: number
    }): Promise<void> {
        await taskService.deleteTaskById(payload.id).then(
            () => {
                this.context.commit(projectMutations.task.deleteTask, payload)
            },
            (error: any) => {
                console.error(error)
            }
        )
    }

    @Action
    async [projectActions.event.addEvent](event: EventPostOrPatch): Promise<void> {
        await eventService.createEvent(event).then(
            (response: any) => this.context.commit(projectMutations.event.addEvent, response.body),
            (error: any) => console.error(error)
        )
    }

    @Action
    async [projectActions.event.editEvent](payload: {
        id: number
        data: EventPostOrPatch
    }): Promise<void> {
        const { id, data } = payload
        await eventService.updateEventById(id, data).then(
            (response: any) => this.context.commit(projectMutations.event.editEvent, response.body),
            (error: any) => console.error(error)
        )
    }

    @Action
    async [projectActions.event.deleteEvent](id: number): Promise<void> {
        await eventService.deleteEventById(id).then(
            (response: any) => this.context.commit(projectMutations.event.deleteEvent, id),
            (error: any) => console.error(error)
        )
    }
}
