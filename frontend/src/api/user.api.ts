import Vue from 'vue'
import { apiRoutes } from '@/api-routes'
import {
    UserChangeAccountState,
    UserChangeEmail,
    UserChangePassword,
    UserPatch,
} from '@/models/user.model'
import { PaginationParams } from '@/models/common.model'

export interface IsUsernameUniqueParams {
    username: string
    excludeId?: number
}

export interface IsEmailUniqueParams {
    email: string
}

// Admin API

export function getUserList(params: PaginationParams = {}) {
    return Vue.http.get(apiRoutes.user, { params })
}

export function changeAccountState(id: number, data: UserChangeAccountState) {
    return Vue.http.post(apiRoutes.userChangeAccountState.replace(':id', id.toString()), data)
}

export function resendActivationEmail(id: number) {
    return Vue.http.post(apiRoutes.userResendActivationEmail.replace(':id', id.toString()))
}

export function deleteUser(id: number) {
    return Vue.http.delete(apiRoutes.userById.replace(':id', id.toString()))
}

// User connected API

export function getUserConnected() {
    return Vue.http.get(apiRoutes.userConnected)
}

export function updateUserConnected(data: UserPatch) {
    return Vue.http.patch(apiRoutes.userConnected, data)
}

export function changePassword(data: UserChangePassword) {
    return Vue.http.post(apiRoutes.changePassword, data)
}

export function changeEmail(data: UserChangeEmail) {
    return Vue.http.post(apiRoutes.changeEmail, data)
}

export function deleteAccount() {
    return Vue.http.post(apiRoutes.deleteAccount)
}

// Non auth API

export function isUsernameUnique(params: IsUsernameUniqueParams) {
    return Vue.http.get(apiRoutes.isUsernameUnique, { params })
}

export function isEmailUnique(params: IsEmailUniqueParams) {
    return Vue.http.get(apiRoutes.isEmailUnique, { params })
}
