import { apiRoutes } from '@/api-routes'
import {
  ActivateUserBody,
  CheckPasswordBody,
  CheckTokenBody,
  ConfirmEmailBody,
  RegisterPost,
  ResendActivationEmailBody,
  ResetPasswordBody,
  ResetPasswordRequestBody,
  ValidatePasswordBody,
  ValidatePasswordResponse,
} from '@/models/auth.model'
import axiosInstance from '@/axios/axios-instance'
import { User } from '@/models/user.model'
import { ValidResponse } from '@/models/common.model'

export function login(data: { email: string; password: string }) {
  return axiosInstance.post(apiRoutes.login, data).then(response => response.data)
}

export function logout(): Promise<void> {
  return axiosInstance.post(apiRoutes.logout).then(response => response.data)
}

export function register(data: RegisterPost): Promise<User> {
  return axiosInstance.post<User>(apiRoutes.register, data).then(response => response.data)
}

export function activateUser(data: ActivateUserBody): Promise<void> {
  return axiosInstance.post(apiRoutes.activateUser, data).then(response => response.data)
}

export function resendActivationEmail(data: ResendActivationEmailBody): Promise<void> {
  return axiosInstance.post(apiRoutes.resendActivationEmail, data).then(response => response.data)
}

export function validatePassword(data: ValidatePasswordBody): Promise<ValidatePasswordResponse> {
  return axiosInstance
    .post<ValidatePasswordResponse>(apiRoutes.validatePassword, data)
    .then(response => response.data)
}

export function resetPasswordRequest(data: ResetPasswordRequestBody): Promise<void> {
  return axiosInstance.post(apiRoutes.resetPasswordRequest, data).then(response => response.data)
}

export function resetPassword(data: ResetPasswordBody): Promise<void> {
  return axiosInstance.post(apiRoutes.resetPassword, data).then(response => response.data)
}

export function confirmEmail(data: ConfirmEmailBody): Promise<void> {
  return axiosInstance.post(apiRoutes.confirmEmail, data).then(response => response.data)
}

export function checkToken(data: CheckTokenBody): Promise<ValidResponse> {
  return axiosInstance
    .post<ValidResponse>(apiRoutes.checkToken, data)
    .then(response => response.data)
}

export function checkPassword(data: CheckPasswordBody): Promise<ValidResponse> {
  return axiosInstance
    .post<ValidResponse>(apiRoutes.checkPassword, data)
    .then(response => response.data)
}
