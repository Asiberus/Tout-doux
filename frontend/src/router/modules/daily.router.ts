import DailyOverview from '@/views/daily/daily-overview/DailyOverview.vue'
import DailyUpdate from '@/views/daily/daily-update/DailyUpdate.vue'
import moment from 'moment'
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
        beforeEnter: (to, from, next) => {
            const { date, step } = to.params
            if (moment().isSame(date, 'day')) next()
            else
                next({
                    name: 'daily-update',
                    params: { date: moment().format('YYYY-MM-DD'), step },
                })
        },
    },
]
