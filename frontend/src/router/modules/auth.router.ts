import { RouteConfig } from 'vue-router'
import Login from '@/views/auth/Login.vue'
import { loginGuard } from '@/router/guards'
import Register from '@/views/auth/Register.vue'

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
]
