import Agenda from '@/views/agenga/Agenda.vue'
import VueRouter, { RouteConfig } from 'vue-router'
import { projectRoutes } from '@/router/modules/project.router'
import { collectionRoutes } from '@/router/modules/collection.router'
import { dailyRoutes } from '@/router/modules/daily.router'
import { settingsRoutes } from '@/router/modules/settings.router'
import { authGuard } from '@/router/guards'
import { nonAuthRoutes } from '@/router/modules/nonAuth.router'
import { profileRoute } from '@/router/modules/profile.router'
import AuthenticatedLayout from '@/layout/AuthenticatedLayout.vue'
import NonAuthenticatedLayout from '@/layout/NonAuthenticatedLayout.vue'

const routes: Array<RouteConfig> = [
    {
        path: '',
        component: AuthenticatedLayout,
        children: [
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
            ...projectRoutes,
            ...collectionRoutes,
            ...dailyRoutes,
            ...settingsRoutes,
            ...profileRoute,
        ],
    },
    {
        path: '',
        component: NonAuthenticatedLayout,
        children: nonAuthRoutes,
    },
]

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes,
})

router.beforeEach(authGuard)

export default router
