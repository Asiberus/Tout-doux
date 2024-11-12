import { apiRoutes } from '@/api-routes'
import { Preferences } from '@/models/preferences.model'
import axiosInstance from '@/axios/axios-instance'

export function getPreferences() {
  return axiosInstance.get(apiRoutes.preferences)
}

export function updatePreferences(data: Preferences) {
  return axiosInstance.patch(apiRoutes.preferences, data)
}
