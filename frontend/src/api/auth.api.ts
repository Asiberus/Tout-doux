import Vue from 'vue'
import { apiRoutes } from '@/api-routes'
import { RegisterPost } from '@/models/register.model'

export interface ActivateUserBody {
    uidb64: string
    token: string
}

export interface ValidatePasswordBody {
    password: string
}

export function login(data: { email: string; password: string }) {
    return Vue.http.post(apiRoutes.login, data)
}

export function logout() {
    return Vue.http.post(apiRoutes.logout)
}

export function register(data: RegisterPost) {
    return Vue.http.post(apiRoutes.register, data)
}

export function activateUser(data: ActivateUserBody) {
    return Vue.http.post(apiRoutes.activateUser, data)
}

export function validatePassword(data: ValidatePasswordBody) {
    return Vue.http.post(apiRoutes.validatePassword, data)
}
