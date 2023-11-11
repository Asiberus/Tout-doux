import Vue from 'vue'
import { apiRoutes } from '@/api-routes'
import { UserPatch } from '@/models/user.model'

export interface IsUsernameUniqueParams {
    username: string
    excludeId?: number
}

export interface IsEmailUniqueParams {
    email: string
}

export function getUserConnected() {
    return Vue.http.get(apiRoutes.userConnected)
}

export function updateUserConnected(data: UserPatch) {
    return Vue.http.patch(apiRoutes.userConnected, data)
}

export function isUsernameUnique(params: IsUsernameUniqueParams) {
    return Vue.http.get(apiRoutes.isUsernameUnique, { params })
}

export function isEmailUnique(params: IsEmailUniqueParams) {
    return Vue.http.get(apiRoutes.isEmailUnique, { params })
}
