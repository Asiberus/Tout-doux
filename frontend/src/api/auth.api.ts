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
import { http } from '@/axios/http'
import { User } from '@/models/user.model'
import { ValidResponse } from '@/models/common.model'
import { LoginResponse } from '@/models/login.model'

export function login(data: { email: string; password: string }): Promise<LoginResponse> {
  return http.post<LoginResponse>(apiRoutes.login, data)
}

export function logout(): Promise<void> {
  return http.post(apiRoutes.logout)
}

export function register(data: RegisterPost): Promise<User> {
  return http.post<User>(apiRoutes.register, data)
}

export function activateUser(data: ActivateUserBody): Promise<void> {
  return http.post(apiRoutes.activateUser, data)
}

export function resendActivationEmail(data: ResendActivationEmailBody): Promise<void> {
  return http.post(apiRoutes.resendActivationEmail, data)
}

export function validatePassword(data: ValidatePasswordBody): Promise<ValidatePasswordResponse> {
  return http.post<ValidatePasswordResponse>(apiRoutes.validatePassword, data)
}

export function resetPasswordRequest(data: ResetPasswordRequestBody): Promise<void> {
  return http.post(apiRoutes.resetPasswordRequest, data)
}

export function resetPassword(data: ResetPasswordBody): Promise<void> {
  return http.post(apiRoutes.resetPassword, data)
}

export function confirmEmail(data: ConfirmEmailBody): Promise<void> {
  return http.post(apiRoutes.confirmEmail, data)
}

export function checkToken(data: CheckTokenBody): Promise<ValidResponse> {
  return http.post<ValidResponse>(apiRoutes.checkToken, data)
}

export function checkPassword(data: CheckPasswordBody): Promise<ValidResponse> {
  return http.post<ValidResponse>(apiRoutes.checkPassword, data)
}
