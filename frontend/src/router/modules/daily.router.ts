import DailySummaryComponent from '@/views/daily/daily-summary/DailySummary.vue'
import DailyUpdate from '@/views/daily/daily-update/DailyUpdate.vue'
import { RouteConfig } from 'vue-router'
import { dailyUpdateGuard } from '@/router/guards'

export const dailyRoutes: Array<RouteConfig> = [
    {
        path: '/daily/:date?',
        name: 'daily-summary',
        component: DailySummaryComponent,
        props: ({ params }) => ({ date: params.date }),
    },
    {
        path: '/daily/:date/update/:step(task|event)',
        name: 'daily-update',
        component: DailyUpdate,
        props: ({ params }) => ({ date: params.date, step: params.step }),
        beforeEnter: dailyUpdateGuard,
    },
]
