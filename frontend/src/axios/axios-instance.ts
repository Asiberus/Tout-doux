import axios from 'axios'
import { config } from '@/config'
import { authService } from '@/services'
import router from '@/router'

const axiosInstance = axios.create({
  baseURL: config.API_URL,
  // TODO : see if we add other options
})

axiosInstance.interceptors.request.use(requestConfig => {
  if (authService.isAuthenticated())
    requestConfig.headers.Authorization = `Bearer ${authService.getToken()}`
  return requestConfig
})

axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response.status === 401) {
      authService.removeToken()
      authService.resetStore()
      router.push({ name: 'login' })
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
