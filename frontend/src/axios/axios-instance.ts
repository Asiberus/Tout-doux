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
  response => response.data,
  error => {
    if (error.response.status === 401) {
      authService.removeToken()
      authService.resetStore()
      router.push({ name: 'login' })
    }
  }
)

// Vue.http.interceptors.push((request: HttpOptions) => {
//   if (authService.isAuthenticated())
//     request.headers.set('Authorization', `Bearer ${authService.getToken()}`)
// })
//
// Vue.http.interceptors.push(() => {
//   return (response: HttpResponse) => {
//     if (response.status === 401) {
//       authService.removeToken()
//       authService.resetStore()
//
//       Vue.router.push({ name: 'login' })
//     }
//   }
// })

export default axiosInstance
