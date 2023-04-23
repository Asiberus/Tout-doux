import DailySummaryComponent from '@/views/daily/daily-summary/DailySummary.vue'
import DailyUpdate from '@/views/daily/daily-update/DailyUpdate.vue'
import moment from 'moment'
import { RouteConfig } from 'vue-router'
import { NavigationGuardNext, Route } from 'vue-router/types/router'
import { dailyUpdateGuard } from '@/router/guards'

export const dailyRoutes: Array<RouteConfig> = [
    {
        path: '/daily',
        name: 'daily-summary',
        component: DailySummaryComponent,
    },
    {
        path: '/daily/:date/update/:step(task|event)',
        name: 'daily-update',
        component: DailyUpdate,
        props: ({ params }) => ({ date: params.date, step: params.step }),
        beforeEnter: dailyUpdateGuard,
    },
]
