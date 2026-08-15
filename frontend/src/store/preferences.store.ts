import { Preferences } from '@/models/preferences.model'
import { preferencesApi } from '@/api'
import { defineStore } from 'pinia'

// TODO : flattened the preferences ?
interface PreferencesStoreState {
  preferences?: Preferences
}

interface PreferencesStoreGetters
  extends Record<string, (state: PreferencesStoreState) => unknown> {
  loadedPreferences(state: PreferencesStoreState): Preferences
}

interface PreferencesStoreActions {
  getPreferences(): Promise<void>
  updatePreferences(data: Preferences): Promise<void>
  removePreferences(): void
}

export const usePreferencesStore = defineStore<
  'preferences',
  PreferencesStoreState,
  PreferencesStoreGetters,
  PreferencesStoreActions
>('preferences', {
  state: (): PreferencesStoreState => ({
    preferences: undefined,
  }),
  getters: {
    loadedPreferences(state): Preferences {
      if (!state.preferences) throw new Error('preferences accessed before being loaded')
      return state.preferences
    },
  },
  actions: {
    async getPreferences(): Promise<void> {
      await preferencesApi
        .getPreferences()
        .then(response => (this.preferences = response))
        .catch(error => console.error(error))
    },

    async updatePreferences(data: Preferences): Promise<void> {
      await preferencesApi
        .updatePreferences(data)
        .then(response => (this.preferences = { ...this.preferences, ...response }))
        .catch(error => console.error(error))
    },

    removePreferences(): void {
      this.preferences = undefined
    },
  },
})
