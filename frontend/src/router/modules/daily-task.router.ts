import DailyTaskOverview from "@/views/daily-task/daily-task-overview/DailyTaskOverview.vue";
import DailyTaskUpdate from "@/views/daily-task/daily-task-update/DailyTaskUpdate.vue";
import {RouteConfig} from 'vue-router';

export const dailyTaskRoutes: Array<RouteConfig> = [
    {
        path: '/daily-task',
        name: 'daily-task-overview',
        component: DailyTaskOverview
    },
    {
        path: '/daily-task/:date/update',
        name: 'daily-task-update',
        component: DailyTaskUpdate,
        props: (route: any) => ({
            date: route.params.date
        })
    }
];
