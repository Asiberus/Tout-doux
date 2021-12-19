import { sectionService } from '@/api/section.api'
import { taskService } from '@/api/task.api'
import { SectionTask } from '@/models/section.model'
import { Task } from '@/models/task.model'
import { Vue } from 'vue-property-decorator'
import { Action, Module, Mutation, VuexModule } from 'vuex-module-decorators'
import { Project, ProjectTask } from '@/models/project.model'
import { projectService } from '@/api/project.api'

export const projectMutations = {
    setCurrentProject: 'SET_CURRENT_PROJECT',
    updateProperties: 'UPDATE_PROJECT_PROPERTIES',
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
}

@Module
export class ProjectModule extends VuexModule {
    // State
    currentProject?: ProjectTask

    // Mutations
    @Mutation
    private [projectMutations.setCurrentProject](project: ProjectTask | undefined): void {
        // Due to Vue reactivity lack with undefined properties we need to call the Vue.set function
        Vue.set(this, 'currentProject', project)
    }

    @Mutation
    private [projectMutations.updateProperties](payload: {
        name: string
        description: string
        archived: boolean
    }): void {
        if (!this.currentProject) return

        Object.assign(this.currentProject, payload)
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

        const { task, projectId, sectionId } = payload
        if (projectId) {
            const t = this.currentProject.tasks.find(t => t.id === task.id)
            Object.assign(t, task)
        } else if (sectionId) {
            const section = this.currentProject.sections.find(s => s.id === sectionId)
            if (section) {
                const t = section.tasks.find(t => t.id === task.id)
                Object.assign(t, task)
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
        data: Partial<Project>
    }): Promise<void> {
        const { id, data } = payload
        projectService.updateProject(id, data).then(
            (response: any) => {
                const { name, description, archived } = response.body
                this.context.commit(projectMutations.updateProperties, {
                    name,
                    description,
                    archived,
                })
            },
            (error: any) => {
                console.error(error)
            }
        )
    }

    @Action
    async [projectActions.section.addSection](section: Partial<SectionTask>): Promise<void> {
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
    async [projectActions.task.addTask](task: Partial<Task>): Promise<void> {
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
        data: Partial<Task>
        projectId?: number
        sectionId?: number
    }): Promise<void> {
        const { id, data, projectId, sectionId } = payload
        await taskService.updateTaskById(id, data).then(
            (response: any) => {
                this.context.commit(projectMutations.task.editTask, {
                    task: response.body,
                    projectId,
                    sectionId,
                })
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
}
