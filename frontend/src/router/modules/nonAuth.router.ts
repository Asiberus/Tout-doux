import { Route, RouteConfig } from 'vue-router'
import Login from '@/views/non-auth/Login.vue'
import { loginGuard } from '@/router/guards'
import Register from '@/views/non-auth/Register.vue'
import { NavigationGuardNext } from 'vue-router/types/router'
import { authApi } from '@/api'
import ResetPasswordRequest from '@/views/non-auth/ResetPasswordRequest.vue'
import ResetPassword from '@/views/non-auth/ResetPassword.vue'
import ConfirmEmail from '@/views/non-auth/ConfirmEmail.vue'

// TODO : When updated to Vue Router 4 remove the loginGuard hack
export const nonAuthRoutes: Array<RouteConfig> = [
    {
        path: '/login',
        name: 'login',
        component: Login,
        // Hack for the loginGuard to be called
        beforeEnter: (to, from, next): void => {
            loginGuard(to, from, next)
        },
    },
    {
        path: '/register',
        name: 'register',
        component: Register,
        // Hack for the loginGuard to be called
        beforeEnter: (to, from, next): void => {
            loginGuard(to, from, next)
        },
    },
    {
        path: '/password-reset-request',
        name: 'password-reset-request',
        component: ResetPasswordRequest,
        // Hack for the loginGuard to be called
        beforeEnter: (to, from, next): void => {
            loginGuard(to, from, next)
        },
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
        path: '/password-reset',
        name: 'password-reset',
        component: ResetPassword,
        props: (route: Route) => ({ uidb64: route.query.uidb64, token: route.query.token }),
    },
    {
        path: '/confirm-email',
        name: 'confirm-email',
        component: ConfirmEmail,
        props: (route: Route) => ({ token: route.query.token }),
    },
]
