import DailyTaskOverview from '@/views/daily-task/daily-task-overview/DailyTaskOverview.vue'
import DailyUpdate from '@/views/daily-task/daily-update/DailyUpdate.vue'
import { RouteConfig } from 'vue-router'

export const dailyTaskRoutes: Array<RouteConfig> = [
    {
        path: '/daily-task',
        name: 'daily-task-overview',
        component: DailyTaskOverview,
    },
    {
        path: '/daily-task/:date/update',
        name: 'daily-task-update',
        component: DailyUpdate,
        props: (route: any) => ({
            date: route.params.date,
        }),
    },
]
