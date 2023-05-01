import Vue from 'vue'
import { apiRoutes } from '@/api-routes'
import { Preferences } from '@/models/preferences.model'

export function getPreferences() {
    return Vue.http.get(apiRoutes.preferences)
}

export function updatePreferences(data: Preferences) {
    return Vue.http.patch(apiRoutes.preferences, data)
}
