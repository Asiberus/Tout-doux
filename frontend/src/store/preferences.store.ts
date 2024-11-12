import { Preferences } from '@/models/preferences.model'
import { preferencesApi } from '@/api'
import { defineStore } from 'pinia'

// TODO : flattened the preferences ?
interface PreferencesStoreState {
  preferences?: Preferences
}

interface PreferencesStoreActions {
  getPreferences(): Promise<void>
  updatePreferences(data: Preferences): Promise<void>
  removePreferences(): void
}

export const usePreferencesStore = defineStore<
  'preferences',
  PreferencesStoreState,
  unknown,
  PreferencesStoreActions
>('preferences', {
  state: (): PreferencesStoreState => ({
    preferences: undefined,
  }),
  actions: {
    async getPreferences(): Promise<void> {
      await preferencesApi
        .getPreferences()
        .then((response: any) => {
          this.preferences = response
        })
        .catch((error: any) => console.error(error))
    },

    async updatePreferences(data: Preferences): Promise<void> {
      await preferencesApi
        .updatePreferences(data)
        .then((response: any) => {
          this.preferences = { ...this.preferences, response }
        })
        .catch((error: any) => console.error(error))
    },

    removePreferences(): void {
      this.preferences = undefined
    },
  },
})
