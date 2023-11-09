import Agenda from '@/views/agenga/Agenda.vue'
import VueRouter, { RouteConfig } from 'vue-router'
import { projectRoutes } from '@/router/modules/project.router'
import { collectionRoutes } from '@/router/modules/collection.router'
import { dailyRoutes } from '@/router/modules/daily.router'
import { settingsRoutes } from '@/router/modules/settings.router'
import { authGuard } from '@/router/guards'
import { authRoutes } from '@/router/modules/auth.router'
import { profileRoute } from '@/router/modules/profile.router'

const routes: Array<RouteConfig> = [
    {
        path: '/',
        name: 'home',
        redirect: { name: 'daily-summary' },
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
    routes: [
        ...routes,
        ...authRoutes,
        ...projectRoutes,
        ...collectionRoutes,
        ...dailyRoutes,
        ...settingsRoutes,
        ...profileRoute,
    ],
})

router.beforeEach(authGuard)

export default router
