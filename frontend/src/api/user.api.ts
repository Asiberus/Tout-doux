import Vue from 'vue'
import { apiRoutes } from '@/api-routes'

export interface IsUsernameUniqueParams {
    username: string
}

export interface IsEmailUniqueParams {
    email: string
}

export function getUserConnected() {
    return Vue.http.get(apiRoutes.userConnected)
}

export function isUsernameUnique(params: IsUsernameUniqueParams) {
    return Vue.http.get(apiRoutes.isUsernameUnique, { params })
}

export function isEmailUnique(params: IsEmailUniqueParams) {
    return Vue.http.get(apiRoutes.isEmailUnique, { params })
}
