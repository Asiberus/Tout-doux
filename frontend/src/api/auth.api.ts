import Vue from 'vue'
import { apiRoutes } from '@/api-routes'

export function login(data: { email: string; password: string }) {
    return Vue.http.post(apiRoutes.login, data)
}

export function logout() {
    return Vue.http.post(apiRoutes.logout)
}
