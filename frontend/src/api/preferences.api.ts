import { apiRoutes } from '@/api-routes'
import { Preferences } from '@/models/preferences.model'
import axiosInstance from '@/axios/axios-instance'

export function getPreferences() {
  return axiosInstance.get(apiRoutes.preferences).then(response => response.data)
}

export function updatePreferences(data: Preferences) {
  return axiosInstance.patch(apiRoutes.preferences, data).then(response => response.data)
}
