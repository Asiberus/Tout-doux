import { apiRoutes } from '@/api-routes'
import {
  UserChangeAccountState,
  UserChangeEmail,
  UserChangePassword,
  UserPatch,
} from '@/models/user.model'
import { PaginationParams } from '@/models/pagination.model'
import axiosInstance from '@/axios/axios-instance'

export interface IsUsernameUniqueParams {
  username: string
  excludeId?: number
}

export interface IsEmailUniqueParams {
  email: string
}

// Admin API

export function getUserList(params: PaginationParams = {}) {
  return axiosInstance.get(apiRoutes.user, { params }).then(response => response.data)
}

export function changeAccountState(id: number, data: UserChangeAccountState) {
  return axiosInstance
    .post(apiRoutes.userChangeAccountState.replace(':id', id.toString()), data)
    .then(response => response.data)
}

export function resendActivationEmail(id: number) {
  return axiosInstance
    .post(apiRoutes.userResendActivationEmail.replace(':id', id.toString()))
    .then(response => response.data)
}

export function deleteUser(id: number) {
  return axiosInstance
    .delete(apiRoutes.userById.replace(':id', id.toString()))
    .then(response => response.data)
}

// User connected API

export function getUserConnected() {
  return axiosInstance.get(apiRoutes.userConnected).then(response => response.data)
}

export function updateUserConnected(data: UserPatch) {
  return axiosInstance.patch(apiRoutes.userConnected, data).then(response => response.data)
}

export function changePassword(data: UserChangePassword) {
  return axiosInstance.post(apiRoutes.changePassword, data).then(response => response.data)
}

export function changeEmail(data: UserChangeEmail) {
  return axiosInstance.post(apiRoutes.changeEmail, data).then(response => response.data)
}

export function deleteAccount() {
  return axiosInstance.post(apiRoutes.deleteAccount).then(response => response.data)
}

// Non auth API

export function isUsernameUnique(params: IsUsernameUniqueParams) {
  return axiosInstance.get(apiRoutes.isUsernameUnique, { params }).then(response => response.data)
}

export function isEmailUnique(params: IsEmailUniqueParams) {
  return axiosInstance.get(apiRoutes.isEmailUnique, { params }).then(response => response.data)
}
