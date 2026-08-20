import { getConfigValue } from '@/config/config.loader'

export const config = {
  VERSION: getConfigValue('VERSION'),
  API_URL: getConfigValue('API_URL'),
}
