import Agenda from '@/views/agenga/Agenda.vue'
import Login from '@/views/auth/Login.vue'
import VueRouter, { RouteConfig } from 'vue-router'
import { projectRoutes } from '@/router/modules/project.router'
import { collectionRoutes } from '@/router/modules/collection.router'
import { dailyRoutes } from '@/router/modules/daily.router'
import { settingsRoutes } from '@/router/modules/settings.router'
import { authGuard } from '@/router/guards/auth.guard'
import { loginGuard } from '@/router/guards/login.guard'

const routes: Array<RouteConfig> = [
    {
        path: '/',
        name: 'home',
        redirect: { name: 'daily-summary' },
    },
    {
        path: '/login',
        name: 'login',
        component: Login,
        beforeEnter: loginGuard,
    },
    {
        path: '/agenda',
        name: 'agenda',
        component: Agenda,
    },
]

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes: [...routes, ...projectRoutes, ...collectionRoutes, ...dailyRoutes, ...settingsRoutes],
})

router.beforeEach(authGuard)

export default router
