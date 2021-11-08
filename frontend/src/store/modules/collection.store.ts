import { collectionService } from '@/api/collection.api'
import { taskService } from '@/api/task.api'
import { CollectionModel } from '@/models/collection.model'
import { TaskModel } from '@/models/task.model'
import { Vue } from 'vue-property-decorator'
import { Action, Module, Mutation, VuexModule } from 'vuex-module-decorators'

export const collectionMutations = {
    setCurrentCollection: 'SET_CURRENT_COLLECTION',
    updateProperties: 'UPDATE_COLLECTION_PROPERTIES',
    task: {
        addTask: 'COLLECTION_ADD_TASK',
        editTask: 'COLLECTION_EDIT_TASK',
        deleteTask: 'COLLECTION_DELETE_TASK',
    },
}

export const collectionActions = {
    retrieveCollection: 'retrieveCollection',
    updateProperties: 'updateCollectionProperties',
    task: {
        addTask: 'collectionAddTask',
        editTask: 'collectionEditTask',
        deleteTask: 'collectionDeleteTask',
    },
}

@Module
export class CollectionModule extends VuexModule {
    // State
    currentCollection?: CollectionModel

    // Mutations
    @Mutation
    private [collectionMutations.setCurrentCollection](
        collection: CollectionModel | undefined
    ): void {
        // Due to Vue reactivity lack with undefined properties with need to call the Vue.set function
        Vue.set(this, 'currentCollection', collection)
    }

    @Mutation
    private [collectionMutations.updateProperties](payload: {
        name: string
        description: string
    }): void {
        if (!this.currentCollection) return

        Object.assign(this.currentCollection, payload)
    }

    @Mutation
    private [collectionMutations.task.addTask](task: TaskModel): void {
        if (!this.currentCollection) return

        this.currentCollection.tasks.unshift(task)
    }

    @Mutation
    private [collectionMutations.task.editTask](task: TaskModel): void {
        if (!this.currentCollection) return

        const t = this.currentCollection.tasks.find(t => t.id === task.id)
        Object.assign(t, task)
    }

    @Mutation
    private [collectionMutations.task.deleteTask](id: number): void {
        if (!this.currentCollection) return

        const index = this.currentCollection.tasks.findIndex(t => t.id === id)
        if (index !== -1) this.currentCollection.tasks.splice(index, 1)
    }

    // Actions
    @Action
    async [collectionActions.retrieveCollection](id: number): Promise<void> {
        await collectionService.getCollectionById(id).then(
            (response: any) => {
                this.context.commit(collectionMutations.setCurrentCollection, response.body)
            },
            (error: any) => {
                // TODO: redirect to collection list
                console.error(error)
                this.context.commit(collectionMutations.setCurrentCollection, undefined)
            }
        )
    }

    @Action
    async [collectionActions.updateProperties](payload: {
        id: number
        data: Partial<CollectionModel>
    }): Promise<void> {
        const { id, data } = payload
        collectionService.updateCollection(id, data).then(
            (response: any) => {
                const { name, description } = response.body
                this.context.commit(collectionMutations.updateProperties, { name, description })
            },
            (error: any) => {
                console.error(error)
            }
        )
    }

    @Action
    async [collectionActions.task.addTask](task: Partial<TaskModel>): Promise<void> {
        await taskService.createTask(task).then(
            (response: any) => {
                this.context.commit(collectionMutations.task.addTask, response.body)
            },
            (error: any) => {
                console.error(error)
            }
        )
    }

    @Action
    async [collectionActions.task.editTask](payload: {
        id: number
        taskForm: Partial<TaskModel>
    }): Promise<void> {
        const { id, taskForm } = payload
        await taskService.updateTaskById(id, taskForm).then(
            (response: any) => {
                this.context.commit(collectionMutations.task.editTask, response.body)
            },
            (error: any) => {
                console.error(error)
            }
        )
    }

    @Action
    async [collectionActions.task.deleteTask](id: number): Promise<void> {
        await taskService.deleteTaskById(id).then(
            () => {
                this.context.commit(collectionMutations.task.deleteTask, id)
            },
            (error: any) => {
                console.error(error)
            }
        )
    }
}
