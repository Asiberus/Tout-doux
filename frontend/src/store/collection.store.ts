import { CollectionDetail, CollectionPatch } from '@/models/collection.model'
import { Task, TaskPatch, TaskPost } from '@/models/task.model'
import { sortByCompletionDate } from '@/utils/task.utils'
import { defineStore } from 'pinia'
import { collectionApi, taskApi } from '@/api'

interface CollectionStoreState {
  currentCollection?: CollectionDetail
}

interface CollectionStoreGetters
  extends Record<string, (() => unknown) | ((state: CollectionStoreState) => unknown)> {
  completedTasks(state: CollectionStoreState): Task[]
  uncompletedTasks(state: CollectionStoreState): Task[]
}

interface CollectionStoreActions {
  retrieveCollection(id: number): Promise<void>
  removeCurrentCollection(): void
  updateProperties(data: CollectionPatch): Promise<void>
  addTask(task: TaskPost): Promise<void>
  editTask(id: number, data: TaskPatch): Promise<void>
  deleteTask(id: number): Promise<void>
  sortTask(): void
}

export const useCollectionStore = defineStore<
  'collection',
  CollectionStoreState,
  CollectionStoreGetters,
  CollectionStoreActions
>('collection', {
  state: (): CollectionStoreState => ({
    currentCollection: undefined,
  }),
  getters: {
    completedTasks(state: CollectionStoreState): Task[] {
      if (!state.currentCollection) return []
      return state.currentCollection.tasks.filter(({ completed }) => !completed)
    },
    uncompletedTasks(state: CollectionStoreState): Task[] {
      if (!state.currentCollection) return []
      return state.currentCollection.tasks.filter(({ completed }) => completed)
    },
  },
  actions: {
    async retrieveCollection(id: number): Promise<void> {
      await collectionApi.getCollectionById(id).then(
        response => (this.currentCollection = response),
        error => {
          // TODO: redirect to collection list
          console.error(error)
          this.removeCurrentCollection()
        }
      )
    },

    removeCurrentCollection(): void {
      this.currentCollection = undefined
    },

    async updateProperties(data: CollectionPatch): Promise<void> {
      if (!this.currentCollection) return

      collectionApi.updateCollection(this.currentCollection.id, data).then(
        response => {
          if (!this.currentCollection) return

          this.currentCollection = { ...this.currentCollection, ...response }
        },
        error => console.error(error)
      )
    },

    async addTask(task: TaskPost): Promise<void> {
      await taskApi.createTask(task).then(
        response => {
          this.currentCollection.tasks.unshift(response)
        },
        error => console.error(error)
      )
    },

    async editTask(id: number, data: TaskPatch): Promise<void> {
      await taskApi.updateTaskById(id, data).then(
        response => {
          const task: Task = response

          const taskToUpdate = this.currentCollection.tasks.find(t => t.id === task.id)
          if (taskToUpdate) Object.assign(taskToUpdate, task)

          this.sortTask()
        },
        error => {
          console.error(error)
        }
      )
    },

    async deleteTask(id: number): Promise<void> {
      await taskApi.deleteTaskById(id).then(
        () => {
          const index = this.currentCollection.tasks.findIndex(t => t.id === id)
          if (index !== -1) this.currentCollection.tasks.splice(index, 1)
        },
        error => {
          console.error(error)
        }
      )
    },

    sortTask(): void {
      this.currentCollection.tasks = [...sortByCompletionDate(this.currentCollection.tasks)]
    },
  },
})
