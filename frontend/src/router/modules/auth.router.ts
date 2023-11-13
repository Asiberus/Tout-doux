import { Route, RouteConfig } from 'vue-router'
import Login from '@/views/auth/Login.vue'
import { loginGuard } from '@/router/guards'
import Register from '@/views/auth/Register.vue'
import { NavigationGuardNext } from 'vue-router/types/router'
import { authApi } from '@/api'
import ResetPasswordRequest from '@/views/auth/ResetPasswordRequest.vue'
import ResetPassword from '@/views/auth/ResetPassword.vue'
import ConfirmEmail from '@/views/auth/ConfirmEmail.vue'

export const authRoutes: Array<RouteConfig> = [
    {
        path: '/login',
        name: 'login',
        component: Login,
        beforeEnter: loginGuard,
    },
    {
        path: '/register',
        name: 'register',
        component: Register,
        beforeEnter: loginGuard,
    },
    {
        path: '/activate',
        name: 'activate',
        // Activate user and then redirect to /login
        beforeEnter: (to: Route, _from: Route, next: NavigationGuardNext) => {
            const { uidb64, token } = to.query
            if (typeof uidb64 !== 'string' || typeof token !== 'string') {
                next({ name: 'login' })
                return
            }

            authApi
                .activateUser({ uidb64, token })
                .then(() => {
                    console.log('User successfully activated')
                    // TODO : add alert
                })
                .catch(() => {
                    console.error('An error occurred')
                    // TODO : add message and button to resend mail
                })
                .finally(() => next({ name: 'login' }))
        },
    },
    {
        path: '/password-reset-request',
        name: 'password-reset-request',
        component: ResetPasswordRequest,
        beforeEnter: loginGuard,
    },
    {
        path: '/password-reset',
        name: 'password-reset',
        component: ResetPassword,
        props: (route: Route) => ({ uidb64: route.query.uidb64, token: route.query.token }),
        beforeEnter: loginGuard,
    },
    {
        path: '/confirm-email',
        name: 'confirm-email',
        component: ConfirmEmail,
        props: (route: Route) => ({ token: route.query.token }),
    },
]
