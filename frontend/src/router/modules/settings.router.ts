import { RouteConfig } from 'vue-router'
import SettingsComponent from '@/views/settings/Settings.vue'
import SettingsGeneral from '@/views/settings/tabs/SettingsGeneral.vue'
import SettingsCommonTasks from '@/views/settings/tabs/SettingsCommonTasks.vue'
import SettingsTags from '@/views/settings/tabs/SettingsTags.vue'

export const settingsRoutes: Array<RouteConfig> = [
    {
        path: '/settings',
        component: SettingsComponent,
        children: [
            {
                path: '',
                name: 'settings-general',
                component: SettingsGeneral,
            },
            {
                path: 'common-tasks',
                name: 'settings-common-tasks',
                component: SettingsCommonTasks,
            },
            {
                path: 'tags',
                name: 'settings-tags',
                component: SettingsTags,
            },
        ],
    },
]
