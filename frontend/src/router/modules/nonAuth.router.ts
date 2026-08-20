import { RouteLocationNormalized, RouteRecordRaw } from 'vue-router'
import Login from '@/views/non-auth/Login.vue'
import { loginGuard } from '../guards/login.guard'
import Register from '@/views/non-auth/Register.vue'
import ResetPasswordRequest from '@/views/non-auth/ResetPasswordRequest.vue'
import ResetPassword from '@/views/non-auth/ResetPassword.vue'
import ConfirmEmail from '@/views/non-auth/ConfirmEmail.vue'
import ActivateUser from '@/views/non-auth/ActivateUser.vue'

export const nonAuthRoutes: RouteRecordRaw[] = [
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
    path: '/password-reset-request',
    name: 'password-reset-request',
    component: ResetPasswordRequest,
    props: (route: RouteLocationNormalized) => ({ email: route.query.email }),
    beforeEnter: loginGuard,
  },
  {
    path: '/activate',
    name: 'activate',
    // Activate user and then redirect to /login
    component: ActivateUser,
    props: (route: RouteLocationNormalized) => ({
      uidb64: route.query.uidb64,
      token: route.query.token,
    }),
  },
  {
    path: '/password-reset',
    name: 'password-reset',
    component: ResetPassword,
    props: (route: RouteLocationNormalized) => ({
      uidb64: route.query.uidb64,
      token: route.query.token,
    }),
  },
  {
    path: '/confirm-email',
    name: 'confirm-email',
    component: ConfirmEmail,
    props: (route: RouteLocationNormalized) => ({ token: route.query.token }),
  },
]
