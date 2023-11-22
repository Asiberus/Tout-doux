import Agenda from '@/views/agenga/Agenda.vue'
import VueRouter, { RouteConfig } from 'vue-router'
import { authGuard } from '@/router/guards'
import AuthenticatedLayout from '@/layout/AuthenticatedLayout.vue'
import NonAuthenticatedLayout from '@/layout/NonAuthenticatedLayout.vue'
import {
    administrationRoutes,
    collectionRoutes,
    dailyRoutes,
    nonAuthRoutes,
    profileRoute,
    projectRoutes,
    settingsRoutes,
} from '@/router/modules'
import store from '@/store'
import { authService } from '@/services'
import FeedbackComponent from '@/views/feedback/Feedback.vue'

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
            {
                path: '/feedback',
                name: 'feedback',
                component: FeedbackComponent,
            },
            ...projectRoutes,
            ...collectionRoutes,
            ...dailyRoutes,
            ...settingsRoutes,
            ...profileRoute,
            ...administrationRoutes,
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

// If the user is authenticated, fetch the user & preferences data
router.beforeEach((to, from, next) => {
    if (from === VueRouter.START_LOCATION && authService.isAuthenticated())
        store.dispatch('init').then(next)
    else next()
})
router.beforeEach(authGuard)

export default router
