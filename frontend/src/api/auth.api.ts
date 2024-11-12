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
} from '@/models/auth.model'
import axiosInstance from '@/axios/axios-instance'

export function login(data: { email: string; password: string }) {
  return axiosInstance.post(apiRoutes.login, data).then(response => response.data)
}

export function logout() {
  return axiosInstance.post(apiRoutes.logout)
}

export function register(data: RegisterPost) {
  return axiosInstance.post(apiRoutes.register, data)
}

export function activateUser(data: ActivateUserBody) {
  return axiosInstance.post(apiRoutes.activateUser, data)
}

export function resendActivationEmail(data: ResendActivationEmailBody) {
  return axiosInstance.post(apiRoutes.resendActivationEmail, data)
}

export function validatePassword(data: ValidatePasswordBody) {
  return axiosInstance.post(apiRoutes.validatePassword, data)
}

export function resetPasswordRequest(data: ResetPasswordRequestBody) {
  return axiosInstance.post(apiRoutes.resetPasswordRequest, data)
}

export function resetPassword(data: ResetPasswordBody) {
  return axiosInstance.post(apiRoutes.resetPassword, data)
}

export function confirmEmail(data: ConfirmEmailBody) {
  return axiosInstance.post(apiRoutes.confirmEmail, data)
}

export function checkToken(data: CheckTokenBody) {
  return axiosInstance.post(apiRoutes.checkToken, data)
}

export function checkPassword(data: CheckPasswordBody) {
  return axiosInstance.post(apiRoutes.checkPassword, data)
}
