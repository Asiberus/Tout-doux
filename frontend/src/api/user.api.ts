import { apiRoutes } from '@/api-routes'
import {
  User,
  UserChangeAccountState,
  UserChangeEmail,
  UserChangePassword,
  UserPatch,
} from '@/models/user.model'
import { Pagination, PaginationParams } from '@/models/pagination.model'
import { UniqueResponse } from '@/models/common.model'
import { http } from '@/axios/http'

export interface IsUsernameUniqueParams {
  username: string
  excludeId?: number
}

export interface IsEmailUniqueParams {
  email: string
}

// Admin API

export function getUserList(params: PaginationParams = {}): Promise<Pagination<User[]>> {
  return http.get<Pagination<User[]>>(apiRoutes.user, { params })
}

export function changeAccountState(id: number, data: UserChangeAccountState): Promise<User> {
  return http.post<User>(apiRoutes.userChangeAccountState.replace(':id', id.toString()), data)
}

export function resendActivationEmail(id: number): Promise<void> {
  return http.post(apiRoutes.userResendActivationEmail.replace(':id', id.toString()))
}

export function deleteUser(id: number): Promise<void> {
  return http.delete(apiRoutes.userById.replace(':id', id.toString()))
}

// User connected API

export function getUserConnected(): Promise<User> {
  return http.get<User>(apiRoutes.userConnected)
}

export function updateUserConnected(data: UserPatch): Promise<User> {
  return http.patch<User>(apiRoutes.userConnected, data)
}

export function changePassword(data: UserChangePassword): Promise<void> {
  return http.post(apiRoutes.changePassword, data)
}

export function changeEmail(data: UserChangeEmail): Promise<void> {
  return http.post(apiRoutes.changeEmail, data)
}

export function deleteAccount(): Promise<void> {
  return http.post(apiRoutes.deleteAccount)
}

// Non auth API

export function isUsernameUnique(params: IsUsernameUniqueParams): Promise<UniqueResponse> {
  return http.get<UniqueResponse>(apiRoutes.isUsernameUnique, { params })
}

export function isEmailUnique(params: IsEmailUniqueParams): Promise<UniqueResponse> {
  return http.get<UniqueResponse>(apiRoutes.isEmailUnique, { params })
}
