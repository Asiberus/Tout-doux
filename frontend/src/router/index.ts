import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import { projectRoutes } from '@/router/modules/project.router'
import { collectionRoutes } from '@/router/modules/collection.router'
import { dailyTaskRoutes } from '@/router/modules/daily-task.router'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
    {
        path: '/',
        name: 'Home',
        redirect: { name: 'daily-task-overview' },
    },
]

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes: [...routes, ...projectRoutes, ...collectionRoutes, ...dailyTaskRoutes],
})

export default router
