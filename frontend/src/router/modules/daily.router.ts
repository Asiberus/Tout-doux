import DailySummaryComponent from '@/views/daily/daily-summary/DailySummary.vue'
import DailyUpdate from '@/views/daily/daily-update/DailyUpdate.vue'
import { RouteRecordRaw } from 'vue-router'
import { dailyUpdateGuard } from '@/router/guards'

export const dailyRoutes: RouteRecordRaw[] = [
  {
    path: '/daily/:date?',
    name: 'daily-summary',
    component: DailySummaryComponent,
    props: ({ params, query }) => ({ date: params.date, upcoming: query.upcoming === 'true' }),
  },
  {
    path: '/daily/:date/update/:step(task|event)',
    name: 'daily-update',
    component: DailyUpdate,
    props: ({ params }) => ({ date: params.date, step: params.step }),
    beforeEnter: dailyUpdateGuard,
  },
]
