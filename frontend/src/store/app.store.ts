import { defineStore } from 'pinia'
import { useUserStore } from '@/store/user.store'
import { usePreferencesStore } from '@/store/preferences.store'
import { useProjectStore } from '@/store/project.store'
import { useCollectionStore } from '@/store/collection.store'

interface AppStoreActions {
  init(): Promise
  exit(): void
}

export const useAppStore = defineStore<'app', unknown, unknown, AppStoreActions>('app', {
  actions: {
    init(): Promise {
      const userStore = useUserStore()
      const preferencesStore = usePreferencesStore()

      return Promise.all([userStore.getUser(), preferencesStore.getPreferences()])
    },
    exit(): void {
      const userStore = useUserStore()
      const preferencesStore = usePreferencesStore()
      const projectStore = useProjectStore()
      const collectionStore = useCollectionStore()

      userStore.removeUser()
      preferencesStore.removePreferences()
      projectStore.removeCurrentProject()
      collectionStore.removeCurrentCollection()
    },
  },
})
