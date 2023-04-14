import { Vue } from 'vue-property-decorator'
import { Action, Module, Mutation, VuexModule } from 'vuex-module-decorators'
import { Settings } from '@/models/settings.model'
import { settingsService } from '@/api'

const settingsMutations = {
    setSettings: 'SET_SETTINGS',
    updateSettings: 'UPDATE_SETTINGS',
}

export const settingsActions = {
    getSettings: 'getSettings',
    updateSettings: 'updateSettings',
}

@Module
export class SettingsModule extends VuexModule {
    // State
    settings?: Settings

    // Mutations
    @Mutation
    private [settingsMutations.setSettings](settings: Settings): void {
        Vue.set(this, 'settings', settings)
    }

    @Mutation
    private [settingsMutations.updateSettings](data: Settings): void {
        if (!this.settings) return

        Object.assign(this.settings, data)
    }

    // Actions
    @Action
    async [settingsActions.getSettings](): Promise<void> {
        await settingsService
            .getSettings()
            .then((response: any) =>
                this.context.commit(settingsMutations.setSettings, response.body)
            )
            .catch((error: any) => console.error(error))
    }

    @Action
    async [settingsActions.updateSettings](data: Settings): Promise<void> {
        await settingsService
            .updateSettings(data)
            .then((response: any) =>
                this.context.commit(settingsMutations.updateSettings, response.body)
            )
            .catch((error: any) => console.error(error))
    }
}
