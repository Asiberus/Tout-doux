import DailyOverview from '@/views/daily/daily-overview/DailyOverview.vue'
import DailyUpdate from '@/views/daily/daily-update/DailyUpdate.vue'
import { RouteConfig } from 'vue-router'

export const dailyRoutes: Array<RouteConfig> = [
    {
        path: '/daily',
        name: 'daily-overview',
        component: DailyOverview,
    },
    {
        path: '/daily/:date/update/:step(task|event)',
        name: 'daily-update',
        component: DailyUpdate,
        props: ({ params }) => ({ date: params.date, step: params.step }),
    },
]
