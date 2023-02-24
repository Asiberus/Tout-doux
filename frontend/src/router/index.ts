import Agenda from '@/views/agenga/Agenda.vue'
import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import { projectRoutes } from '@/router/modules/project.router'
import { collectionRoutes } from '@/router/modules/collection.router'
import { dailyRoutes } from '@/router/modules/daily.router'
import { settingsRoutes } from '@/router/modules/settings.router'

Vue.use(VueRouter)

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
    routes: [...routes, ...projectRoutes, ...collectionRoutes, ...dailyRoutes, ...settingsRoutes],
})

export default router
