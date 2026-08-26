import { defineStore } from 'pinia'

export interface Notification {
  text: string
  color: 'success' | 'error'
}

interface NotificationStoreState {
  // Two-way : `<v-snackbar-queue>` réémet le tableau privé de l'élément qu'il vient d'afficher.
  queue: Notification[]
}

interface NotificationStoreActions {
  notifySuccess(text: string): void
  notifyError(text: string): void
}

export const useNotificationStore = defineStore<
  'notification',
  NotificationStoreState,
  Record<string, never>,
  NotificationStoreActions
>('notification', {
  state: (): NotificationStoreState => ({
    queue: [],
  }),
  actions: {
    notifySuccess(text: string): void {
      this.queue.push({ text, color: 'success' })
    },

    notifyError(text: string): void {
      this.queue.push({ text, color: 'error' })
    },
  },
})
