import { Vue } from 'vue-property-decorator'
import { Action, Module, Mutation, VuexModule } from 'vuex-module-decorators'
import { Preferences } from '@/models/preferences.model'
import { preferencesService } from '@/api'

const preferencesMutations = {
    setPreferences: 'SET_PREFERENCES',
    updatePreferences: 'UPDATE_PREFERENCES',
    removePreferences: 'REMOVE_PREFERENCES',
}

export const preferencesActions = {
    getPreferences: 'getPreferences',
    updatePreferences: 'updatePreferences',
    removePreferences: 'removePreferences',
}

@Module
export class PreferencesModule extends VuexModule {
    // State
    preferences?: Preferences

    // Mutations
    @Mutation
    private [preferencesMutations.setPreferences](preferences: Preferences): void {
        Vue.set(this, 'preferences', preferences)
    }

    @Mutation
    private [preferencesMutations.updatePreferences](data: Preferences): void {
        if (!this.preferences) return

        Object.assign(this.preferences, data)
    }

    @Mutation
    private [preferencesMutations.removePreferences](): void {
        this.preferences = undefined
    }

    // Actions
    @Action
    async [preferencesActions.getPreferences](): Promise<void> {
        await preferencesService
            .getPreferences()
            .then((response: any) =>
                this.context.commit(preferencesMutations.setPreferences, response.body)
            )
            .catch((error: any) => console.error(error))
    }

    @Action
    async [preferencesActions.updatePreferences](data: Preferences): Promise<void> {
        await preferencesService
            .updatePreferences(data)
            .then((response: any) =>
                this.context.commit(preferencesMutations.updatePreferences, response.body)
            )
            .catch((error: any) => console.error(error))
    }

    @Action
    [preferencesActions.removePreferences](): void {
        this.context.commit(preferencesMutations.removePreferences)
    }
}
