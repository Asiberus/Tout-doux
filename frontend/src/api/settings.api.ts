import Vue from 'vue'
import { apiRoutes } from '@/api-routes'
import { Settings } from '@/models/settings.model'

export function getSettings() {
    return Vue.http.get(apiRoutes.settings)
}

export function updateSettings(data: Settings) {
    return Vue.http.patch(apiRoutes.settings, data)
}
