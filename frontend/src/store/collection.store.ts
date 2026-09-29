import { CollectionDetail, CollectionPatch } from '@/models/collection.model'
import { Task, TaskPatch, TaskPost } from '@/models/task.model'
import { filterCompleted, filterUncompleted } from '@/utils/task.utils'
import { MoveAnchors } from '@/models/ordering.model'
import { useNotificationStore } from '@/store/notification.store'
import {
  applyMove,
  createMoveQueue,
  moveFailureMessage,
  repositionAfterToggle,
} from '@/utils/ordering.utils'
import { defineStore } from 'pinia'
import { collectionApi, taskApi } from '@/api'

interface CollectionStoreState {
  currentCollection?: CollectionDetail
}

interface CollectionStoreGetters
  extends Record<string, (() => unknown) | ((state: CollectionStoreState) => unknown)> {
  completedTasks(state: CollectionStoreState): Task[]
  uncompletedTasks(state: CollectionStoreState): Task[]
  loadedCollection(state: CollectionStoreState): CollectionDetail
}

interface CollectionStoreActions {
  retrieveCollection(id: number): Promise<void>
  removeCurrentCollection(): void
  updateProperties(data: CollectionPatch): Promise<void>
  addTask(task: TaskPost): Promise<void>
  editTask(id: number, data: TaskPatch): Promise<void>
  deleteTask(id: number): Promise<void>
  moveTask(taskId: number, anchors: MoveAnchors): Promise<void>
}

const moveQueue = createMoveQueue(error => {
  const collectionStore = useCollectionStore()
  useNotificationStore().notifyError(moveFailureMessage(error))
  if (collectionStore.currentCollection)
    collectionStore.retrieveCollection(collectionStore.currentCollection.id)
})

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
      return filterCompleted(state.currentCollection.tasks)
    },
    uncompletedTasks(state: CollectionStoreState): Task[] {
      if (!state.currentCollection) return []
      return filterUncompleted(state.currentCollection.tasks)
    },
    loadedCollection(state): CollectionDetail {
      if (!state.currentCollection)
        throw new Error('currentCollection accessed before being loaded')
      return state.currentCollection
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

      await collectionApi.updateCollection(this.currentCollection.id, data).then(
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
          if (!this.currentCollection) return

          this.currentCollection.tasks.unshift(response)
        },
        error => console.error(error)
      )
    },

    async editTask(id: number, data: TaskPatch): Promise<void> {
      await taskApi.updateTaskById(id, data).then(
        (updatedTask: Task) => {
          if (!this.currentCollection) return

          const { tasks } = this.currentCollection
          const taskToUpdate = tasks.find(task => task.id === updatedTask.id)
          if (!taskToUpdate) return

          const toggled = taskToUpdate.completed !== updatedTask.completed
          Object.assign(taskToUpdate, updatedTask)
          if (toggled) repositionAfterToggle(tasks, taskToUpdate)
        },
        error => console.error(error)
      )
    },

    moveTask(taskId: number, anchors: MoveAnchors): Promise<void> {
      if (!this.currentCollection) return Promise.resolve()

      applyMove(this.currentCollection.tasks, taskId, anchors)
      return moveQueue.enqueue(async () => {
        const { position } = await taskApi.moveTask(taskId, anchors)
        const task = this.currentCollection?.tasks.find(({ id }) => id === taskId)
        if (task) task.position = position
      })
    },

    async deleteTask(id: number): Promise<void> {
      await taskApi.deleteTaskById(id).then(
        () => {
          if (!this.currentCollection) return
          const index = this.currentCollection.tasks.findIndex(t => t.id === id)
          if (index !== -1) this.currentCollection.tasks.splice(index, 1)
        },
        error => {
          console.error(error)
        }
      )
    },
  },
})
