import { apiRoutes } from '@/api-routes'
import { Preferences } from '@/models/preferences.model'
import { http } from '@/axios/http'

export function getPreferences(): Promise<Preferences> {
  return http.get<Preferences>(apiRoutes.preferences)
}

export function updatePreferences(data: Preferences): Promise<Preferences> {
  return http.patch<Preferences>(apiRoutes.preferences, data)
}
