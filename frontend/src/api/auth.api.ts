import Vue from 'vue'
import { apiRoutes } from '@/api-routes'
import {
    ActivateUserBody,
    ResetPasswordRequestBody,
    RegisterPost,
    ValidatePasswordBody,
    ResetPasswordBody,
    ConfirmEmailBody,
    CheckTokenBody,
    ResendActivationEmailBody,
    CheckPasswordBody,
} from '@/models/auth.model'

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

export function resendActivationEmail(data: ResendActivationEmailBody) {
    return Vue.http.post(apiRoutes.resendActivationEmail, data)
}

export function validatePassword(data: ValidatePasswordBody) {
    return Vue.http.post(apiRoutes.validatePassword, data)
}

export function resetPasswordRequest(data: ResetPasswordRequestBody) {
    return Vue.http.post(apiRoutes.resetPasswordRequest, data)
}

export function resetPassword(data: ResetPasswordBody) {
    return Vue.http.post(apiRoutes.resetPassword, data)
}

export function confirmEmail(data: ConfirmEmailBody) {
    return Vue.http.post(apiRoutes.confirmEmail, data)
}

export function checkToken(data: CheckTokenBody) {
    return Vue.http.post(apiRoutes.checkToken, data)
}

export function checkPassword(data: CheckPasswordBody) {
    return Vue.http.post(apiRoutes.checkPassword, data)
}
